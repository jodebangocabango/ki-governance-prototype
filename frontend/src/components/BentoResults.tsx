'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { compressToEncodedURIComponent } from 'lz-string'
import GapAnalysis from '@/components/GapAnalysis'
import ExecutiveSummary from '@/components/ExecutiveSummary'
import ArticleCompliance from '@/components/ArticleCompliance'
import ComplianceHeatmap from '@/components/ComplianceHeatmap'
import RoadmapTimeline from '@/components/RoadmapTimeline'
import ArticleMappingChart from '@/components/ArticleMappingChart'
import ComplianceTimeline from '@/components/ComplianceTimeline'
import GlossaryPanel from '@/components/GlossaryPanel'
import RACIMatrix from '@/components/RACIMatrix'
import MaturityDistribution from '@/components/MaturityDistribution'
import PDFExport from '@/components/PDFExport'
import { ParticleCard, GlobalSpotlight } from '@/components/ParticleCard'
import { useLanguage } from '@/i18n/LanguageContext'
import { useTranslatedDimensions } from '@/i18n/useTranslatedDimensions'
import { getComplianceInfo } from '@/utils/complianceHelpers'
import { GLASS_CARD_STYLE, CARD_BASE } from '@/utils/styles'
import type { AssessmentResult } from '@/types/assessment'

const RadarChart = dynamic(() => import('@/components/RadarChart'), { ssr: false })

/* ---- Types ---- */

interface BentoResultsProps {
  result: AssessmentResult
}

/* ---- Constants ---- */

const maturityStyles: Record<string, { text: string; bg: string }> = {
  'Initial':    { text: 'text-red-500',    bg: 'bg-pastel-pink/40' },
  'Managed':    { text: 'text-orange-500', bg: 'bg-pastel-orange/40' },
  'Defined':    { text: 'text-yellow-600', bg: 'bg-pastel-yellow/40' },
  'Measured':   { text: 'text-blue-500',   bg: 'bg-pastel-blue/40' },
  'Optimizing': { text: 'text-green-500',  bg: 'bg-pastel-green/40' },
}

const getScoreBarGradient = (score: number) => {
  if (score >= 3.5) return 'from-pastel-green to-green-400/60'
  if (score >= 2.5) return 'from-pastel-yellow to-yellow-400/60'
  return 'from-pastel-pink to-red-400/40'
}

/* ---- B2: Card Definitions for Show/Hide Toggle ---- */

interface CardDef {
  id: string
  labelKey: string
  /** Tailwind column span class (empty = default 1 col) */
  colSpan: string
  /** Tailwind row span class (empty = default 1 row) */
  rowSpan: string
}

const CARD_DEFS: CardDef[] = [
  { id: 'executive-summary',    labelKey: 'bento.cardExecutiveSummary',   colSpan: 'col-span-2', rowSpan: '' },
  { id: 'overall-score',        labelKey: 'bento.cardOverallScore',       colSpan: '', rowSpan: '' },
  { id: 'radar-chart',          labelKey: 'bento.cardRadarChart',         colSpan: '', rowSpan: '' },
  { id: 'article-compliance',   labelKey: 'bento.cardArticleCompliance',  colSpan: '', rowSpan: '' },
  { id: 'gap-analysis',         labelKey: 'bento.cardGapAnalysis',        colSpan: 'col-span-2', rowSpan: 'row-span-2' },
  { id: 'dimension-scores',     labelKey: 'bento.cardDimensionScores',    colSpan: 'col-span-2', rowSpan: 'row-span-2' },
  { id: 'compliance-heatmap',   labelKey: 'bento.cardComplianceHeatmap',  colSpan: 'col-span-2', rowSpan: '' },
  { id: 'roadmap-timeline',     labelKey: 'bento.cardRoadmapTimeline',    colSpan: 'col-span-2', rowSpan: '' },
  { id: 'article-mapping',      labelKey: 'bento.cardArticleMapping',     colSpan: 'col-span-2', rowSpan: '' },
  { id: 'compliance-timeline',  labelKey: 'bento.cardComplianceTimeline', colSpan: '', rowSpan: '' },
  { id: 'glossary',             labelKey: 'bento.cardGlossary',           colSpan: '', rowSpan: '' },
  { id: 'raci-matrix',          labelKey: 'bento.cardRACIMatrix',         colSpan: 'col-span-2', rowSpan: '' },
  { id: 'maturity-detail',      labelKey: 'bento.cardMaturityDetail',     colSpan: '', rowSpan: '' },
  { id: 'maturity-distribution',labelKey: 'bento.cardMaturityDist',       colSpan: 'col-span-2', rowSpan: '' },
  { id: 'actions',              labelKey: 'bento.cardActions',            colSpan: '', rowSpan: '' },
]

const VISIBILITY_KEY = 'resultsCardVisibility'
const ALL_IDS = CARD_DEFS.map(c => c.id)

/* ---- Main Component ---- */

export default function BentoResults({ result }: BentoResultsProps) {
  const { t } = useLanguage()
  const { translateDimensionName, translateMaturityLabel } = useTranslatedDimensions()
  const gridRef = useRef<HTMLDivElement>(null)
  const matStyle = maturityStyles[result.maturity_label] || { text: 'text-gray-600', bg: 'bg-gray-100' }
  const [scoringOpen, setScoringOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  // B2: Card visibility state
  const [visibleCards, setVisibleCards] = useState<Set<string>>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(VISIBILITY_KEY) : null
      if (saved) {
        const arr = JSON.parse(saved)
        if (Array.isArray(arr)) return new Set(arr as string[])
      }
    } catch {}
    return new Set(ALL_IDS)
  })

  // Persist visibility to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(VISIBILITY_KEY, JSON.stringify(Array.from(visibleCards)))
    } catch {}
  }, [visibleCards])

  const toggleCard = (id: string) => {
    setVisibleCards(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const resetFilter = () => setVisibleCards(new Set(ALL_IDS))
  const isVisible = (id: string) => visibleCards.has(id)
  const hiddenCount = ALL_IDS.length - visibleCards.size

  // D4: Shareable Link (A6: static import for speed)
  const handleShareLink = useCallback(async () => {
    try {
      const compressed = compressToEncodedURIComponent(JSON.stringify(result))
      const url = `${window.location.origin}/results?data=${compressed}`
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // Fallback: plain base64
      const b64 = btoa(encodeURIComponent(JSON.stringify(result)))
      const url = `${window.location.origin}/results?data=${b64}`
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }, [result])

  const cardBase = CARD_BASE
  const cardStyle = GLASS_CARD_STYLE

  /** Wrapper: renders a ParticleCard with inline span classes if visible */
  const Card = ({ id, children }: { id: string; children: React.ReactNode }) => {
    if (!isVisible(id)) return null
    const def = CARD_DEFS.find(c => c.id === id)!
    const spanClass = [def.colSpan, def.rowSpan].filter(Boolean).join(' ')
    return (
      <ParticleCard className={`${cardBase} ${spanClass}`} style={cardStyle}>
        {children}
      </ParticleCard>
    )
  }

  return (
    <>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent mb-6">
        {t('bento.title')}
      </h1>
      <p className="text-gray-600 mb-4">
        {result.scoping.system_name} | {result.scoping.industry} | {result.scoping.risk_category}
      </p>

      {/* B2: Card Filter Toolbar */}
      <div className="mb-6">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className="text-xs text-gray-400 hover:text-accent-blue transition-colors flex items-center gap-1.5"
        >
          <svg className={`w-3 h-3 transition-transform ${filterOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {t('bento.filterCards')}
          {hiddenCount > 0 && (
            <span className="text-[10px] bg-pastel-pink/40 text-accent-red px-1.5 py-0.5 rounded-full">
              {hiddenCount} {t('bento.hidden')}
            </span>
          )}
        </button>
        {filterOpen && (
          <div className="mt-3 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-gray-500">{t('bento.selectCards')}</span>
              <button
                onClick={resetFilter}
                className="text-[10px] text-accent-blue hover:text-accent-indigo transition-colors font-medium"
              >
                {t('bento.resetFilter')}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CARD_DEFS.map(card => {
                const active = visibleCards.has(card.id)
                return (
                  <button
                    key={card.id}
                    onClick={() => toggleCard(card.id)}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-all duration-200 ${
                      active
                        ? 'bg-accent-blue/10 text-accent-blue border border-accent-blue/30'
                        : 'bg-gray-100 text-gray-400 border border-gray-200 line-through'
                    }`}
                  >
                    {t(card.labelKey)}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <GlobalSpotlight gridRef={gridRef} />

      <div ref={gridRef} className="results-grid mb-10">

        {/* Card 1: Executive Summary */}
        <Card id="executive-summary">
          <ExecutiveSummary
            systemName={result.scoping.system_name}
            overallScore={result.overall_score}
            maturityLabel={result.maturity_label}
            dimensions={result.dimensions}
            riskCategory={result.scoping.risk_category}
          />
        </Card>

        {/* Card 2: Overall Score + Scoring Transparency */}
        <Card id="overall-score">
          <div className="flex flex-col justify-between h-full min-h-[200px]">
            <span className="text-xs font-medium text-gray-500">{t('bento.overallMaturity')}</span>
            <div className="text-center py-4">
              <div className="text-5xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
                {result.overall_score.toFixed(1)}
              </div>
              <span className={`inline-block mt-3 text-sm font-semibold px-4 py-1.5 rounded-full ${matStyle.text} ${matStyle.bg}`}>
                {translateMaturityLabel(result.maturity_label)}
              </span>
            </div>
            <button
              onClick={() => setScoringOpen(!scoringOpen)}
              className="text-xs text-gray-400 hover:text-accent-blue transition-colors flex items-center gap-1"
            >
              <svg className={`w-3 h-3 transition-transform ${scoringOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {t('scoring.howCalculated')}
            </button>
            {scoringOpen && (
              <div className="mt-3 pt-3 border-t border-pastel-slate space-y-2 text-[10px] text-gray-500 leading-relaxed">
                <p>{t('scoring.dimFormula')}</p>
                <p>{t('scoring.overallFormula')}</p>
                <p>{t('scoring.gapThreshold')}</p>
                <p className="text-gray-400 italic">{t('scoring.transparency')}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Card 3: Radar Chart */}
        <Card id="radar-chart">
          <div className="flex flex-col h-full min-h-[200px]">
            <span className="text-xs font-medium text-gray-500 mb-2">{t('bento.governanceProfile')}</span>
            <div className="flex-1 min-h-[180px]">
              <RadarChart dimensions={result.dimensions} />
            </div>
          </div>
        </Card>

        {/* Card 4: Article Compliance */}
        <Card id="article-compliance">
          <ArticleCompliance dimensions={result.dimensions} />
        </Card>

        {/* Card 5: Gap Analysis */}
        <Card id="gap-analysis">
          <div className="flex flex-col h-full">
            <span className="text-xs font-medium text-gray-500 mb-3">{t('bento.gapAnalysis')}</span>
            <h3 className="font-semibold text-gray-800 mb-4">
              {t('bento.priorityActions')}
            </h3>
            <div className="flex-1 overflow-y-auto">
              <GapAnalysis gaps={result.gaps} />
            </div>
          </div>
        </Card>

        {/* Card 6: Dimension Scores Table */}
        <Card id="dimension-scores">
          <div className="flex flex-col h-full">
            <span className="text-xs font-medium text-gray-500 mb-3">{t('bento.dimensionScores')}</span>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pastel-indigo/30">
                    <th className="text-left py-2 text-xs font-semibold text-gray-500">{t('bento.dimensionHeader')}</th>
                    <th className="text-center py-2 text-xs font-semibold text-gray-500">{t('bento.scoreHeader')}</th>
                    <th className="text-left py-2 text-xs font-semibold text-gray-500">{t('bento.levelHeader')}</th>
                    <th className="text-center py-2 text-xs font-semibold text-gray-500">{t('bento.statusHeader')}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.dimensions.map(dim => {
                    const score = dim.dim_score ?? 0
                    const barWidth = (score / 5) * 100
                    const matLabel = dim.dim_score != null
                      ? dim.dim_score >= 4.5 ? 'Optimizing'
                      : dim.dim_score >= 3.5 ? 'Measured'
                      : dim.dim_score >= 2.5 ? 'Defined'
                      : dim.dim_score >= 1.5 ? 'Managed'
                      : 'Initial'
                      : ''
                    const ls = maturityStyles[matLabel] || { text: 'text-gray-600', bg: '' }
                    const compliance = getComplianceInfo(dim.dim_score)
                    const complianceLabel = t(`compliance.${compliance.status === 'non-compliant' ? 'nonCompliant' : compliance.status}`)
                    return (
                      <tr key={dim.dimension_id} className="border-b border-pastel-slate/50 hover:bg-pastel-blue/10 transition-colors">
                        <td className="py-3 font-medium text-gray-700 text-xs">
                          {dim.dimension_id}: {translateDimensionName(dim.dimension_id, dim.dimension_name)}
                        </td>
                        <td className="text-center py-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-pastel-slate rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full bg-gradient-to-r ${getScoreBarGradient(score)} transition-all duration-500`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <span className="font-semibold text-gray-700 text-xs w-6">{dim.dim_score?.toFixed(1) ?? '\u2013'}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          {matLabel && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ls.text} ${ls.bg}`}>
                              {translateMaturityLabel(matLabel)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${compliance.bgColor} ${compliance.textColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${compliance.dotColor}`} />
                            {complianceLabel}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Card 7: Compliance Heatmap */}
        <Card id="compliance-heatmap">
          <ComplianceHeatmap dimensions={result.dimensions} />
        </Card>

        {/* Card 8: Roadmap Timeline */}
        <Card id="roadmap-timeline">
          <RoadmapTimeline gaps={result.gaps} />
        </Card>

        {/* Card 9: Article Mapping */}
        <Card id="article-mapping">
          <ArticleMappingChart dimensions={result.dimensions} />
        </Card>

        {/* Card 10: Compliance Timeline */}
        <Card id="compliance-timeline">
          <ComplianceTimeline riskCategory={result.scoping.risk_category} />
        </Card>

        {/* Card 11: Glossary */}
        <Card id="glossary">
          <GlossaryPanel />
        </Card>

        {/* Card 12: RACI Matrix */}
        <Card id="raci-matrix">
          <RACIMatrix dimensions={result.dimensions.map(d => ({ dimension_id: d.dimension_id, dimension_name: d.dimension_name }))} />
        </Card>

        {/* Card 13: Maturity Detail */}
        <Card id="maturity-detail">
          <div className="flex flex-col justify-between h-full min-h-[200px]">
            <span className="text-xs font-medium text-gray-500">{t('bento.maturityDetail')}</span>
            <div className="py-4">
              <div className="space-y-2">
                {['Initial', 'Managed', 'Defined', 'Measured', 'Optimizing'].map((level, i) => {
                  const ms = maturityStyles[level]
                  const isActive = level === result.maturity_label
                  return (
                    <div key={level} className={`flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all ${isActive ? ms.bg : ''}`}>
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-accent-blue scale-125' : 'bg-pastel-slate'}`} />
                      <span className={`text-sm ${isActive ? 'font-bold ' + ms.text : 'text-gray-400'}`}>
                        {t('bento.levelLabel').replace('{n}', String(i + 1)).replace('{name}', translateMaturityLabel(level))}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            <span className="text-xs text-gray-400">{t('bento.cmmiNote')}</span>
          </div>
        </Card>

        {/* Card 14: Maturity Distribution */}
        <Card id="maturity-distribution">
          <MaturityDistribution dimensions={result.dimensions} />
        </Card>

        {/* Card 15: Actions */}
        <Card id="actions">
          <div className="flex flex-col justify-between h-full min-h-[200px]">
            <span className="text-xs font-medium text-gray-500">{t('bento.actions')}</span>
            <div className="space-y-2.5 py-4">
              <a
                href="/assessment"
                className="block text-center bg-accent-blue text-white px-6 py-2.5 rounded-xl hover:bg-accent-indigo transition-all duration-300 font-medium shadow-md hover:shadow-lg text-sm"
              >
                {t('bento.newAssessment')}
              </a>
              <PDFExport result={result} />
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `governance-assessment-${result.scoping.system_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="block w-full text-center bg-pastel-indigo/30 text-accent-purple px-6 py-2.5 rounded-xl hover:bg-pastel-indigo/50 transition-all duration-300 font-medium text-sm"
              >
                {t('bento.exportJSON')}
              </button>
              <button
                onClick={handleShareLink}
                className={`block w-full text-center px-6 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm ${
                  linkCopied
                    ? 'bg-pastel-green/40 text-green-600'
                    : 'bg-pastel-blue/20 text-accent-blue hover:bg-pastel-blue/40'
                }`}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {linkCopied ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  )}
                  {linkCopied ? t('bento.linkCopied') : t('bento.shareLink')}
                </span>
              </button>
              <button
                onClick={() => window.print()}
                className="block w-full text-center bg-pastel-slate text-gray-600 px-6 py-2.5 rounded-xl hover:bg-pastel-indigo/40 transition-all duration-300 font-medium text-sm"
              >
                {t('bento.printResults')}
              </button>
            </div>
            <span className="text-xs text-gray-400">{t('bento.dimensionsRated').replace('{n}', String(result.dimensions.length))}</span>
          </div>
        </Card>

      </div>
    </>
  )
}
