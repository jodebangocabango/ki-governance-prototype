"""
RAG module for the AI Governance Assessment Framework.

Combines:
1. Semantic vector search via Mistral Embeddings (thesis chunks + KB criteria)
2. Structured knowledge base retrieval (dimensions, criteria, indicators)
3. Keyword-based fallback when embeddings are unavailable

Provides context-enriched retrieval for both the chat assistant and
the conversational assessment agent.
"""

import os
import re
import json
from typing import Optional

from embeddings import EmbeddingEngine


THESIS_DIR = os.environ.get('THESIS_DIR') or os.path.normpath(os.path.join(
    os.path.dirname(os.path.abspath(__file__)), 'thesis_chapters'
))

# Mapping of chapter files to readable names
CHAPTER_MAP = {
    '01_Einleitung.tex': 'Einleitung',
    '02_Stand.tex': 'Stand der Forschung',
    '03_Methodik.tex': 'Methodik',
    '04_Untersuchung.tex': 'Untersuchung und Entwicklung',
    '05_Ergebnisse.tex': 'Ergebnisse',
    '06_Fazit.tex': 'Fazit und Ausblick',
    'A3_Kodierleitfaden.tex': 'Anhang: Kodierleitfaden',
    'A5_Bewertungsdimensionen.tex': 'Anhang: Bewertungsdimensionen',
    'A6_Prototyp.tex': 'Anhang: Prototyp',
    'A8_Mapping.tex': 'Anhang: Mapping AI Act → Framework',
}

# Dimension order for iteration
DIMENSION_ORDER = ["D1", "D2", "D3", "D4", "D5", "D6"]


# --- LaTeX processing (pure functions) ---

def strip_latex(text: str) -> str:
    """Remove LaTeX commands, keep readable text."""
    text = re.sub(r'%.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'\\begin\{[^}]+\}(\[[^\]]*\])?', '', text)
    text = re.sub(r'\\end\{[^}]+\}', '', text)
    text = re.sub(r'\\autocite\{[^}]+\}', '', text)
    text = re.sub(r'\\(sub)*section\*?\{([^}]+)\}', r'\2', text)
    text = re.sub(r'\\(textbf|textit|emph|underline)\{([^}]+)\}', r'\2', text)
    text = re.sub(r'\\(ref|label|caption|footnote)\{[^}]+\}', '', text)
    text = re.sub(r'\\[a-zA-Z]+\*?(\{[^}]*\})*', '', text)
    text = re.sub(r'[{}]', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' +', ' ', text)
    return text.strip()


def chunk_by_section(text: str, chapter_name: str) -> list:
    """Split a LaTeX file into chunks by section/subsection headers."""
    pattern = r'(\\(?:sub)*section\*?\{[^}]+\})'
    parts = re.split(pattern, text)

    chunks = []
    current_section = chapter_name
    current_text = ''

    for part in parts:
        section_match = re.match(r'\\(?:sub)*section\*?\{([^}]+)\}', part)
        if section_match:
            if current_text.strip():
                cleaned = strip_latex(current_text)
                if len(cleaned) > 50:
                    chunks.append({
                        'chapter': chapter_name,
                        'section': current_section,
                        'content': cleaned,
                    })
            current_section = section_match.group(1)
            current_text = ''
        else:
            current_text += part

    if current_text.strip():
        cleaned = strip_latex(current_text)
        if len(cleaned) > 50:
            chunks.append({
                'chapter': chapter_name,
                'section': current_section,
                'content': cleaned,
            })

    return chunks


class RAGEngine:
    """Hybrid RAG engine: semantic embeddings + structured knowledge base.

    Uses Mistral Embed API for vector search with keyword fallback.
    """

    def __init__(self, knowledge_base_path: str):
        self.chunks: list = []  # raw thesis chunks for keyword fallback
        self.knowledge_base: dict = {}
        self.embedding_engine = EmbeddingEngine()
        self.chunk_count = 0
        self._load_knowledge_base(knowledge_base_path)
        self._index_all_content()

    def _load_knowledge_base(self, path: str):
        """Load the structured knowledge base JSON."""
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        dims = data.get('dimensions', data) if isinstance(data, dict) else data
        self.knowledge_base = {d['id']: d for d in dims}

    def _index_all_content(self):
        """Load, chunk, and embed all content (thesis + KB criteria)."""
        texts = []
        metadatas = []

        # 1. Thesis chapters
        thesis_dir = os.path.normpath(THESIS_DIR)
        if os.path.exists(thesis_dir):
            for filename, chapter_name in CHAPTER_MAP.items():
                filepath = os.path.join(thesis_dir, filename)
                if not os.path.exists(filepath):
                    continue
                with open(filepath, 'r', encoding='utf-8') as f:
                    raw = f.read()
                for chunk in chunk_by_section(raw, chapter_name):
                    content = chunk['content'][:1500]  # Cap per chunk
                    texts.append(content)
                    metadatas.append({
                        'type': 'thesis',
                        'chapter': chunk['chapter'],
                        'section': chunk['section'],
                    })
                    # Also store raw chunks for keyword fallback
                    self.chunks.append(chunk)
        else:
            print(f"Warning: Thesis directory not found at {thesis_dir}")

        # 2. Knowledge base criteria (~31 chunks)
        for dim_id in DIMENSION_ORDER:
            dim = self.knowledge_base.get(dim_id)
            if not dim:
                continue
            for criterion in dim.get('criteria', []):
                indicators = '\n'.join(
                    f"Level {lvl}: {desc}"
                    for lvl, desc in criterion.get('indicators', {}).items()
                )
                text = (
                    f"Dimension {dim_id} {dim['name']} ({dim['article']}): "
                    f"{criterion['id']} {criterion['name']}\n"
                    f"Frage: {criterion['question']}\n"
                    f"Indikatoren:\n{indicators}"
                )
                texts.append(text)
                metadatas.append({
                    'type': 'criterion',
                    'dimension_id': dim_id,
                    'criterion_id': criterion['id'],
                    'dimension_name': dim['name'],
                    'article': dim['article'],
                })

        # 3. Dimension descriptions (6 chunks)
        for dim_id in DIMENSION_ORDER:
            dim = self.knowledge_base.get(dim_id)
            if not dim:
                continue
            criteria_names = ', '.join(c['name'] for c in dim.get('criteria', []))
            text = (
                f"Dimension {dim_id}: {dim['name']} ({dim['article']})\n"
                f"{dim['description']}\n"
                f"Kriterien: {criteria_names}"
            )
            texts.append(text)
            metadatas.append({
                'type': 'dimension',
                'dimension_id': dim_id,
                'dimension_name': dim['name'],
                'article': dim['article'],
            })

        # Register and build embeddings
        self.embedding_engine.add_texts(texts, metadatas)
        try:
            self.chunk_count = self.embedding_engine.build()
        except Exception as e:
            print(f"Warning: Embedding build failed ({e}). Falling back to keyword search.")
            self.chunk_count = len(texts)

        print(f"RAG: Indexed {self.chunk_count} chunks ({len(self.chunks)} thesis + {len(texts) - len(self.chunks)} KB)")

    def retrieve(
        self,
        query: str,
        dimension_id: Optional[str] = None,
        criterion_id: Optional[str] = None,
        max_chunks: int = 5,
        max_tokens: int = 3000,
        top_k: int = 5,
    ) -> dict:
        """Retrieve relevant context for a query.

        Returns dict with:
        - knowledge: structured knowledge base data for the dimension/criterion
        - thesis_chunks: relevant thesis passages (via semantic or keyword search)
        - total_tokens_est: estimated token count
        - embeddings_used: whether semantic search was used
        """
        result = {
            'knowledge': None,
            'thesis_chunks': [],
            'total_tokens_est': 0,
            'embeddings_used': False,
        }

        # 1. Structured knowledge retrieval
        if dimension_id and dimension_id in self.knowledge_base:
            dim_data = self.knowledge_base[dimension_id]
            result['knowledge'] = {
                'dimension': dim_data['id'],
                'name': dim_data['name'],
                'article': dim_data['article'],
                'description': dim_data['description'],
            }
            if criterion_id:
                for c in dim_data.get('criteria', []):
                    if c['id'] == criterion_id:
                        result['knowledge']['criterion'] = c
                        break
            else:
                result['knowledge']['criteria'] = dim_data.get('criteria', [])

        # 2. Semantic search (primary) or keyword fallback
        if self.embedding_engine.is_ready:
            result['embeddings_used'] = True
            search_results = self.embedding_engine.search(query, top_k=top_k)
            thesis_results = [r for r in search_results if r['metadata'].get('type') == 'thesis']

            total_tokens = 0
            for r in thesis_results[:max_chunks]:
                chunk_tokens = len(r['text'].split()) * 1.5
                if total_tokens + chunk_tokens > max_tokens:
                    continue
                result['thesis_chunks'].append({
                    'chapter': r['metadata']['chapter'],
                    'section': r['metadata']['section'],
                    'content': r['text'][:1500],
                    'relevance_score': r['score'],
                })
                total_tokens += chunk_tokens

            result['total_tokens_est'] = total_tokens
        else:
            # Keyword fallback (original logic)
            result = self._keyword_retrieve(query, dimension_id, criterion_id, max_chunks, max_tokens, result)

        return result

    def retrieve_formatted(
        self,
        query: str,
        dimension_id: Optional[str] = None,
        top_k: int = 5,
    ) -> str:
        """Retrieve relevant context as formatted string for system prompt.

        Uses semantic search if embeddings are available,
        otherwise falls back to returning dimension knowledge.
        Always includes structured KB data for the current dimension.

        Returns:
            Formatted context string ready for injection into system prompt.
        """
        context_parts = []

        # 1. Structured KB data for current dimension (always include)
        if dimension_id and dimension_id in self.knowledge_base:
            dim = self.knowledge_base[dimension_id]
            context_parts.append(f"## Dimension {dim['id']}: {dim['name']} ({dim['article']})")
            context_parts.append(dim['description'])
            for c in dim.get('criteria', []):
                indicators = ', '.join(
                    f"L{lvl}: {desc[:60]}"
                    for lvl, desc in c.get('indicators', {}).items()
                )
                context_parts.append(f"- {c['id']} {c['name']}: {c['question']} [{indicators}]")

        # 2. Semantic search for relevant thesis passages
        if self.embedding_engine.is_ready:
            results = self.embedding_engine.search(query, top_k=top_k)
            thesis_results = [r for r in results if r['metadata'].get('type') == 'thesis']

            if thesis_results:
                context_parts.append("\n## Relevante Thesis-Passagen:")
                for r in thesis_results[:3]:
                    m = r['metadata']
                    context_parts.append(
                        f"\n### {m['chapter']} – {m['section']} (Relevanz: {r['score']:.2f})\n"
                        f"{r['text'][:800]}"
                    )
        else:
            context_parts.append(
                "\n[Hinweis: Semantische Suche nicht verfügbar. "
                "Antwort basiert auf strukturierter Wissensbasis.]"
            )

        return '\n'.join(context_parts) if context_parts else ""

    def _keyword_retrieve(
        self,
        query: str,
        dimension_id: Optional[str],
        criterion_id: Optional[str],
        max_chunks: int,
        max_tokens: int,
        result: dict,
    ) -> dict:
        """Keyword-based fallback retrieval (original v3 logic)."""
        DIMENSION_KEYWORDS = {
            'D1': ['risikomanagement', 'risk management', 'art. 9', 'artikel 9', 'risikoanalyse',
                   'risikobewertung', 'risikoidentifikation', 'D1'],
            'D2': ['data governance', 'datenqualität', 'art. 10', 'artikel 10', 'trainingsdaten',
                   'bias', 'datenannotation', 'D2'],
            'D3': ['dokumentation', 'technische dokumentation', 'art. 11', 'artikel 11',
                   'art. 12', 'artikel 12', 'logging', 'protokollierung', 'D3'],
            'D4': ['transparenz', 'art. 13', 'artikel 13', 'erklärbarkeit', 'nachvollziehbarkeit',
                   'informationspflicht', 'D4'],
            'D5': ['menschliche aufsicht', 'human oversight', 'art. 14', 'artikel 14',
                   'mensch-maschine', 'override', 'eingriff', 'D5'],
            'D6': ['robustheit', 'genauigkeit', 'cybersicherheit', 'art. 15', 'artikel 15',
                   'resilienz', 'accuracy', 'D6'],
        }
        DIMENSION_CHAPTERS = {
            'D1': ['04_Untersuchung.tex', 'A5_Bewertungsdimensionen.tex', 'A8_Mapping.tex'],
            'D2': ['04_Untersuchung.tex', 'A5_Bewertungsdimensionen.tex', 'A8_Mapping.tex'],
            'D3': ['04_Untersuchung.tex', 'A5_Bewertungsdimensionen.tex', 'A8_Mapping.tex'],
            'D4': ['04_Untersuchung.tex', 'A5_Bewertungsdimensionen.tex', 'A8_Mapping.tex'],
            'D5': ['04_Untersuchung.tex', 'A5_Bewertungsdimensionen.tex', 'A8_Mapping.tex'],
            'D6': ['04_Untersuchung.tex', 'A5_Bewertungsdimensionen.tex', 'A8_Mapping.tex'],
        }

        query_lower = query.lower()
        query_words = [w for w in query_lower.split() if len(w) > 3]
        dim_keywords = DIMENSION_KEYWORDS.get(dimension_id, []) if dimension_id else []
        all_keywords = query_words + dim_keywords

        scored_chunks = []
        for chunk in self.chunks:
            text_lower = chunk['content'].lower()
            score = sum(1 for kw in all_keywords if kw.lower() in text_lower)
            if dimension_id and dimension_id in DIMENSION_CHAPTERS:
                for ch_file, ch_name in CHAPTER_MAP.items():
                    if ch_name == chunk['chapter'] and ch_file in DIMENSION_CHAPTERS[dimension_id]:
                        score += 2
                        break
            if score > 0:
                scored_chunks.append((score, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        total_tokens = 0
        for score, chunk in scored_chunks[:max_chunks * 2]:
            chunk_tokens = len(chunk['content'].split()) * 1.5
            if total_tokens + chunk_tokens > max_tokens:
                continue
            result['thesis_chunks'].append({
                'chapter': chunk['chapter'],
                'section': chunk['section'],
                'content': chunk['content'][:1500],
                'relevance_score': score,
            })
            total_tokens += chunk_tokens
            if len(result['thesis_chunks']) >= max_chunks:
                break

        result['total_tokens_est'] = total_tokens
        return result

    def get_all_dimensions_summary(self) -> str:
        """Get a compact summary of all 6 dimensions for general context."""
        lines = []
        for dim_id in DIMENSION_ORDER:
            if dim_id in self.knowledge_base:
                d = self.knowledge_base[dim_id]
                criteria_names = ', '.join(c['name'] for c in d.get('criteria', []))
                lines.append(
                    f"- {d['id']} {d['name']} ({d['article']}): "
                    f"{d['description']} Kriterien: {criteria_names}"
                )
        return '\n'.join(lines)
