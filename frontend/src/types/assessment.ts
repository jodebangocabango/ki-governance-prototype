/** Shared types for the AI Governance Assessment Framework */

export interface AssessmentResult {
  scoping: ScopingResult
  dimensions: DimensionResult[]
  overall_score: number
  maturity_label: string
  gaps: GapResult[]
}

export interface ScopingResult {
  system_name: string
  risk_category: string
  industry: string
  organization_size: string
  deployment_status: string
  has_governance_officer: string
  existing_frameworks: string
  num_ai_systems: string
}

export interface DimensionResult {
  dimension_id: string
  dimension_name: string
  dim_score: number | null
  num_rated: number
  num_na: number
}

export interface GapResult {
  dimension_id: string
  dimension_name: string
  dim_score: number
  gap_severity: string
  priority_rank: number
  recommendation: string
}

export interface Indicator {
  [key: string]: string
}

export interface Criterion {
  id: string
  name: string
  question: string
  indicators: Indicator
}

export interface Dimension {
  id: string
  name: string
  article: string
  description: string
  criteria: Criterion[]
}
