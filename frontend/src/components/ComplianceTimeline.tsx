'use client'

import { useLanguage } from '@/i18n/LanguageContext'

const LOCALE_MAP: Record<string, string> = {
  de: 'de-DE',
  en: 'en-US',
  fr: 'fr-FR',
}

/**
 * E3: Timeline of EU AI Act compliance deadlines.
 * Shows key milestones and highlights the user's relevant deadline.
 */

interface ComplianceTimelineProps {
  riskCategory: string
}

interface Milestone {
  date: string
  key: string
  done: boolean
  highlight?: boolean
}

export default function ComplianceTimeline({ riskCategory }: ComplianceTimelineProps) {
  const { t, locale } = useLanguage()

  const now = new Date()

  const milestones: Milestone[] = [
    {
      date: '2025-02-02',
      key: 'timeline.m1',
      done: now >= new Date('2025-02-02'),
    },
    {
      date: '2025-08-02',
      key: 'timeline.m2',
      done: now >= new Date('2025-08-02'),
    },
    {
      date: '2026-08-02',
      key: 'timeline.m3',
      done: now >= new Date('2026-08-02'),
      highlight: riskCategory === 'high-risk',
    },
    {
      date: '2027-08-02',
      key: 'timeline.m4',
      done: now >= new Date('2027-08-02'),
    },
  ]

  // Calculate remaining time for the relevant deadline
  const relevantDeadline = riskCategory === 'high-risk'
    ? new Date('2026-08-02')
    : new Date('2027-08-02')
  const daysRemaining = Math.max(0, Math.ceil((relevantDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const monthsRemaining = Math.max(0, Math.ceil(daysRemaining / 30))

  return (
    <div className="flex flex-col h-full">
      <span className="text-xs font-medium text-gray-500 mb-1">{t('timeline.title')}</span>
      <p className="text-[10px] text-gray-400 mb-4">{t('timeline.subtitle')}</p>

      {/* Timeline */}
      <div className="flex-1 relative">
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-pastel-slate" />

        <div className="space-y-4">
          {milestones.map((ms, idx) => {
            const dateObj = new Date(ms.date)
            const dateStr = dateObj.toLocaleDateString(LOCALE_MAP[locale] || 'de-DE', { month: 'short', year: 'numeric' })

            return (
              <div key={idx} className="relative pl-9">
                {/* Dot */}
                <div className={`absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white ${
                  ms.done
                    ? 'bg-green-500'
                    : ms.highlight
                    ? 'bg-accent-blue animate-pulse'
                    : 'bg-gray-300'
                }`} />

                <div className={`rounded-lg px-3 py-2 ${
                  ms.highlight
                    ? 'bg-accent-blue/10 border border-accent-blue/30'
                    : ms.done
                    ? 'bg-pastel-green/20'
                    : ''
                }`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-bold ${ms.done ? 'text-green-600' : ms.highlight ? 'text-accent-blue' : 'text-gray-600'}`}>
                      {dateStr}
                    </span>
                    {ms.done && (
                      <span className="text-[10px] text-green-500 font-medium">✓</span>
                    )}
                    {ms.highlight && !ms.done && (
                      <span className="text-[10px] text-accent-blue font-medium px-1.5 py-0.5 rounded bg-accent-blue/10">
                        {t('timeline.yourDeadline')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{t(ms.key)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Remaining time */}
      <div className="mt-4 px-3 py-2 rounded-lg bg-pastel-indigo/10 border border-pastel-indigo/30">
        <p className="text-[11px] text-gray-600">
          <span className="font-semibold text-accent-purple">{t('timeline.remaining')}:</span>{' '}
          {t('timeline.remainingText')
            .replace('{months}', String(monthsRemaining))
            .replace('{days}', String(daysRemaining))}
        </p>
      </div>
    </div>
  )
}
