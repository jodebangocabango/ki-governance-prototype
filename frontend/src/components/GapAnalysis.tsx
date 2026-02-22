'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import ActionPlan from '@/components/ActionPlan'
import { useLanguage, type Locale } from '@/i18n/LanguageContext'
import { useTranslatedDimensions } from '@/i18n/useTranslatedDimensions'
import { getComplianceInfo, DIMENSION_DEPENDENCIES, getLevelKey, DIMENSION_ARTICLE_MAP } from '@/utils/complianceHelpers'
import { de } from '@/i18n/translations/de'
import { en } from '@/i18n/translations/en'
import { fr } from '@/i18n/translations/fr'

interface GapItem {
  dimension_id: string
  dimension_name: string
  dim_score: number
  gap_severity: string
  priority_rank: number
  recommendation: string
}

interface GapAnalysisProps {
  gaps: GapItem[]
}

// B3: Criterion score from localStorage
interface WeakCriterion {
  id: string
  name: string
  score: number
}

const severityColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  critical: {
    bg: 'bg-pastel-pink/30',
    border: 'border-pastel-pink',
    text: 'text-accent-red',
    badge: 'bg-pastel-pink text-accent-red',
  },
  significant: {
    bg: 'bg-pastel-orange/30',
    border: 'border-pastel-orange',
    text: 'text-accent-orange',
    badge: 'bg-pastel-orange text-accent-orange',
  },
  moderate: {
    bg: 'bg-pastel-yellow/30',
    border: 'border-pastel-yellow',
    text: 'text-accent-yellow',
    badge: 'bg-pastel-yellow text-accent-yellow',
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const allTranslations: Record<Locale, Record<string, any>> = { de, en, fr }

export default function GapAnalysis({ gaps }: GapAnalysisProps) {
  const { t, locale } = useLanguage()
  const { translateDimensionName, translateRecommendation } = useTranslatedDimensions()
  const [selectedGap, setSelectedGap] = useState<GapItem | null>(null)
  const [criteriaOpen, setCriteriaOpen] = useState<string | null>(null)
  const [weakCriteria, setWeakCriteria] = useState<Record<string, WeakCriterion[]>>({})
  const trans = allTranslations[locale]

  // B3: Load criterion scores from localStorage to identify weak criteria (B1: dual-key pattern)
  useEffect(() => {
    try {
      let scores: Record<string, number | null> | undefined
      // Try dedicated key first (persists after submit)
      const dedicated = localStorage.getItem('criterionScores')
      if (dedicated) {
        const parsed = JSON.parse(dedicated)
        if (typeof parsed === 'object' && parsed !== null) {
          scores = parsed
        }
      }
      // Fallback: try assessmentProgress (during active assessment)
      if (!scores) {
        const saved = localStorage.getItem('assessmentProgress')
        if (!saved) return
        const progress = JSON.parse(saved) as { scores?: Record<string, number | null> }
        scores = progress.scores
      }
      if (!scores) return

      // Group criteria by dimension and find those < 3
      const weak: Record<string, WeakCriterion[]> = {}
      for (const [critId, score] of Object.entries(scores)) {
        if (score === null || score >= 3) continue
        const dimId = critId.split('.')[0] // "D1.1" → "D1"
        if (!weak[dimId]) weak[dimId] = []
        weak[dimId].push({ id: critId, name: critId, score })
      }
      // Sort each dimension's weak criteria by score ascending
      for (const dimId of Object.keys(weak)) {
        weak[dimId].sort((a, b) => a.score - b.score)
      }
      setWeakCriteria(weak)
    } catch {}
  }, [])

  const severityLabels: Record<string, string> = {
    critical: t('gap.severityCritical'),
    significant: t('gap.severitySignificant'),
    moderate: t('gap.severityModerate'),
  }

  // G2: Helper to get quick wins for a gap
  function getQuickWins(dimId: string, score: number): string[] {
    const dimKey = dimId.toLowerCase() as 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6'
    const levelKey = getLevelKey(score)
    try {
      const dimPlan = trans.actionPlan?.[dimKey]
      if (!dimPlan?.levels?.[levelKey]?.quickWins) return []
      return (dimPlan.levels[levelKey].quickWins as string[]).slice(0, 2)
    } catch {
      return []
    }
  }

  if (gaps.length === 0) {
    return (
      <div className="bg-pastel-green/30 border border-pastel-green rounded-2xl p-5">
        <p className="text-accent-green font-medium">
          {t('gap.noGaps')}
        </p>
      </div>
    )
  }

  // B5: Collect gap dimension IDs for dependency checks
  const gapDimIds = new Set(gaps.map(g => g.dimension_id))

  return (
    <>
      <div className="space-y-4">
        {gaps.map(gap => {
          const style = severityColors[gap.gap_severity] || severityColors.moderate
          const compliance = getComplianceInfo(gap.dim_score)
          const complianceLabel = t(`compliance.${compliance.status === 'non-compliant' ? 'nonCompliant' : compliance.status}`)

          // A2: Regulatory risk
          const artInfo = DIMENSION_ARTICLE_MAP[gap.dimension_id]

          // B5: Dependency check
          const dep = DIMENSION_DEPENDENCIES[gap.dimension_id]
          const depIsAlsoGap = dep && gapDimIds.has(dep.dependsOn)

          // G2: Quick wins
          const quickWins = getQuickWins(gap.dimension_id, gap.dim_score)

          // B2: Effort estimation
          const effortData = trans.effort?.[gap.dimension_id as 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6']

          return (
            <div key={gap.dimension_id} className={`border rounded-2xl p-5 ${style.bg} ${style.border} transition-all duration-300 hover:shadow-md`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="bg-accent-blue text-white text-xs font-bold px-3 py-1 rounded-full">
                    #{gap.priority_rank}
                  </span>
                  <h4 className="font-semibold text-gray-800">
                    {gap.dimension_id}: {translateDimensionName(gap.dimension_id, gap.dimension_name)}
                  </h4>
                  {/* A1: Compliance Ampel Badge */}
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${compliance.bgColor} ${compliance.textColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${compliance.dotColor}`} />
                    {complianceLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* B2: Effort T-Shirt size badge */}
                  {effortData && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-pastel-indigo/30 text-accent-purple" title={`${effortData.hours} | ${effortData.weeks}`}>
                      {effortData.size}
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${style.badge}`}>
                    {severityLabels[gap.gap_severity] || gap.gap_severity}
                  </span>
                  <span className="text-lg font-bold text-gray-800">
                    {gap.dim_score.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Recommendation */}
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{translateRecommendation(gap.dimension_id, gap.recommendation)}</p>

              {/* A2: Regulatory risk interpretation */}
              {artInfo && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-red-50/50 border border-red-100">
                  <p className="text-[11px] text-red-700 leading-relaxed">
                    <span className="font-semibold">{t('gap.regulatoryRisk')}: </span>
                    {t(`regulatory.${gap.dimension_id}`)}
                  </p>
                </div>
              )}

              {/* B5: Dependency warning */}
              {depIsAlsoGap && dep && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50/50 border border-amber-100">
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    <span className="font-semibold">{t('gap.dependencyWarning')}: </span>
                    {t(`gap.${dep.key}`)}
                  </p>
                </div>
              )}

              {/* G2: Quick Wins inline */}
              {quickWins.length > 0 && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-blue-50/50 border border-blue-100">
                  <p className="text-[11px] font-semibold text-blue-700 mb-1">{t('gap.quickWinsLabel')}</p>
                  <ul className="space-y-0.5">
                    {quickWins.map((qw, i) => (
                      <li key={i} className="text-[11px] text-blue-600 flex items-start gap-1.5">
                        <svg className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        <span>{qw}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* B3: Criteria-level recommendations */}
              {weakCriteria[gap.dimension_id] && weakCriteria[gap.dimension_id].length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() => setCriteriaOpen(criteriaOpen === gap.dimension_id ? null : gap.dimension_id)}
                    className="text-[11px] font-semibold text-purple-700 flex items-center gap-1.5 mb-1"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 ${criteriaOpen === gap.dimension_id ? 'rotate-90' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    {t('criteriaRec.title')} ({weakCriteria[gap.dimension_id].length})
                  </button>
                  {criteriaOpen === gap.dimension_id && (
                    <div className="px-3 py-2 rounded-lg bg-purple-50/50 border border-purple-100 space-y-2">
                      {weakCriteria[gap.dimension_id].map(crit => {
                        const recKey = `criteriaRec.${crit.id.replace('.', '_')}`
                        const recText = t(recKey)
                        return (
                          <div key={crit.id} className="flex items-start gap-2">
                            <span className="flex-shrink-0 text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded mt-0.5">
                              {crit.id} ({crit.score}/5)
                            </span>
                            <span className="text-[11px] text-purple-700 leading-relaxed">{recText}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setSelectedGap(gap)}
                className="text-sm font-medium text-accent-blue hover:text-accent-indigo transition-colors flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 8h12M8 2v12" />
                </svg>
                {t('gap.showActionPlan')}
              </button>
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {selectedGap && (
          <ActionPlan
            dimensionId={selectedGap.dimension_id}
            dimensionName={translateDimensionName(selectedGap.dimension_id, selectedGap.dimension_name)}
            score={selectedGap.dim_score}
            severity={selectedGap.gap_severity}
            onClose={() => setSelectedGap(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
