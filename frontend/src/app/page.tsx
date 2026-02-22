'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { AnimatePresence } from 'motion/react'
import ChatPanel from '@/components/ChatPanel'
import ClickSpark from '@/components/ClickSpark'
import DimensionModal from '@/components/DimensionModal'
import { ParticleCard, GlobalSpotlight } from '@/components/ParticleCard'
import { useLanguage } from '@/i18n/LanguageContext'
import { useTranslatedDimensions } from '@/i18n/useTranslatedDimensions'
import { GLASS_CARD_STYLE, CARD_BASE } from '@/utils/styles'
import { API_BASE } from '@/utils/api'
import type { Dimension } from '@/types/assessment'

// F2: Progress info from localStorage
interface ProgressInfo {
  totalCriteria: number
  ratedCriteria: number
  currentDimIndex: number
}

const DIM_COLOR = { border: 'border-l-pastel-indigo', accent: 'text-accent-blue', bg: 'bg-pastel-indigo/40' }

interface HistoryEntry {
  timestamp: string
  overall_score: number
  maturity_label: string
  scoping: { system_name: string }
}

export default function Dashboard() {
  const { t } = useLanguage()
  const { translateDimension } = useTranslatedDimensions()
  const [dimensions, setDimensions] = useState<Dimension[]>([])
  const [selectedDim, setSelectedDim] = useState<Dimension | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  // F2: Progress indicators
  const [progress, setProgress] = useState<ProgressInfo | null>(null)
  // I2: Check if previous results exist
  const [hasResults, setHasResults] = useState(false)
  // Assessment history
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    fetch(`${API_BASE}/api/dimensions`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => { setDimensions(data); setLoadError(null) })
      .catch(err => {
        console.error('Failed to load dimensions:', err)
        setLoadError(t('dashboard.loadError'))
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // F2: Load progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('assessmentProgress')
      if (saved) {
        const { scores, currentDimIndex } = JSON.parse(saved) as { scores?: Record<string, unknown>; currentDimIndex?: number }
        if (scores) {
          setProgress({
            totalCriteria: 31, // 6 dimensions * ~5 criteria
            ratedCriteria: Object.keys(scores).length,
            currentDimIndex: typeof currentDimIndex === 'number' ? currentDimIndex : -1,
          })
        }
      }
      if (localStorage.getItem('assessmentResult')) {
        setHasResults(true)
      }
      // Load assessment history
      const historyRaw = localStorage.getItem('assessmentHistory')
      if (historyRaw) {
        try { setHistory(JSON.parse(historyRaw)) } catch {}
      }
    } catch {}
  }, [])

  const cardBase = `${CARD_BASE} cursor-pointer`

  // 5.2: Memoize scores from localStorage (parsed once, not per-dimension)
  const progressScores = useMemo<Record<string, unknown> | null>(() => {
    if (!progress) return null
    try {
      const saved = localStorage.getItem('assessmentProgress')
      if (!saved) return null
      const { scores } = JSON.parse(saved) as { scores?: Record<string, unknown> }
      return scores || null
    } catch {
      return null
    }
  }, [progress])

  // F2: Get progress for a specific dimension (uses memoized scores)
  const getDimProgress = (dim: Dimension): { rated: number; total: number } | null => {
    if (!progressScores) return null
    const rated = dim.criteria.filter(c => c.id in progressScores).length
    return rated > 0 ? { rated, total: dim.criteria.length } : null
  }

  // Reset assessment handler
  const handleResetAssessment = () => {
    localStorage.removeItem('assessmentProgress')
    localStorage.removeItem('assessmentResult')
    localStorage.removeItem('criterionScores')
    setProgress(null)
    setHasResults(false)
  }

  return (
    <div>
      {/* J1: Value Proposition Hero */}
      <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent mb-3">
        {t('dashboard.title')}
      </h1>
      <p className="text-gray-600 mb-4 leading-relaxed">
        {t('dashboard.subtitle')}
      </p>

      {/* J1: Value proposition points + J2: Time estimate */}
      <div className="mb-8 flex flex-wrap items-center gap-3" role="list" aria-label={t('dashboard.valuePropositions')}>
        {[
          { key: 'valueMaturity', icon: '◆' },
          { key: 'valueGapAnalysis', icon: '◆' },
          { key: 'valueActionPlan', icon: '◆' },
          { key: 'valueRegulatory', icon: '◆' },
        ].map(({ key, icon }) => (
          <span key={key} role="listitem" className="inline-flex items-center gap-1.5 text-xs bg-pastel-indigo/25 text-gray-700 px-3 py-1.5 rounded-full font-medium border border-pastel-indigo/30">
            <span className="text-accent-blue text-[8px]">{icon}</span>
            {t(`dashboard.${key}`)}
          </span>
        ))}
        {/* J2: Time estimate */}
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 px-3 py-1.5">
          <span aria-hidden="true">⏱️</span> {t('dashboard.timeEstimate')}
        </span>
      </div>

      {/* F2: Progress banner */}
      {progress && progress.ratedCriteria > 0 && (
        <div className="mb-8 p-4 rounded-xl bg-pastel-blue/10 border border-pastel-blue/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-blue/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{t('dashboard.progressTitle')}</p>
              <p className="text-xs text-gray-500">
                {t('dashboard.progressDesc')
                  .replace('{rated}', String(progress.ratedCriteria))
                  .replace('{total}', String(progress.totalCriteria))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAssessment}
              className="text-gray-400 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 transition-all duration-300 text-sm"
              title={t('dashboard.resetAssessment')}
            >
              {t('dashboard.resetAssessment')}
            </button>
            <a
              href="/assessment"
              className="bg-accent-blue text-white px-5 py-2 rounded-xl hover:bg-accent-indigo transition-all duration-300 font-medium text-sm shadow-sm hover:shadow-md"
            >
              {t('dashboard.continueAssessment')}
            </a>
          </div>
        </div>
      )}

      {/* I2: Results available banner */}
      {hasResults && !progress && (
        <div className="mb-8 p-4 rounded-xl bg-pastel-green/10 border border-pastel-green/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{t('dashboard.resultsAvailable')}</p>
              <p className="text-xs text-gray-500">{t('dashboard.resultsAvailableDesc')}</p>
            </div>
          </div>
          <a
            href="/results"
            className="bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700 transition-all duration-300 font-medium text-sm shadow-sm hover:shadow-md"
          >
            {t('dashboard.viewResults')}
          </a>
        </div>
      )}

      {/* Assessment History with Delta Reporting */}
      {history.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('dashboard.historyTitle')}</h3>
          <div className="flex gap-3 overflow-x-auto pb-2" role="list" aria-label={t('dashboard.historyTitle')}>
            {history.slice().reverse().map((entry, idx, reversed) => {
              const prevEntry = reversed[idx + 1]
              const delta = prevEntry ? entry.overall_score - prevEntry.overall_score : null
              return (
                <div key={idx} role="listitem" className="min-w-[220px] p-3 rounded-xl bg-white/50 border border-white/60 backdrop-blur-sm flex-shrink-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{entry.scoping?.system_name || '—'}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-lg font-bold text-accent-blue">
                      {entry.overall_score?.toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-500">{entry.maturity_label}</span>
                    {delta !== null && (
                      <span className={`text-xs font-medium ${delta > 0 ? 'text-accent-green' : delta < 0 ? 'text-accent-red' : 'text-gray-400'}`}>
                        {delta > 0 ? '↑' : delta < 0 ? '↓' : '='}{Math.abs(delta).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <GlobalSpotlight gridRef={gridRef} />

      <div ref={gridRef} className="dashboard-bento-grid mb-16">
        {/* Error state when API fails */}
        {loadError && dimensions.length === 0 && (
          <div className="col-span-full p-6 rounded-xl bg-red-50/50 border border-red-200 text-center" role="alert">
            <p className="text-sm text-red-700 font-medium mb-2">{loadError}</p>
            <button
              onClick={() => {
                setLoadError(null)
                fetch(`${API_BASE}/api/dimensions`)
                  .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() })
                  .then(data => { setDimensions(data); setLoadError(null) })
                  .catch(err => { console.error(err); setLoadError(t('dashboard.loadError')) })
              }}
              className="text-xs text-accent-blue hover:text-accent-indigo font-medium transition-colors"
            >
              {t('dashboard.retry')}
            </button>
          </div>
        )}
        {/* Skeleton loading cards while API loads */}
        {!loadError && dimensions.length === 0 && [...Array(6)].map((_, i) => (
          <div key={`skeleton-${i}`} className={`${CARD_BASE} animate-pulse`} style={GLASS_CARD_STYLE} aria-hidden="true">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 bg-pastel-slate rounded w-3/4" />
                <div className="h-5 w-12 bg-pastel-slate/60 rounded-full" />
              </div>
              <div className="space-y-2 mb-3 flex-1">
                <div className="h-3 bg-pastel-slate/60 rounded w-full" />
                <div className="h-3 bg-pastel-slate/40 rounded w-5/6" />
              </div>
              <div className="h-3 bg-pastel-slate/40 rounded w-1/3 mt-auto" />
            </div>
          </div>
        ))}
        {dimensions.map(dim => {
          const colors = DIM_COLOR
          const tDim = translateDimension(dim)
          const dimProgress = getDimProgress(dim)

          return (
            <ParticleCard
              key={dim.id}
              className={`${cardBase} border-l-4 ${colors.border}`}
              style={GLASS_CARD_STYLE}
              onClick={() => setSelectedDim(dim)}
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{dim.id}: {tDim.name}</h3>
                  <span className={`text-xs ${colors.bg} ${colors.accent} font-medium px-2.5 py-1 rounded-full`}>
                    {dim.article}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed flex-1">{tDim.description}</p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className={`text-xs ${colors.accent} font-medium`}>
                    {dim.criteria.length} {t('dashboard.criteriaCount')}
                  </span>
                  {/* F2: Progress indicator per dimension */}
                  {dimProgress ? (
                    <span className="text-xs text-accent-green font-medium flex items-center gap-1.5">
                      <span className="inline-block w-8 h-1.5 rounded-full bg-pastel-slate overflow-hidden">
                        <span
                          className="block h-full rounded-full bg-accent-green transition-all"
                          style={{ width: `${(dimProgress.rated / dimProgress.total) * 100}%` }}
                        />
                      </span>
                      {dimProgress.rated}/{dimProgress.total}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {t('dashboard.clickForDetails')}
                    </span>
                  )}
                </div>
              </div>
            </ParticleCard>
          )
        })}

        {/* Quick Start Card */}
        <ParticleCard className={`${cardBase}`} style={GLASS_CARD_STYLE}>
          <div className="flex flex-col justify-between h-full">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.howItWorksTitle')}</h2>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-pastel-blue/50 text-accent-blue font-bold text-sm flex items-center justify-center">1</span>
                  <div>
                    <span className="font-medium text-gray-800 text-sm">{t('dashboard.step1Label')}</span>
                    <span className="text-xs text-gray-500 ml-1">{t('dashboard.step1Desc')}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-pastel-blue/50 text-accent-blue font-bold text-sm flex items-center justify-center">2</span>
                  <div>
                    <span className="font-medium text-gray-800 text-sm">{t('dashboard.step2Label')}</span>
                    <span className="text-xs text-gray-500 ml-1">{t('dashboard.step2Desc')}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-pastel-blue/50 text-accent-blue font-bold text-sm flex items-center justify-center">3</span>
                  <div>
                    <span className="font-medium text-gray-800 text-sm">{t('dashboard.step3Label')}</span>
                    <span className="text-xs text-gray-500 ml-1">{t('dashboard.step3Desc')}</span>
                  </div>
                </div>
              </div>
            </div>
            <ClickSpark sparkColor="#5C6BC0" sparkCount={10} extraScale={1.2}>
              <a
                href="/assessment"
                className="inline-block bg-accent-blue text-white px-8 py-3 rounded-xl hover:bg-accent-indigo transition-all duration-300 font-medium shadow-md hover:shadow-lg"
              >
                {t('dashboard.startAssessment')}
              </a>
            </ClickSpark>
          </div>
        </ParticleCard>
      </div>

      {/* Methodology Section (Manko 18: Academic embedding) */}
      <div className="mb-16 p-6 rounded-2xl bg-white/40 border border-pastel-indigo/20 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('dashboard.methodologyTitle')}</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-2">{t('dashboard.methodologyDesc')}</p>
        <p className="text-xs text-gray-500 leading-relaxed mb-1">{t('dashboard.methodologyScoring')}</p>
        <p className="text-xs text-gray-400 leading-relaxed">{t('dashboard.methodologySources')}</p>
      </div>

      <AnimatePresence>
        {selectedDim && (
          <DimensionModal
            dimension={selectedDim}
            onClose={() => setSelectedDim(null)}
          />
        )}
      </AnimatePresence>

      <ChatPanel page="dashboard" />
    </div>
  )
}
