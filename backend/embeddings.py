"""
Semantic vector search using Mistral Embed API.

Embeds thesis chunks, knowledge-base criteria, and EU AI Act article
descriptions into 1024-dimensional vectors. Uses in-memory numpy
cosine similarity for retrieval (~100-150 chunks, no FAISS needed).

Disk cache (.npy + metadata JSON) avoids redundant API calls on restart.
Hash-based invalidation ensures cache freshness when source data changes.
"""

import hashlib
import json
import os
from pathlib import Path
from typing import Optional

import httpx
import numpy as np


# --- Configuration ---

EMBED_MODEL = "mistral-embed"
EMBED_DIM = 1024
EMBED_BATCH_SIZE = 16  # Mistral allows up to 16 texts per request
CACHE_DIR = Path(__file__).parent / ".embed_cache"


# --- Pure helpers ---

def _content_hash(texts: list[str]) -> str:
    """Deterministic hash of all source texts for cache invalidation."""
    blob = "\n".join(texts).encode("utf-8")
    return hashlib.sha256(blob).hexdigest()[:16]


def _cosine_similarity(query_vec: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    """Cosine similarity between a single query vector and a matrix of vectors.

    Args:
        query_vec: shape (D,) — the query embedding
        matrix:    shape (N, D) — the document embeddings

    Returns:
        shape (N,) — similarity scores in [-1, 1]
    """
    with np.errstate(all='ignore'):
        query_norm_val = np.linalg.norm(query_vec)
        if query_norm_val < 1e-10:
            return np.zeros(matrix.shape[0])

        query_normed = query_vec / query_norm_val
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        safe_norms = np.maximum(norms, 1e-10)
        normed = matrix / safe_norms
        scores = normed @ query_normed
        # Replace NaN/Inf with 0
        return np.nan_to_num(scores, nan=0.0, posinf=0.0, neginf=0.0)


# --- Embedding client ---

class EmbeddingEngine:
    """Manages Mistral embeddings with numpy cosine search and disk caching."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("MISTRAL_API_KEY", "")
        self.texts: list[str] = []
        self.metadata: list[dict] = []  # parallel to self.texts
        self.vectors: Optional[np.ndarray] = None  # (N, 1024)
        self._http = httpx.Client(
            base_url="https://api.mistral.ai/v1",
            headers={"Authorization": f"Bearer {self.api_key}"},
            timeout=30.0,
        )

    # --- Public API ---

    def add_texts(self, texts: list[str], metadatas: list[dict]) -> None:
        """Register texts + metadata for embedding. Call build() after."""
        assert len(texts) == len(metadatas), "texts and metadatas must align"
        self.texts.extend(texts)
        self.metadata.extend(metadatas)

    def build(self) -> int:
        """Embed all registered texts (with cache). Returns chunk count."""
        if not self.texts:
            return 0

        content_hash = _content_hash(self.texts)
        cached = self._load_cache(content_hash)
        if cached is not None:
            self.vectors = cached
            print(f"Embeddings: loaded {len(self.texts)} vectors from cache")
            return len(self.texts)

        # Embed in batches
        all_vecs: list[np.ndarray] = []
        for i in range(0, len(self.texts), EMBED_BATCH_SIZE):
            batch = self.texts[i : i + EMBED_BATCH_SIZE]
            vecs = self._embed_batch(batch)
            all_vecs.append(vecs)

        self.vectors = np.vstack(all_vecs)  # (N, 1024)
        self._save_cache(content_hash, self.vectors)
        print(f"Embeddings: embedded {len(self.texts)} chunks via Mistral API")
        return len(self.texts)

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """Semantic search: embed query, find top-k similar documents.

        Returns list of {text, metadata, score} dicts sorted by relevance.
        Only returns results with cosine similarity > 0.3 to filter noise.
        """
        if self.vectors is None or len(self.texts) == 0:
            return []

        try:
            query_vec = self._embed_single(query)
        except Exception as e:
            print(f"Warning: Embedding query failed ({e}). Returning empty results.")
            return []

        scores = _cosine_similarity(query_vec, self.vectors)
        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            idx_int = int(idx)
            if scores[idx_int] > 0.3:  # meaningful similarity threshold
                results.append({
                    "text": self.texts[idx_int],
                    "metadata": self.metadata[idx_int],
                    "score": float(scores[idx_int]),
                })
        return results

    @property
    def count(self) -> int:
        return len(self.texts)

    @property
    def is_ready(self) -> bool:
        return self.vectors is not None and len(self.texts) > 0

    # --- Internal ---

    def _embed_batch(self, texts: list[str]) -> np.ndarray:
        """Call Mistral embed API for a batch of texts."""
        resp = self._http.post(
            "/embeddings",
            json={"model": EMBED_MODEL, "input": texts},
        )
        resp.raise_for_status()
        data = resp.json()
        vecs = [item["embedding"] for item in data["data"]]
        return np.array(vecs, dtype=np.float32)

    def _embed_single(self, text: str) -> np.ndarray:
        """Embed a single text (for queries)."""
        return self._embed_batch([text])[0]

    def _cache_path(self, content_hash: str) -> tuple[Path, Path]:
        """Return (vectors_path, metadata_path) for a given hash."""
        CACHE_DIR.mkdir(exist_ok=True)
        return (
            CACHE_DIR / f"vecs_{content_hash}.npy",
            CACHE_DIR / f"meta_{content_hash}.json",
        )

    def _load_cache(self, content_hash: str) -> Optional[np.ndarray]:
        """Load cached vectors if hash matches."""
        vec_path, meta_path = self._cache_path(content_hash)
        if vec_path.exists() and meta_path.exists():
            vecs = np.load(str(vec_path))
            if vecs.shape[0] == len(self.texts):
                return vecs
        return None

    def _save_cache(self, content_hash: str, vectors: np.ndarray) -> None:
        """Persist vectors and metadata to disk."""
        vec_path, meta_path = self._cache_path(content_hash)
        np.save(str(vec_path), vectors)
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({"hash": content_hash, "count": len(self.texts)}, f)
