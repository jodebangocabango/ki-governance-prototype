'use client'

import { useLanguage } from '@/i18n/LanguageContext'

/**
 * F3: Maturity level distribution bar chart.
 * Shows how many criteria fall on each maturity level (1-5).
 */

interface MaturityDistributionProps {
  dimensions: {
    dimension_id: string
    dim_score: number | null
  }[]
}

export default function MaturityDistribution({ dimensions }: MaturityDistributionProps) {
  const { t } = useLanguage()

  // Load criterion scores from localStorage (B1: dual-key pattern)
  let distribution = [0, 0, 0, 0, 0] // Level 1-5 counts
  let totalRated = 0

  try {
    if (typeof window !== 'undefined') {
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
        if (saved) {
          const progress = JSON.parse(saved) as { scores?: Record<string, number | null> }
          scores = progress.scores
        }
      }
      if (scores) {
        for (const [, score] of Object.entries(scores)) {
          if (score !== null && typeof score === 'number') {
            const level = Math.min(5, Math.max(1, Math.round(score)))
            distribution[level - 1]++
            totalRated++
          }
        }
      }
    }
  } catch {}

  // Fallback: use dimension scores to estimate
  if (totalRated === 0) {
    for (const dim of dimensions) {
      if (dim.dim_score !== null) {
        const level = Math.min(5, Math.max(1, Math.round(dim.dim_score)))
        distribution[level - 1]++
        totalRated++
      }
    }
  }

  const maxCount = Math.max(...distribution, 1)
  const levels = [
    { label: t('maturityDist.level1'), color: 'bg-red-400', level: 1 },
    { label: t('maturityDist.level2'), color: 'bg-orange-400', level: 2 },
    { label: t('maturityDist.level3'), color: 'bg-yellow-400', level: 3 },
    { label: t('maturityDist.level4'), color: 'bg-blue-400', level: 4 },
    { label: t('maturityDist.level5'), color: 'bg-green-400', level: 5 },
  ]

  return (
    <div className="flex flex-col h-full">
      <span className="text-xs font-medium text-gray-500 mb-1">{t('maturityDist.title')}</span>
      <p className="text-[10px] text-gray-400 mb-3">{t('maturityDist.subtitle')}</p>

      <div className="flex-1 flex items-end gap-2 px-2 pb-1">
        {levels.map((lvl, idx) => {
          const count = distribution[idx]
          const height = totalRated > 0 ? Math.max(8, (count / maxCount) * 100) : 8

          return (
            <div key={lvl.level} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-gray-600">{count}</span>
              <div className="w-full relative" style={{ height: '80px' }}>
                <div
                  className={`absolute bottom-0 left-0 right-0 ${lvl.color} rounded-t-lg transition-all duration-500`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-[9px] text-gray-500 text-center leading-tight">{lvl.label}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-2 text-center">
        <span className="text-[10px] text-gray-400">
          {t('maturityDist.total').replace('{n}', String(totalRated))}
        </span>
      </div>
    </div>
  )
}
