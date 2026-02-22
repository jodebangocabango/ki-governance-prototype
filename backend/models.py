"""Pydantic models for the AI Governance Assessment Framework."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from enum import Enum


class MaturityLevel(int, Enum):
    """Five-level maturity model based on CMMI."""
    INITIAL = 1
    MANAGED = 2
    DEFINED = 3
    MEASURED = 4
    OPTIMIZING = 5


class CriterionScore(BaseModel):
    """Score for a single assessment criterion."""
    criterion_id: str = Field(..., description="e.g. D1.1")
    score: Optional[int] = Field(None, ge=1, le=5, description="1-5 or None for N/A")
    is_na: bool = Field(False, description="True if criterion is not applicable")


class DimensionResult(BaseModel):
    """Result for a single governance dimension."""
    dimension_id: str
    dimension_name: str
    criteria_scores: list[CriterionScore]
    dim_score: Optional[float] = None
    num_rated: int = 0
    num_na: int = 0


class ScopingData(BaseModel):
    """Scoping phase input data."""
    system_name: str = Field(..., description="Name of the AI system")
    risk_category: str = Field("high-risk", description="high-risk, limited-risk, minimal-risk")
    industry: str = Field("", description="Industry sector")
    organization_size: str = Field("", description="small, medium, large")
    deployment_status: str = Field("production", description="pre-deployment, production")
    # C5: Extended scoping fields
    has_governance_officer: str = Field("no", description="yes or no")
    existing_frameworks: str = Field("", description="Existing governance frameworks")
    num_ai_systems: str = Field("1", description="Number of AI systems: 1, 2-5, 6-20, 20+")


class AssessmentRequest(BaseModel):
    """Full assessment submission."""
    scoping: ScopingData
    dimensions: list[DimensionResult]
    weights: Optional[dict[str, float]] = None


class GapItem(BaseModel):
    """A single governance gap."""
    dimension_id: str
    dimension_name: str
    dim_score: float
    gap_severity: str  # critical, significant, moderate
    priority_rank: int
    recommendation: str


class AssessmentResponse(BaseModel):
    """Full assessment result."""
    scoping: ScopingData
    dimensions: list[DimensionResult]
    overall_score: float
    gaps: list[GapItem]
    maturity_label: str
    agent_summary: Optional[str] = None


# --- Structured assessment models ---

class DimensionAnalysisRequest(BaseModel):
    """Request for AI analysis of a completed dimension."""
    dimension_id: str = Field(..., description="e.g. D1")
    scores: Dict[str, int] = Field(..., description="Criterion scores {D1.1: 3, D1.2: 4, ...}")
    scoping: Dict[str, str] = Field(default_factory=dict, description="Scoping context")
    locale: str = Field("de")
    followup_context: Optional[str] = Field(None, description="User followup question or selected option")
    prior_analysis: Optional[str] = Field(None, description="Previous AI analysis commentary for context")


class AssistantRequest(BaseModel):
    """Request for the contextual AI assistant (assessment + results)."""
    question: str = Field(..., description="User's freeform question")
    context_type: str = Field(..., description="'assessment' or 'results'")
    dimension_id: Optional[str] = Field(None, description="Current dimension (assessment context)")
    scores: Dict[str, int] = Field(default_factory=dict, description="Current criterion scores")
    scoping: Dict[str, str] = Field(default_factory=dict, description="Scoping data")
    gaps: Optional[List[dict]] = Field(None, description="Gap data (results context)")
    overall_score: Optional[float] = Field(None, description="Overall score (results context)")
    maturity_label: Optional[str] = Field(None, description="Maturity label (results context)")
    locale: str = Field("de")


class SummaryRequest(BaseModel):
    """Request for streaming executive summary on results page."""
    dimensions: List[Dict[str, object]] = Field(..., description="Dimension results")
    overall_score: float = Field(..., description="Overall score")
    maturity_label: str = Field("", description="Maturity label")
    gaps: List[Dict[str, object]] = Field(default_factory=list, description="Gap items")
    scoping: Dict[str, str] = Field(default_factory=dict, description="Scoping data")
    conversation_summary: str = Field("", description="AI analyses from assessment")
    locale: str = Field("de")


class DeepAnalysisRequest(BaseModel):
    """Request for deep operative analysis of a gap on the results page."""
    dimension_id: str = Field(..., description="e.g. D5")
    dim_score: float = Field(..., description="Dimension score")
    gap_severity: str = Field(..., description="critical, significant, moderate")
    recommendation: str = Field("", description="Static recommendation as context")
    scoping: Dict[str, str] = Field(default_factory=dict, description="Scoping data")
    scores: Dict[str, int] = Field(default_factory=dict, description="All criterion scores for this dimension")
    locale: str = Field("de")
    followup: Optional[str] = Field(None, description="User followup question")
    prior_analysis: Optional[str] = Field(None, description="Previous deep analysis for context")
