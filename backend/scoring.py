"""Scoring engine for the AI Governance Assessment Framework.

Implements:
- DimScore_d = (1/n_d) * sum(Score_{d,k}) for k=1..n_d  (Eq. 1)
- GesamtScore = sum(w_d * DimScore_d) for d=1..6           (Eq. 2)
"""
from models import DimensionResult, CriterionScore
from typing import Optional


def calculate_dim_score(dimension: DimensionResult) -> DimensionResult:
    """Calculate DimScore_d = (1/n_d) * Σ Score_{d,k} (Eq. 1, §4.2).

    Computes the arithmetic mean of all rated (non-N/A) criteria scores
    within a dimension. Mutates and returns the DimensionResult in-place
    (Pydantic models are mutable by design in this architecture).
    """
    rated = [cs for cs in dimension.criteria_scores if not cs.is_na and cs.score is not None]
    na_count = sum(1 for cs in dimension.criteria_scores if cs.is_na)

    dimension.num_rated = len(rated)
    dimension.num_na = na_count
    dimension.dim_score = round(sum(cs.score for cs in rated) / len(rated), 2) if rated else None

    return dimension


def calculate_overall_score(
    dimensions: list[DimensionResult],
    weights: Optional[dict[str, float]] = None
) -> float:
    """Calculate weighted overall score across all dimensions.

    Default: equal weights (1/6 each).
    """
    scored_dims = [d for d in dimensions if d.dim_score is not None]
    if not scored_dims:
        return 0.0

    if weights is None:
        # Equal weighting
        n = len(scored_dims)
        return round(sum(d.dim_score for d in scored_dims) / n, 2)

    # Weighted calculation
    total_weight = sum(weights.get(d.dimension_id, 1/6) for d in scored_dims)
    if total_weight == 0:
        return 0.0

    weighted_sum = sum(
        weights.get(d.dimension_id, 1/6) * d.dim_score
        for d in scored_dims
    )
    return round(weighted_sum / total_weight, 2)


# Maturity level thresholds (CMMI-based, see §4.3 of thesis)
MATURITY_LEVELS: list[tuple[float, str]] = [
    (4.5, "Optimizing"),
    (3.5, "Measured"),
    (2.5, "Defined"),
    (1.5, "Managed"),
    (0.0, "Initial"),
]


def get_maturity_label(score: float) -> str:
    """Map overall score to CMMI maturity level (pure function)."""
    return next(
        (label for threshold, label in MATURITY_LEVELS if score >= threshold),
        "Initial"
    )
