'use client'

import { useLanguage } from '@/i18n/LanguageContext'
import { useTranslatedDimensions } from '@/i18n/useTranslatedDimensions'
import { DIMENSION_ARTICLE_MAP } from '@/utils/complianceHelpers'

/**
 * E1: Mapping visualization showing which Dimension maps to which EU AI Act Article.
 * Displays as a matrix with colored cells indicating the strength of the mapping.
 */

interface DimensionScore {
  dimension_id: string
  dimension_name: string
  dim_score: number | null
}

interface ArticleMappingChartProps {
  dimensions: DimensionScore[]
}

// Full mapping matrix: which criteria in each dimension relate to which article aspects
const MAPPING_MATRIX: Record<string, Record<string, 'primary' | 'secondary' | null>> = {
  D1: { 'Art. 9': 'primary', 'Art. 10': 'secondary', 'Art. 11': null, 'Art. 13': null, 'Art. 14': 'secondary', 'Art. 15': 'secondary' },
  D2: { 'Art. 9': 'secondary', 'Art. 10': 'primary', 'Art. 11': 'secondary', 'Art. 13': null, 'Art. 14': null, 'Art. 15': null },
  D3: { 'Art. 9': null, 'Art. 10': 'secondary', 'Art. 11': 'primary', 'Art. 13': 'secondary', 'Art. 14': null, 'Art. 15': null },
  D4: { 'Art. 9': null, 'Art. 10': null, 'Art. 11': 'secondary', 'Art. 13': 'primary', 'Art. 14': 'secondary', 'Art. 15': null },
  D5: { 'Art. 9': 'secondary', 'Art. 10': null, 'Art. 11': null, 'Art. 13': 'secondary', 'Art. 14': 'primary', 'Art. 15': null },
  D6: { 'Art. 9': 'secondary', 'Art. 10': null, 'Art. 11': null, 'Art. 13': null, 'Art. 14': null, 'Art. 15': 'primary' },
}

const ARTICLES = ['Art. 9', 'Art. 10', 'Art. 11', 'Art. 13', 'Art. 14', 'Art. 15']

export default function ArticleMappingChart({ dimensions }: ArticleMappingChartProps) {
  const { t } = useLanguage()
  const { translateDimensionName } = useTranslatedDimensions()

  const articleTitles: Record<string, string> = {
    'Art. 9': t('mapping.art9'),
    'Art. 10': t('mapping.art10'),
    'Art. 11': t('mapping.art11'),
    'Art. 13': t('mapping.art13'),
    'Art. 14': t('mapping.art14'),
    'Art. 15': t('mapping.art15'),
  }

  return (
    <div className="flex flex-col h-full">
      <span className="text-xs font-medium text-gray-500 mb-1">{t('mapping.title')}</span>
      <p className="text-[10px] text-gray-400 mb-3">{t('mapping.subtitle')}</p>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr>
              <th className="text-left py-1.5 px-1 font-semibold text-gray-500 min-w-[80px]">
                {t('mapping.dimension')}
              </th>
              {ARTICLES.map(art => (
                <th key={art} className="text-center py-1.5 px-1 font-semibold text-gray-500 min-w-[60px]">
                  <div>{art}</div>
                  <div className="font-normal text-gray-400 truncate">{articleTitles[art]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dimensions.map(dim => {
              const mapping = MAPPING_MATRIX[dim.dimension_id]
              if (!mapping) return null
              const artInfo = DIMENSION_ARTICLE_MAP[dim.dimension_id]
              return (
                <tr key={dim.dimension_id} className="border-t border-gray-100">
                  <td className="py-2 px-1 font-medium text-gray-700">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-accent-blue">{dim.dimension_id}</span>
                      <span className="text-gray-500 truncate">{translateDimensionName(dim.dimension_id, dim.dimension_name)}</span>
                    </div>
                    {artInfo && (
                      <span className="text-gray-400">{artInfo.article}</span>
                    )}
                  </td>
                  {ARTICLES.map(art => {
                    const strength = mapping[art]
                    let cellClass = 'bg-gray-50'
                    let content = ''
                    if (strength === 'primary') {
                      cellClass = 'bg-accent-blue/20'
                      content = '●'
                    } else if (strength === 'secondary') {
                      cellClass = 'bg-pastel-blue/40'
                      content = '○'
                    }
                    return (
                      <td key={art} className={`py-2 px-1 text-center rounded ${cellClass}`}>
                        <span className={strength === 'primary' ? 'text-accent-blue font-bold text-sm' : strength === 'secondary' ? 'text-accent-blue/50 text-sm' : 'text-gray-200'}>
                          {content || '–'}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-400">
        <div className="flex items-center gap-1">
          <span className="text-accent-blue font-bold">●</span> {t('mapping.primary')}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-accent-blue/50">○</span> {t('mapping.secondary')}
        </div>
        <div className="flex items-center gap-1">
          <span>–</span> {t('mapping.none')}
        </div>
      </div>
    </div>
  )
}
