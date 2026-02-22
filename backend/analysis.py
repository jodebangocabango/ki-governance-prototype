"""Gap analysis module for the AI Governance Assessment Framework (§4.4).

Implements gap detection and prioritized recommendation generation:

    GapValue_d = Threshold(risk) - DimScore_d        (Eq. 3, §4.4)

    Severity mapping (Table 4.2):
        GapValue >= 2.0  ->  "critical"   (acute non-compliance risk)
        GapValue >= 1.0  ->  "significant" (material governance weakness)
        GapValue <  1.0  ->  "moderate"    (improvement opportunity)

Thresholds are risk-category-dependent (Art. 6 EU AI Act classification):
    high-risk:    3.0   (defined processes required)
    limited-risk: 2.5
    minimal-risk: 2.0

Recommendations are dimension-specific and severity-graded to avoid
generic advice (addresses Manko 15 from evaluation).
"""
from models import DimensionResult, GapItem
from typing import Optional


# Context-specific recommendations per dimension AND score range
# Keys: dimension_id -> { score_range -> recommendation }
RECOMMENDATIONS = {
    "D1": {
        "critical": "Sofortmaßnahme: Etablieren Sie mindestens ein rudimentäres KI-Risikoregister und bestimmen Sie eine*n Risikoverantwortliche*n. Ohne jegliches Risikomanagement besteht akute Nicht-Konformität mit Art. 9 EU AI Act — dies kann Bußgelder bis 3% des weltweiten Umsatzes nach sich ziehen.",
        "significant": "Formalisieren Sie das bestehende Risikomanagement: Definieren Sie Risikoklassen, Bewertungskriterien und Review-Zyklen. Implementieren Sie ein lebenszyklus-begleitendes Monitoring mit klaren Eskalationspfaden. Quick Win: Risikoregister-Template aus ISO 31000 adaptieren.",
        "moderate": "Optimieren Sie die Verzahnung des KI-Risikomanagements mit dem Enterprise Risk Management. Etablieren Sie quantitative Risikometriken und automatisierte Schwellenwert-Überwachung. Benchmarking gegen Branchenstandards empfohlen.",
    },
    "D2": {
        "critical": "Sofortmaßnahme: Dokumentieren Sie alle Trainingsdatenquellen und führen Sie eine initiale Bias-Prüfung durch. Ohne Data Governance ist die Konformität mit Art. 10 nicht nachweisbar. Quick Win: Daten-Inventar erstellen.",
        "significant": "Implementieren Sie systematische Datenqualitätsprozesse: Definieren Sie Metriken für Vollständigkeit, Aktualität und Repräsentativität. Etablieren Sie Bias-Detection-Pipelines und Datenherkunftsdokumentation (Data Lineage).",
        "moderate": "Erweitern Sie die Data Governance um kontinuierliches Datenqualitäts-Monitoring und automatisierte Drift-Erkennung. Etablieren Sie Fairness-KPIs und regelmäßige Audits der Trainingsdaten.",
    },
    "D3": {
        "critical": "Sofortmaßnahme: Erstellen Sie die technische Dokumentation gemäß Art. 11 / Anhang IV EU AI Act. Ohne Dokumentation ist keine Konformitätserklärung möglich. Quick Win: Dokumentationstemplate nach Anhang IV nutzen.",
        "significant": "Vervollständigen Sie die technische Dokumentation und etablieren Sie automatisierte Logging-Systeme. Implementieren Sie eine Versionierungsstrategie für Modelle, Daten und Konfigurationen.",
        "moderate": "Automatisieren Sie die Dokumentationspflege durch CI/CD-Integration. Etablieren Sie Machine-Readable-Logs und implementieren Sie Audit-Trails für alle Modellentscheidungen.",
    },
    "D4": {
        "critical": "Sofortmaßnahme: Implementieren Sie die Mindest-Informationspflichten nach Art. 13 — Nutzer*innen müssen wissen, dass sie mit KI interagieren. Quick Win: KI-Kennzeichnung und Basis-Nutzungsinformation bereitstellen.",
        "significant": "Stärken Sie die Erklärbarkeit durch XAI-Methoden (SHAP, LIME) und etablieren Sie klare Kommunikationswege für Transparenzanfragen. Dokumentieren Sie Systemgrenzen und Unsicherheitsbereiche.",
        "moderate": "Implementieren Sie zielgruppenspezifische Erklärbarkeit (technisch für Auditoren, verständlich für Endnutzer). Etablieren Sie proaktive Transparenzberichte und Stakeholder-Kommunikation.",
    },
    "D5": {
        "critical": "Sofortmaßnahme: Definieren Sie mindestens eine*n geschulte*n Aufsichtsperson mit Interventionsbefugnis (Art. 14). Ohne menschliche Aufsicht ist der Betrieb von Hochrisiko-KI nicht zulässig. Quick Win: Notfall-Stopp-Mechanismus implementieren.",
        "significant": "Etablieren Sie ein strukturiertes Human Oversight Framework: Definieren Sie Aufsichtsrollen, Schulungsprogramme und Interventionsprotokolle. Implementieren Sie Maßnahmen gegen Automation Bias.",
        "moderate": "Optimieren Sie die Mensch-KI-Interaktion: Implementieren Sie adaptive Aufsichtsintensität basierend auf Risikosituationen. Etablieren Sie regelmäßige Calibration-Sessions und Feedback-Loops.",
    },
    "D6": {
        "critical": "Sofortmaßnahme: Definieren Sie Mindest-Performance-Schwellen und implementieren Sie einen Fallback-Mechanismus für Systemausfälle (Art. 15). Quick Win: Monitoring-Dashboard für zentrale Leistungskennzahlen aufsetzen.",
        "significant": "Erhöhen Sie die technische Robustheit: Implementieren Sie Cybersicherheitsmaßnahmen, adversarial Testing und kontinuierliches Performance-Monitoring. Definieren Sie Degradation-Strategien.",
        "moderate": "Etablieren Sie ein umfassendes Resilience-Framework: Chaos Engineering für KI-Systeme, automatisierte Regressionstests, und Monitoring von Data/Concept Drift mit automatischer Benachrichtigung.",
    },
}

# C3: Risk-category-based gap thresholds
RISK_THRESHOLDS = {
    "high-risk": 3.0,
    "limited-risk": 2.5,
    "minimal-risk": 2.0,
}


def analyze_gaps(
    dimensions: list[DimensionResult],
    threshold: float = 3.0,
    risk_category: Optional[str] = None,
) -> list[GapItem]:
    """Identify governance gaps where DimScore_d < Threshold (Eq. 3, §4.4).

    For each dimension below the threshold, computes:
        GapValue_d = Threshold(risk) - DimScore_d

    and maps the result to a severity level (see module docstring).
    Threshold is dynamically adjusted based on the AI Act risk category
    (Art. 6 classification) via RISK_THRESHOLDS.

    Returns gaps sorted by score ascending (worst first) with
    priority ranks and dimension-specific recommendations.
    """
    # C3: Override threshold based on risk category if provided
    if risk_category and risk_category in RISK_THRESHOLDS:
        threshold = RISK_THRESHOLDS[risk_category]

    gaps = []
    for dim in dimensions:
        if dim.dim_score is not None and dim.dim_score < threshold:
            gap_value = threshold - dim.dim_score

            if gap_value >= 2.0:
                severity = "critical"
            elif gap_value >= 1.0:
                severity = "significant"
            else:
                severity = "moderate"

            # Context-specific recommendation based on severity
            dim_recs = RECOMMENDATIONS.get(dim.dimension_id, {})
            recommendation = dim_recs.get(severity, dim_recs.get("moderate", ""))

            gaps.append(GapItem(
                dimension_id=dim.dimension_id,
                dimension_name=dim.dimension_name,
                dim_score=dim.dim_score,
                gap_severity=severity,
                priority_rank=0,  # set below
                recommendation=recommendation,
            ))

    # Sort by score ascending (worst first) and assign priority ranks
    gaps.sort(key=lambda g: g.dim_score)
    for i, gap in enumerate(gaps):
        gap.priority_rank = i + 1

    return gaps
