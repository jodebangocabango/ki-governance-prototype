'use client'

import { useLanguage } from '@/i18n/LanguageContext'
import { useTranslatedDimensions } from '@/i18n/useTranslatedDimensions'

interface GapItem {
  dimension_id: string
  dimension_name: string
  dim_score: number
  gap_severity: string
  priority_rank: number
}

interface RoadmapTimelineProps {
  gaps: GapItem[]
}

const phaseColors = {
  critical: { bar: 'bg-gradient-to-r from-red-400 to-red-300', badge: 'bg-pastel-pink text-accent-red' },
  significant: { bar: 'bg-gradient-to-r from-orange-400 to-orange-300', badge: 'bg-pastel-orange text-accent-orange' },
  moderate: { bar: 'bg-gradient-to-r from-yellow-400 to-yellow-300', badge: 'bg-pastel-yellow text-accent-yellow' },
}

export default function RoadmapTimeline({ gaps }: RoadmapTimelineProps) {
  const { t } = useLanguage()
  const { translateDimensionName } = useTranslatedDimensions()

  if (gaps.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <span className="text-xs font-medium text-gray-500 mb-3">{t('roadmap.title')}</span>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">{t('roadmap.noGaps')}</p>
        </div>
      </div>
    )
  }

  // Group gaps by severity into phases
  const critical = gaps.filter(g => g.gap_severity === 'critical')
  const significant = gaps.filter(g => g.gap_severity === 'significant')
  const moderate = gaps.filter(g => g.gap_severity === 'moderate')

  // Sequential phase numbering — always starts at Phase 1 regardless of which severities exist
  const MONTH_RANGES: Record<string, string> = { critical: '1–3', significant: '3–6', moderate: '6–12' }
  const monthLabel = t('roadmap.month')
  const phases = [
    { key: 'critical', items: critical, sevLabel: t('gap.severityCritical') },
    { key: 'significant', items: significant, sevLabel: t('gap.severitySignificant') },
    { key: 'moderate', items: moderate, sevLabel: t('gap.severityModerate') },
  ]
    .filter(p => p.items.length > 0)
    .map((phase, idx) => ({
      key: phase.key,
      items: phase.items,
      label: `Phase ${idx + 1} (${monthLabel} ${MONTH_RANGES[phase.key]})`,
      desc: `${phase.sevLabel}: ${phase.items.map(g => g.dimension_id).join(', ')}`,
    }))

  return (
    <div className="flex flex-col h-full">
      <span className="text-xs font-medium text-gray-500 mb-3">{t('roadmap.title')}</span>

      {/* Timeline */}
      <div className="flex-1 relative">
        {/* Vertical line */}
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-pastel-slate" />

        <div className="space-y-4">
          {phases.map((phase) => {
            const colors = phaseColors[phase.key as keyof typeof phaseColors] || phaseColors.moderate
            return (
              <div key={phase.key} className="relative pl-9">
                {/* Timeline dot */}
                <div className={`absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white ${colors.bar}`} />

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-gray-700">{phase.label}</span>
                    <span className="text-[10px] text-gray-400">{phase.desc}</span>
                  </div>

                  <div className="space-y-1">
                    {phase.items.map(gap => (
                      <div key={gap.dimension_id} className="flex items-center gap-2">
                        {/* Gantt bar */}
                        <div className={`h-5 rounded-md flex items-center px-2 ${colors.bar}`}
                          style={{ minWidth: `${Math.max(40, (5 - gap.dim_score) * 30)}%` }}
                        >
                          <span className="text-[10px] font-semibold text-white whitespace-nowrap">
                            {gap.dimension_id}: {translateDimensionName(gap.dimension_id, gap.dimension_name)}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {gap.dim_score.toFixed(1)}/5
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
