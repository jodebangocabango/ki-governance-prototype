'use client'

import { useLanguage } from '@/i18n/LanguageContext'
import { useTranslatedDimensions } from '@/i18n/useTranslatedDimensions'
import { getComplianceInfo, type ComplianceStatus } from '@/utils/complianceHelpers'

interface DimensionResult {
  dimension_id: string
  dimension_name: string
  dim_score: number | null
  num_rated: number
  num_na: number
}

interface ExecutiveSummaryProps {
  systemName: string
  overallScore: number
  maturityLabel: string
  dimensions: DimensionResult[]
  riskCategory: string
}

export default function ExecutiveSummary({
  systemName,
  overallScore,
  maturityLabel,
  dimensions,
  riskCategory,
}: ExecutiveSummaryProps) {
  const { t } = useLanguage()
  const { translateDimensionName, translateMaturityLabel } = useTranslatedDimensions()

  // Count compliance statuses
  const counts: Record<ComplianceStatus, number> = {
    compliant: 0,
    partial: 0,
    'non-compliant': 0,
  }
  dimensions.forEach(d => {
    const info = getComplianceInfo(d.dim_score)
    counts[info.status]++
  })

  // Find worst dimensions (non-compliant first, then partial)
  const priorityDims = [...dimensions]
    .filter(d => {
      const info = getComplianceInfo(d.dim_score)
      return info.status !== 'compliant'
    })
    .sort((a, b) => (a.dim_score ?? 0) - (b.dim_score ?? 0))
    .slice(0, 2)

  const translatedMaturity = translateMaturityLabel(maturityLabel)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {t('executive.label')}
        </span>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed">
        {t('executive.systemReaches')
          .replace('{system}', systemName || t('executive.defaultSystem'))
          .replace('{score}', overallScore.toFixed(1))
          .replace('{label}', translatedMaturity)}
      </p>

      {/* Compliance status chips */}
      <div className="flex flex-wrap gap-2">
        {counts.compliant > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-50 text-green-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {counts.compliant} {t('compliance.compliant')}
          </span>
        )}
        {counts.partial > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {counts.partial} {t('compliance.partial')}
          </span>
        )}
        {counts['non-compliant'] > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {counts['non-compliant']} {t('compliance.nonCompliant')}
          </span>
        )}
      </div>

      {/* Priority action areas */}
      {priorityDims.length > 0 && (
        <p className="text-sm text-gray-600 leading-relaxed">
          <span className="font-semibold text-gray-700">{t('executive.priorityAction')}: </span>
          {priorityDims.map((d, i) => (
            <span key={d.dimension_id}>
              {i > 0 && ` ${t('executive.and')} `}
              <span className="font-semibold text-accent-blue">
                {d.dimension_id}: {translateDimensionName(d.dimension_id, d.dimension_name)}
              </span>
              <span className="text-gray-500"> ({d.dim_score?.toFixed(1) ?? '–'}/5.0)</span>
            </span>
          ))}
        </p>
      )}

      {/* Risk category note */}
      <div className="text-xs text-gray-400 pt-1">
        {t('executive.riskNote').replace('{category}', riskCategory)}
      </div>
    </div>
  )
}
