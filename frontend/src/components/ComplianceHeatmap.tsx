'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'
import { useTranslatedDimensions } from '@/i18n/useTranslatedDimensions'
import { getHeatmapClasses } from '@/utils/complianceHelpers'

interface CriterionScore {
  id: string
  score: number | null // null = N/A
}

interface DimensionResult {
  dimension_id: string
  dimension_name: string
  dim_score: number | null
  num_rated: number
  num_na: number
}

interface ComplianceHeatmapProps {
  dimensions: DimensionResult[]
}

// Criteria count per dimension (from knowledge_base.json)
const CRITERIA_MAP: Record<string, string[]> = {
  D1: ['D1.1', 'D1.2', 'D1.3', 'D1.4', 'D1.5', 'D1.6'],
  D2: ['D2.1', 'D2.2', 'D2.3', 'D2.4', 'D2.5'],
  D3: ['D3.1', 'D3.2', 'D3.3', 'D3.4', 'D3.5'],
  D4: ['D4.1', 'D4.2', 'D4.3', 'D4.4', 'D4.5'],
  D5: ['D5.1', 'D5.2', 'D5.3', 'D5.4', 'D5.5'],
  D6: ['D6.1', 'D6.2', 'D6.3', 'D6.4', 'D6.5'],
}

export default function ComplianceHeatmap({ dimensions }: ComplianceHeatmapProps) {
  const { t } = useLanguage()
  const { translateDimensionName } = useTranslatedDimensions()
  const [scores, setScores] = useState<Record<string, number | null>>({})
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)

  // Load criterion-level scores from localStorage (B1: dual-key pattern)
  useEffect(() => {
    try {
      // Try dedicated criterionScores key first (persists after submit)
      const dedicated = localStorage.getItem('criterionScores')
      if (dedicated) {
        const parsed = JSON.parse(dedicated)
        if (typeof parsed === 'object' && parsed !== null) {
          setScores(parsed)
          return
        }
      }
      // Fallback: try assessmentProgress (during active assessment)
      const progress = localStorage.getItem('assessmentProgress')
      if (progress) {
        const parsed = JSON.parse(progress)
        if (parsed.scores) {
          setScores(parsed.scores)
        }
      }
    } catch {
      // Fallback: no criterion scores available
    }
  }, [])

  // Max criteria columns (D1 has 6, rest have 5)
  const maxCols = 6

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {t('heatmap.title')}
        </span>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[10px] font-medium text-gray-400 pb-2 pr-3 w-16"></th>
              {Array.from({ length: maxCols }, (_, i) => (
                <th key={i} className="text-center text-[10px] font-medium text-gray-400 pb-2 px-0.5">
                  .{i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dimensions.map(dim => {
              const criteria = CRITERIA_MAP[dim.dimension_id] || []
              return (
                <tr key={dim.dimension_id}>
                  <td className="text-[10px] font-semibold text-gray-600 pr-3 py-0.5 whitespace-nowrap">
                    {dim.dimension_id}
                  </td>
                  {Array.from({ length: maxCols }, (_, i) => {
                    const critId = criteria[i]
                    if (!critId) {
                      return <td key={i} className="px-0.5 py-0.5"><div className="w-full h-8 rounded" /></td>
                    }
                    const score = scores[critId] !== undefined ? scores[critId] : null
                    const heatClasses = getHeatmapClasses(score)
                    const isHovered = hoveredCell === critId

                    return (
                      <td key={i} className="px-0.5 py-0.5">
                        <div
                          className={`relative w-full h-8 rounded flex items-center justify-center cursor-default transition-all duration-200 ${heatClasses.bg} ${heatClasses.text} ${isHovered ? 'ring-2 ring-accent-blue scale-105 z-10' : ''}`}
                          onMouseEnter={() => setHoveredCell(critId)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          <span className="text-[10px] font-bold">
                            {score !== null && score !== undefined ? score : '\u2013'}
                          </span>

                          {/* Tooltip */}
                          {isHovered && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-[10px] rounded-lg whitespace-nowrap z-50 shadow-lg pointer-events-none">
                              <div className="font-semibold">{critId}</div>
                              <div>Score: {score !== null && score !== undefined ? score : 'N/A'}</div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
                            </div>
                          )}
                        </div>
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
      <div className="flex items-center justify-center gap-1 mt-3">
        <span className="text-[9px] text-gray-400">1</span>
        {[1, 2, 3, 4, 5].map(level => {
          const cls = getHeatmapClasses(level)
          return (
            <div key={level} className={`w-5 h-3 rounded-sm ${cls.bg}`} />
          )
        })}
        <span className="text-[9px] text-gray-400">5</span>
        <span className="text-[9px] text-gray-400 ml-2">
          <span className="inline-block w-5 h-3 rounded-sm bg-gray-100 align-middle mr-0.5" /> N/A
        </span>
      </div>
    </div>
  )
}
