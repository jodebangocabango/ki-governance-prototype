/**
 * Compliance & scoring helper utilities.
 *
 * Pure functions for mapping scores to compliance status, heatmap colors,
 * and maturity levels. Used across dashboard, results, and assessment views.
 *
 * Threshold logic mirrors backend scoring.py (§4.2–4.3 of thesis).
 */

export type ComplianceStatus = 'compliant' | 'partial' | 'non-compliant'

export interface ComplianceInfo {
  status: ComplianceStatus
  /** Tailwind text color class */
  textColor: string
  /** Tailwind bg color class */
  bgColor: string
  /** Tailwind border color class */
  borderColor: string
  /** Dot/indicator color */
  dotColor: string
}

/**
 * Determine compliance status from a dimension score.
 *   >= 3.5  → compliant (green)
 *   >= 2.0  → partial   (yellow)
 *   <  2.0  → non-compliant (red)
 */
export function getComplianceInfo(score: number | null): ComplianceInfo {
  if (score === null || score === undefined) {
    return {
      status: 'non-compliant',
      textColor: 'text-gray-400',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      dotColor: 'bg-gray-300',
    }
  }

  if (score >= 3.5) {
    return {
      status: 'compliant',
      textColor: 'text-green-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      dotColor: 'bg-green-500',
    }
  }

  if (score >= 2.0) {
    return {
      status: 'partial',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      dotColor: 'bg-amber-500',
    }
  }

  return {
    status: 'non-compliant',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    dotColor: 'bg-red-500',
  }
}

/** Unified color scheme per maturity level (single source of truth) */
const LEVEL_COLORS: Record<number, { hex: string; bg: string; text: string }> = {
  1: { hex: '#ef4444', bg: 'bg-red-400/60',    text: 'text-white' },
  2: { hex: '#f97316', bg: 'bg-orange-300/60',  text: 'text-orange-900' },
  3: { hex: '#eab308', bg: 'bg-yellow-300/60',  text: 'text-yellow-900' },
  4: { hex: '#22c55e', bg: 'bg-green-400/60',   text: 'text-green-900' },
  5: { hex: '#16a34a', bg: 'bg-green-500/80',   text: 'text-white' },
}

const NULL_COLOR = { hex: '#e5e7eb', bg: 'bg-gray-100', text: 'text-gray-400' }

/** Clamp score to nearest maturity level (1–5) */
const scoreToLevel = (score: number): number =>
  Math.max(1, Math.min(5, Math.round(score)))

/** CSS hex color for heatmap cells (1–5 scale, null = gray) */
export function getHeatmapColor(score: number | null): string {
  if (score === null || score === undefined) return NULL_COLOR.hex
  return (LEVEL_COLORS[scoreToLevel(score)] ?? NULL_COLOR).hex
}

/** Tailwind class set for heatmap cells */
export function getHeatmapClasses(score: number | null): { bg: string; text: string } {
  if (score === null || score === undefined) return { bg: NULL_COLOR.bg, text: NULL_COLOR.text }
  const c = LEVEL_COLORS[scoreToLevel(score)] ?? NULL_COLOR
  return { bg: c.bg, text: c.text }
}

/**
 * Static mapping: Dimension ID → EU AI Act Article info.
 * Used by E2 (Article Compliance) and other regulatory features.
 */
export const DIMENSION_ARTICLE_MAP: Record<string, { article: string; articleNum: number }> = {
  D1: { article: 'Art. 9', articleNum: 9 },
  D2: { article: 'Art. 10', articleNum: 10 },
  D3: { article: 'Art. 11\u201312', articleNum: 11 },
  D4: { article: 'Art. 13', articleNum: 13 },
  D5: { article: 'Art. 14', articleNum: 14 },
  D6: { article: 'Art. 15', articleNum: 15 },
}

/** CMMI maturity levels: threshold → (level, label). Ordered descending. */
const MATURITY_THRESHOLDS: readonly [number, number, string][] = [
  [4.5, 5, 'Optimizing'],
  [3.5, 4, 'Measured'],
  [2.5, 3, 'Defined'],
  [1.5, 2, 'Managed'],
  [0.0, 1, 'Initial'],
]

/** Map score to maturity level number (1–5, 0 for null) */
export function getMaturityLevel(score: number | null): number {
  if (score === null || score === undefined) return 0
  return (MATURITY_THRESHOLDS.find(([threshold]) => score >= threshold)?.[1]) ?? 1
}

/** Map score to English maturity label */
export function getMaturityLabelFromScore(score: number | null): string {
  if (score === null || score === undefined) return ''
  return (MATURITY_THRESHOLDS.find(([threshold]) => score >= threshold)?.[2]) ?? 'Initial'
}

/* ---- Paket 2: Benchmarks & Dependencies ---- */

/** A8: EU AI Act minimum = Level 3.0 on all dimensions */
export const BENCHMARK_MINIMUM: Record<string, number> = {
  D1: 3.0, D2: 3.0, D3: 3.0, D4: 3.0, D5: 3.0, D6: 3.0,
}

/** A8: Best Practice = Level 4.0 on all dimensions */
export const BENCHMARK_BEST_PRACTICE: Record<string, number> = {
  D1: 4.0, D2: 4.0, D3: 4.0, D4: 4.0, D5: 4.0, D6: 4.0,
}

/** B5: Dimension dependencies (key depends on dependsOn) */
export const DIMENSION_DEPENDENCIES: Record<string, { dependsOn: string; key: string }> = {
  D5: { dependsOn: 'D1', key: 'dep_D5_D1' },
  D6: { dependsOn: 'D1', key: 'dep_D6_D1' },
  D4: { dependsOn: 'D3', key: 'dep_D4_D3' },
}

/** Level transition keys for action plan recommendations (G2) */
const LEVEL_KEYS: readonly [number, string][] = [
  [4.5, 'optimizing'],
  [3.5, '4to5'],
  [2.5, '3to4'],
  [1.5, '2to3'],
  [0.0, '1to2'],
]

export const getLevelKey = (score: number): string =>
  (LEVEL_KEYS.find(([threshold]) => score >= threshold)?.[1]) ?? '1to2'
