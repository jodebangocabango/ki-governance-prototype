'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { useLanguage } from '@/i18n/LanguageContext'
import { getLevelKey } from '@/utils/complianceHelpers'
import { de } from '@/i18n/translations/de'
import { en } from '@/i18n/translations/en'
import { fr } from '@/i18n/translations/fr'

const translations = { de, en, fr } as const

type DimGuide = typeof de.actionPlan.d1
type LevelKey = keyof DimGuide['levels']

const dimKeys = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'] as const
type DimKey = (typeof dimKeys)[number]

function getDimGuide(actionPlan: Record<string, unknown>, dimId: string): DimGuide | null {
  const key = dimId.toLowerCase()
  if (!dimKeys.includes(key as DimKey)) return null
  return actionPlan[key] as DimGuide | null
}

/* ---- Component ---- */

interface ActionPlanProps {
  dimensionId: string
  dimensionName: string
  score: number
  severity: string
  onClose: () => void
}

export default function ActionPlan({ dimensionId, dimensionName, score, severity, onClose }: ActionPlanProps) {
  const { locale, t } = useLanguage()
  const trans = translations[locale] as any
  const guide = getDimGuide(trans.actionPlan as unknown as Record<string, unknown>, dimensionId)
  const levelKey = getLevelKey(score) as LevelKey
  const levelGuide = guide?.levels[levelKey]
  const [expandedStep, setExpandedStep] = useState<number | null>(null)

  // B2: Effort data
  const effortData = trans.effort?.[dimensionId]

  if (!guide || !levelGuide) return null

  const severityColors: Record<string, { bg: string; border: string; text: string }> = {
    critical: { bg: 'bg-pastel-pink/20', border: 'border-pastel-pink', text: 'text-accent-red' },
    significant: { bg: 'bg-pastel-orange/20', border: 'border-pastel-orange', text: 'text-accent-orange' },
    moderate: { bg: 'bg-pastel-yellow/20', border: 'border-pastel-yellow', text: 'text-accent-yellow' },
  }
  const sColors = severityColors[severity] || severityColors.moderate

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      <motion.div
        className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 24px 80px rgba(92, 107, 192, 0.2), 0 8px 32px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-8 pt-8 pb-4" style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
        }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-800">
                  {t('actionPlan.title')}: {dimensionId} {dimensionName}
                </h2>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${sColors.bg} ${sColors.text} border ${sColors.border}`}>
                  Score: {score.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {guide.article} EU AI Act — {levelGuide.target}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-pastel-slate/60 hover:bg-pastel-slate text-gray-500 hover:text-gray-700 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="1" y1="1" x2="13" y2="13" />
                <line x1="13" y1="1" x2="1" y2="13" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-8 pb-8 space-y-6">
          {/* Action Steps */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              {t('actionPlan.implementationSteps')}
            </h3>
            <div className="space-y-3">
              {levelGuide.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/60 bg-white/50 overflow-hidden transition-all hover:shadow-sm"
                >
                  <button
                    onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                    className="w-full flex items-start gap-3 p-4 text-left"
                  >
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-pastel-blue/50 text-accent-blue font-bold text-xs flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-sm">{step.title}</h4>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 mt-1 ${expandedStep === idx ? 'rotate-180' : ''}`}
                      viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                    >
                      <path d="M4 6l4 4 4-4" />
                    </svg>
                  </button>
                  {expandedStep === idx && (
                    <div className="px-4 pb-4 pl-14">
                      <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Wins */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {t('actionPlan.quickWinsTitle')}
            </h3>
            <div className="bg-pastel-green/10 border border-pastel-green/40 rounded-xl p-4">
              <ul className="space-y-2">
                {levelGuide.quickWins.map((win, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="text-accent-green mt-0.5 font-bold">✓</span>
                    <span className="leading-relaxed">{win}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* B2: Effort Estimation */}
          {effortData && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {t('effort.label')}
              </h3>
              <div className="bg-pastel-indigo/10 border border-pastel-indigo/30 rounded-xl p-4">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">&#9200;</span>
                    <span className="font-medium text-gray-700">{effortData.hours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">&#128197;</span>
                    <span className="font-medium text-gray-700">{effortData.weeks}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">T-Shirt:</span>
                    <span className="font-bold text-accent-purple bg-pastel-indigo/30 px-2.5 py-0.5 rounded-full text-xs">{effortData.size}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* B4: Success Criteria Checklist */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {t('successCriteria.title')}
            </h3>
            <div className="bg-pastel-blue/10 border border-pastel-blue/30 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-3">{t('successCriteria.description')}</p>
              <ul className="space-y-2">
                {levelGuide.steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-4 h-4 mt-0.5 rounded border border-gray-300 flex items-center justify-center text-[10px] text-gray-400 font-medium">{idx + 1}</span>
                    <span className="leading-relaxed">{step.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {t('actionPlan.sourcesTitle')}
            </h3>
            <div className="space-y-2">
              {guide.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-white/60 hover:bg-pastel-blue/10 hover:border-pastel-blue/30 transition-all group"
                >
                  <svg className="w-4 h-4 text-accent-blue flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 3H3v10h10v-3M9 2h5v5M14 2L7 9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm text-gray-700 group-hover:text-accent-blue transition-colors">{source.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
