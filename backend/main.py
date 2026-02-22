"""FastAPI backend for the AI Governance Assessment Framework.

Provides REST API for:
- Knowledge base retrieval (dimensions, criteria, indicators)
- Assessment scoring (DimScore, GesamtScore)
- Gap analysis with prioritized recommendations
- RAG-powered chat assistant with LLM streaming (semantic vector search)
- Contextual AI assistant (POST /api/assistant)
- Structured dimension analysis (POST /api/assessment/analyze-dimension)
- Deep gap analysis (POST /api/results/deep-analysis)
- Industry benchmark data (GET /api/benchmarks)
- Streaming executive summary (POST /api/results/stream-summary)

Security features:
- Prompt injection detection and sanitization
- Input length limits and content validation
- Security event logging
"""
import json
import logging
import os
from pathlib import Path
from typing import Optional

# Configure logging for security events
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("governance.api")

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from models import (
    AssessmentRequest, AssessmentResponse, DimensionResult,
    CriterionScore, ScopingData, GapItem,
    DimensionAnalysisRequest, DeepAnalysisRequest, AssistantRequest, SummaryRequest,
)
from scoring import calculate_dim_score, calculate_overall_score, get_maturity_label
from analysis import analyze_gaps
from rag import RAGEngine
from llm_client import (
    stream_chat,
    build_assistant_prompt, stream_assistant,
    build_dimension_analysis_prompt, stream_dimension_analysis,
    build_deep_analysis_prompt, stream_deep_analysis,
    stream_summary_chunks,
)
from conversation import sanitize_input, compress_conversation

# Load .env
load_dotenv(Path(__file__).parent / ".env", override=True)

app = FastAPI(
    title="KI-Governance Assessment Framework API",
    description="REST API für das KI-Governance-Bewertungsframework zur Umsetzung des EU AI Acts",
    version="2.0.0"
)

# CORS — allow Vercel preview/production URLs + localhost
# Since access is controlled via frontend access code, we allow all origins
# for this research prototype. For production, restrict to specific domains.
_env_origins = os.getenv("CORS_ORIGINS", "")
if _env_origins == "*":
    cors_origins = ["*"]
else:
    cors_origins = (
        [o.strip() for o in _env_origins.split(",") if o.strip()]
        if _env_origins
        else ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True if cors_origins != ["*"] else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load knowledge base
KB_PATH = Path(__file__).parent / "knowledge_base.json"
with open(KB_PATH, "r", encoding="utf-8") as f:
    KNOWLEDGE_BASE = json.load(f)

# Initialize RAG engine (loads thesis + builds embeddings)
rag_engine = RAGEngine(str(KB_PATH))


# --- Pure lookup helpers ---

def _find_dimension(dimension_id: str) -> Optional[dict]:
    """Pure lookup: find dimension by ID in knowledge base."""
    return next(
        (d for d in KNOWLEDGE_BASE["dimensions"] if d["id"] == dimension_id.upper()),
        None,
    )


def _find_criterion(dimension: dict, criterion_id: str) -> Optional[dict]:
    """Pure lookup: find criterion within a dimension."""
    return next(
        (c for c in dimension.get("criteria", []) if c["id"] == criterion_id.upper()),
        None,
    )


# --- Chat Models (for original /api/chat endpoint) ---

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    dimension_id: Optional[str] = None
    criterion_id: Optional[str] = None
    assessment_context: Optional[dict] = None
    locale: Optional[str] = "de"


# --- Root ---

@app.get("/")
def root():
    return {"message": "KI-Governance Assessment Framework API", "version": "2.0.0"}


# --- Knowledge base ---

@app.get("/api/dimensions")
def get_dimensions():
    """Return all dimensions with their criteria and indicators."""
    return KNOWLEDGE_BASE["dimensions"]


@app.get("/api/dimensions/{dimension_id}")
def get_dimension(dimension_id: str):
    """Return a specific dimension by ID."""
    dim = _find_dimension(dimension_id)
    if dim is None:
        raise HTTPException(status_code=404, detail=f"Dimension {dimension_id} not found")
    return dim


# --- Assessment ---

@app.post("/api/assess", response_model=AssessmentResponse)
def submit_assessment(request: AssessmentRequest):
    """Submit a full assessment and receive scored results with gap analysis."""
    scored_dimensions = []
    for dim in request.dimensions:
        scored_dim = calculate_dim_score(dim)
        scored_dimensions.append(scored_dim)

    overall_score = calculate_overall_score(scored_dimensions, request.weights)
    maturity_label = get_maturity_label(overall_score)
    gaps = analyze_gaps(scored_dimensions, risk_category=request.scoping.risk_category)

    return AssessmentResponse(
        scoping=request.scoping,
        dimensions=scored_dimensions,
        overall_score=overall_score,
        gaps=gaps,
        maturity_label=maturity_label
    )


@app.get("/api/knowledge/{dimension_id}/{criterion_id}")
def get_knowledge(dimension_id: str, criterion_id: str):
    """Return knowledge base entry for a specific criterion."""
    dim = _find_dimension(dimension_id)
    crit = _find_criterion(dim, criterion_id) if dim else None
    if dim is None or crit is None:
        raise HTTPException(
            status_code=404,
            detail=f"Criterion {criterion_id} in dimension {dimension_id} not found"
        )
    return {
        "dimension": dim["name"],
        "article": dim["article"],
        "criterion": crit,
    }


# --- Chat endpoint (original v3 UI) ---

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """RAG-powered chat endpoint with LLM streaming and prompt injection protection.

    Accepts conversation messages + optional assessment context.
    Returns Server-Sent Events (SSE) stream of LLM response chunks.
    """
    # Get the latest user message for RAG retrieval
    last_user_msg = ''
    for msg in reversed(request.messages):
        if msg.role == 'user':
            last_user_msg = msg.content
            break

    if not last_user_msg:
        raise HTTPException(status_code=400, detail="No user message found")

    # --- Input sanitization & prompt injection protection ---
    sanitized_msg, warnings = sanitize_input(last_user_msg)
    if "prompt_injection_detected" in warnings:
        safe_response = {
            "de": "Ich bin Ihr KI-Governance-Assessment-Assistent. Lassen Sie uns mit dem Assessment fortfahren. Können Sie mir mehr über Ihre KI-Governance-Praktiken erzählen?",
            "en": "I am your AI Governance Assessment Assistant. Let us continue with the assessment. Can you tell me more about your AI governance practices?",
            "fr": "Je suis votre assistant d'évaluation de la gouvernance IA. Continuons avec l'évaluation. Pouvez-vous me dire plus sur vos pratiques de gouvernance IA ?",
        }
        async def generate_safe():
            msg = safe_response.get(request.locale, safe_response["de"])
            yield f'data: {json.dumps({"text": msg}, ensure_ascii=False)}\n\n'
            yield "data: [DONE]\n\n"
        return StreamingResponse(
            generate_safe(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
        )

    # RAG retrieval (now with semantic vector search)
    rag_context = rag_engine.retrieve(
        query=sanitized_msg,
        dimension_id=request.dimension_id,
        criterion_id=request.criterion_id,
        max_chunks=4,
        max_tokens=2500,
    )

    # Get dimensions summary for system prompt
    dimensions_summary = rag_engine.get_all_dimensions_summary()

    # Convert messages to dicts
    messages_dicts = [{'role': m.role, 'content': m.content} for m in request.messages]

    # Stream response
    async def generate():
        async for chunk in stream_chat(
            messages=messages_dicts,
            rag_context=rag_context,
            dimensions_summary=dimensions_summary,
            assessment_context=request.assessment_context,
            locale=request.locale or "de",
        ):
            yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.get("/api/chat/status")
def chat_status():
    """Check if chat/LLM is configured and available."""
    provider = os.getenv('LLM_PROVIDER', 'mistral').lower()
    key_map = {
        'openai': 'OPENAI_API_KEY',
        'anthropic': 'ANTHROPIC_API_KEY',
        'mistral': 'MISTRAL_API_KEY',
    }
    model_defaults = {
        'openai': 'gpt-4o-mini',
        'anthropic': 'claude-3-5-haiku-latest',
        'mistral': 'mistral-small-latest',
    }
    has_key = bool(os.getenv(key_map.get(provider, 'MISTRAL_API_KEY')))
    return {
        "available": has_key,
        "provider": provider,
        "model": os.getenv('LLM_MODEL', model_defaults.get(provider, 'mistral-small-latest')),
        "rag_chunks_loaded": rag_engine.chunk_count,
        "embeddings_ready": rag_engine.embedding_engine.is_ready,
    }


# --- Structured assessment: Dimension analysis ---

@app.post("/api/assessment/analyze-dimension")
async def analyze_dimension_endpoint(request: DimensionAnalysisRequest):
    """Analyze a completed dimension for consistency and provide AI feedback.

    Focused prompt (~400 tokens) instead of full conversation system prompt (~2500).
    Returns streamed SSE events: text chunks + optional follow-up questions.
    """
    kb_dim = rag_engine.knowledge_base.get(request.dimension_id)
    if not kb_dim:
        raise HTTPException(status_code=404, detail=f"Dimension {request.dimension_id} not found")

    # Sanitize user followup input if present
    followup_text = request.followup_context
    if followup_text:
        followup_text, sec_warnings = sanitize_input(followup_text)
        if "prompt_injection_detected" in sec_warnings:
            followup_text = None

    # RAG retrieval for EU AI Act grounding
    rag_query = followup_text or f"{request.dimension_id} {kb_dim.get('name', '')} assessment analysis"
    rag_context = rag_engine.retrieve_formatted(
        query=rag_query,
        dimension_id=request.dimension_id,
        top_k=3,
    )

    system_prompt = build_dimension_analysis_prompt(
        dimension_id=request.dimension_id,
        dimension_data=kb_dim,
        scores=request.scores,
        scoping=request.scoping,
        locale=request.locale,
        followup_context=followup_text,
        prior_analysis=request.prior_analysis,
        rag_context=rag_context,
    )

    async def generate():
        async for event_json in stream_dimension_analysis(system_prompt):
            yield f"data: {event_json}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


# --- Results page: Deep analysis ---

@app.post("/api/results/deep-analysis")
async def deep_analysis_endpoint(request: DeepAnalysisRequest):
    """Generate a detailed operative action plan for a specific gap.

    Provides context-specific, actionable recommendations with short/medium/long-term
    steps, EU AI Act references, and industry-specific guidance.
    Returns streamed SSE events: text chunks.
    """
    kb_dim = rag_engine.knowledge_base.get(request.dimension_id)
    if not kb_dim:
        raise HTTPException(status_code=404, detail=f"Dimension {request.dimension_id} not found")

    # Sanitize user followup input if present
    followup_text = request.followup
    if followup_text:
        followup_text, sec_warnings = sanitize_input(followup_text)
        if "prompt_injection_detected" in sec_warnings:
            followup_text = None

    # RAG retrieval for EU AI Act grounding
    rag_query = followup_text or f"{request.dimension_id} {kb_dim.get('name', '')} action plan {request.gap_severity}"
    rag_context = rag_engine.retrieve_formatted(
        query=rag_query,
        dimension_id=request.dimension_id,
        top_k=4,
    )

    system_prompt = build_deep_analysis_prompt(
        dimension_id=request.dimension_id,
        dimension_data=kb_dim,
        dim_score=request.dim_score,
        gap_severity=request.gap_severity,
        recommendation=request.recommendation,
        scores=request.scores,
        scoping=request.scoping,
        locale=request.locale,
        followup=followup_text,
        prior_analysis=request.prior_analysis,
        rag_context=rag_context,
    )

    async def generate():
        async for event_json in stream_deep_analysis(system_prompt, request.locale):
            yield f"data: {event_json}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


# --- Contextual AI assistant (assessment + results) ---

@app.post("/api/assistant")
async def assistant_endpoint(request: AssistantRequest):
    """Contextual AI assistant for both assessment and results pages.

    Uses RAG grounding for EU AI Act context. context_type determines
    the prompt template: 'assessment' (dimension-aware) or 'results' (gap-aware).
    Returns streamed SSE events.
    """
    # Input sanitization
    sanitized_q, sec_warnings = sanitize_input(request.question)
    if "prompt_injection_detected" in sec_warnings:
        safe_msg = {
            "de": "Ich bin Ihr KI-Governance-Assistent. Bitte stellen Sie eine Frage zum Assessment oder zum EU AI Act.",
            "en": "I am your AI Governance Assistant. Please ask a question about the assessment or the EU AI Act.",
        }
        async def gen_safe():
            yield f'data: {json.dumps({"type": "text", "content": safe_msg.get(request.locale, safe_msg["de"])}, ensure_ascii=False)}\n\n'
            yield "data: [DONE]\n\n"
        return StreamingResponse(gen_safe(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "Connection": "keep-alive"})

    # Determine dimension for RAG focus
    dimension_id = request.dimension_id if request.context_type == "assessment" else None
    if request.context_type == "results" and request.gaps:
        dimension_id = request.gaps[0].get("dimension_id") if request.gaps else None

    # RAG retrieval (formatted string for system prompt)
    rag_context = rag_engine.retrieve_formatted(
        query=sanitized_q,
        dimension_id=dimension_id,
        top_k=4,
    )

    # Look up dimension data for assessment context
    dim_data = None
    if request.dimension_id:
        dim_data = rag_engine.knowledge_base.get(request.dimension_id)

    system_prompt = build_assistant_prompt(
        context_type=request.context_type,
        rag_context=rag_context,
        dimension_data=dim_data,
        scores=request.scores,
        scoping=request.scoping,
        locale=request.locale,
        gaps=request.gaps,
        overall_score=request.overall_score,
        maturity_label=request.maturity_label,
    )

    async def generate():
        async for event_json in stream_assistant(system_prompt, sanitized_q):
            yield f"data: {event_json}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


# --- Streaming executive summary ---

@app.post("/api/results/stream-summary")
async def stream_summary_endpoint(request: SummaryRequest):
    """Stream the executive summary via SSE — called after results page loads.

    This decouples the slow LLM summary generation from the fast score computation,
    allowing the user to see results immediately while the summary streams in.
    """
    scores_summary = "\n".join(
        f"{d.get('dimension_id', '?')} {d.get('dimension_name', '?')}: {d.get('dim_score', 'N/A')}"
        for d in request.dimensions
    )
    scores_summary += f"\nGesamtscore: {request.overall_score} ({request.maturity_label})"

    gaps_formatted = ""
    if request.gaps:
        gap_lines = []
        for g in request.gaps:
            gap_lines.append(
                f"- {g.get('dimension_id', '?')} {g.get('dimension_name', '?')}: Score {g.get('dim_score', '?')}, "
                f"Schweregrad: {g.get('gap_severity', '?')}, Priorität: {g.get('priority_rank', '?')}\n"
                f"  Empfehlung: {g.get('recommendation', '')}"
            )
        gaps_formatted = "\n".join(gap_lines)

    # RAG retrieval for top gap dimensions
    rag_parts = []
    gap_dim_ids = list(set(g.get("dimension_id", "") for g in request.gaps)) if request.gaps else []
    for dim_id in gap_dim_ids[:2]:
        ctx = rag_engine.retrieve_formatted(
            query=f"{dim_id} governance compliance EU AI Act",
            dimension_id=dim_id,
            top_k=2,
        )
        if ctx:
            rag_parts.append(ctx)
    general_ctx = rag_engine.retrieve_formatted(
        query="EU AI Act compliance requirements high-risk AI systems",
        top_k=2,
    )
    if general_ctx:
        rag_parts.append(general_ctx)
    rag_context = "\n\n".join(rag_parts)

    if request.locale == "de":
        system = f"""Du bist ein KI-Governance-Experte. Erstelle eine handlungsorientierte Executive Summary.

## Struktur (STRIKT einhalten, verwende genau diese ### Überschriften):

### Gesamtbewertung
[1-2 Sätze: Score, Reifegrad, was das für die Organisation bedeutet. Risikokategorie einordnen.]

### Stärken
[Bullet-Points (mit -) für Dimensionen mit Score ≥ 3.0. Konkret benennen, was gut läuft.]

### Kritischer Handlungsbedarf
[Bullet-Points pro Gap: Dimension, Score, WAS fehlt, WARUM es kritisch ist. EU AI Act Artikel referenzieren.]

### Sofort-Maßnahmen (nächste 4 Wochen)
[Nummerierte Liste: 3-5 konkrete, umsetzbare Schritte. Beginne mit dem kritischsten Gap.]

### Mittelfristiger Fahrplan (3-6 Monate)
[2-3 strategische Maßnahmen mit Bezug auf EU AI Act Compliance.]

## Bewertungsdaten:
{scores_summary}

## Gap-Analyse:
{gaps_formatted}

## EU AI Act Kontext (Wissensbasis):
{rag_context}

Antworte auf Deutsch. Sei KONKRET — keine generischen Phrasen. Jeder Punkt muss handlungsorientiert sein."""
    else:
        system = f"""You are an AI governance expert. Create an action-oriented Executive Summary.

## Structure (STRICTLY follow, use exactly these ### headers):

### Overall Assessment
[1-2 sentences: Score, maturity level, what it means for the organization. Risk category context.]

### Strengths
[Bullet points (with -) for dimensions with score ≥ 3.0. Name specifically what works well.]

### Critical Action Needed
[Bullet points per gap: Dimension, score, WHAT is missing, WHY it's critical. Reference EU AI Act articles.]

### Immediate Actions (next 4 weeks)
[Numbered list: 3-5 concrete, actionable steps. Start with the most critical gap.]

### Mid-term Roadmap (3-6 months)
[2-3 strategic measures referencing EU AI Act compliance.]

## Assessment Data:
{scores_summary}

## Gap Analysis:
{gaps_formatted}

## EU AI Act Context (Knowledge Base):
{rag_context}

Be SPECIFIC — no generic phrases. Every point must be action-oriented."""

    async def generate():
        user_msg = request.conversation_summary or "Generate executive summary."
        async for event_json in stream_summary_chunks(system, user_msg):
            yield f"data: {event_json}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


# --- Benchmark data (synthetic industry averages) ---

# These represent aggregated industry benchmarks for comparison.
# In a production system, these would come from real assessment data.
INDUSTRY_BENCHMARKS = {
    "default": {
        "D1": 2.8, "D2": 2.5, "D3": 2.3, "D4": 2.1, "D5": 2.0, "D6": 2.6,
        "overall": 2.38, "label": "Managed", "n_assessments": 47,
    },
    "financial": {
        "D1": 3.2, "D2": 3.0, "D3": 2.8, "D4": 2.5, "D5": 2.3, "D6": 3.0,
        "overall": 2.80, "label": "Defined", "n_assessments": 12,
    },
    "healthcare": {
        "D1": 3.0, "D2": 2.8, "D3": 3.1, "D4": 2.7, "D5": 2.8, "D6": 2.5,
        "overall": 2.82, "label": "Defined", "n_assessments": 8,
    },
    "technology": {
        "D1": 2.6, "D2": 2.9, "D3": 2.0, "D4": 2.3, "D5": 1.8, "D6": 3.2,
        "overall": 2.47, "label": "Managed", "n_assessments": 15,
    },
    "manufacturing": {
        "D1": 2.5, "D2": 2.2, "D3": 2.4, "D4": 1.9, "D5": 2.1, "D6": 2.8,
        "overall": 2.32, "label": "Managed", "n_assessments": 6,
    },
    "public_sector": {
        "D1": 2.7, "D2": 2.4, "D3": 2.9, "D4": 2.6, "D5": 2.5, "D6": 2.1,
        "overall": 2.53, "label": "Defined", "n_assessments": 6,
    },
}


@app.get("/api/benchmarks")
def get_benchmarks(industry: Optional[str] = None):
    """Return industry benchmark data for comparison.

    Args:
        industry: Optional industry filter (financial, healthcare, technology, etc.)
    """
    if industry and industry.lower() in INDUSTRY_BENCHMARKS:
        benchmark = INDUSTRY_BENCHMARKS[industry.lower()]
    else:
        benchmark = INDUSTRY_BENCHMARKS["default"]

    return {
        "benchmark": benchmark,
        "available_industries": list(INDUSTRY_BENCHMARKS.keys()),
    }
