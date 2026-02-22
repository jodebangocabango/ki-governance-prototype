'use client'

import { useLanguage } from '@/i18n/LanguageContext'
import { useTranslatedDimensions } from '@/i18n/useTranslatedDimensions'
import { getComplianceInfo, DIMENSION_ARTICLE_MAP } from '@/utils/complianceHelpers'

interface DimensionResult {
  dimension_id: string
  dimension_name: string
  dim_score: number | null
  num_rated: number
  num_na: number
}

interface ArticleComplianceProps {
  dimensions: DimensionResult[]
}

export default function ArticleCompliance({ dimensions }: ArticleComplianceProps) {
  const { t } = useLanguage()
  const { translateDimensionName } = useTranslatedDimensions()

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {t('articleCompliance.title')}
        </span>
      </div>

      <div className="space-y-2">
        {dimensions.map(dim => {
          const artInfo = DIMENSION_ARTICLE_MAP[dim.dimension_id]
          if (!artInfo) return null
          const compliance = getComplianceInfo(dim.dim_score)

          // Count criteria that meet minimum (>= 3.0)
          const complianceLabel = t(`compliance.${compliance.status === 'non-compliant' ? 'nonCompliant' : compliance.status}`)

          return (
            <div
              key={dim.dimension_id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${compliance.bgColor} ${compliance.borderColor}`}
            >
              {/* Status dot */}
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${compliance.dotColor}`} />

              {/* Article info */}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-gray-800">
                  {artInfo.article}
                </span>
                <span className="text-[11px] text-gray-500 block leading-tight">
                  {translateDimensionName(dim.dimension_id, dim.dimension_name)}
                </span>
              </div>

              {/* Score + status */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-semibold ${compliance.textColor}`}>
                  {dim.dim_score?.toFixed(1) ?? '\u2013'}/5.0
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${compliance.bgColor} ${compliance.textColor} border ${compliance.borderColor}`}>
                  {complianceLabel}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
