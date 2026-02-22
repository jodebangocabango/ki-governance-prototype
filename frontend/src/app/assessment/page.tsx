'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import ChatPanel from '@/components/ChatPanel'
import ScoreSlider from '@/components/ScoreSlider'
import SpotlightCard from '@/components/SpotlightCard'
import ClickSpark from '@/components/ClickSpark'
import { useLanguage } from '@/i18n/LanguageContext'
import { useTranslatedDimensions } from '@/i18n/useTranslatedDimensions'
import { DIMENSION_ARTICLE_MAP } from '@/utils/complianceHelpers'
import { PRACTICE_EXAMPLES } from '@/data/practiceExamples'
import { API_BASE } from '@/utils/api'
import { de } from '@/i18n/translations/de'
import { en } from '@/i18n/translations/en'
import { fr } from '@/i18n/translations/fr'
import type { Dimension } from '@/types/assessment'

const translations = { de, en, fr } as const

interface Scores {
  [criterionId: string]: number | null
}

// C4: N/A reasons stored separately
interface NaReasons {
  [criterionId: string]: string
}

interface ScopingData {
  system_name: string
  risk_category: string
  industry: string
  organization_size: string
  deployment_status: string
  // C5: Extended scoping fields
  has_governance_officer: string
  existing_frameworks: string
  num_ai_systems: string
  // A6: Dimension weights
  weights?: Record<string, number>
}

// C3: Mandatory dimensions per risk category
const MANDATORY_DIMENSIONS: Record<string, string[]> = {
  'high-risk': ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'],
  'limited-risk': ['D4'],
  'minimal-risk': [],
}

const RISK_LABELS: Record<string, string> = {
  'high-risk': 'High-Risk',
  'limited-risk': 'Limited Risk',
  'minimal-risk': 'Minimal Risk',
}

const STORAGE_KEY = 'assessmentProgress'
const dimLabels = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6']

export default function AssessmentPage() {
  const { locale, t } = useLanguage()
  const { translateDimension, translateDimensionName } = useTranslatedDimensions()
  const trans = translations[locale]
  const articleDescriptions = trans.modal.articleDescriptions as Record<string, string>
  const router = useRouter()
  const [dimensions, setDimensions] = useState<Dimension[]>([])
  const [currentDimIndex, setCurrentDimIndex] = useState(-1)
  const [scores, setScores] = useState<Scores>({})
  const [naReasons, setNaReasons] = useState<NaReasons>({})
  const [scoping, setScoping] = useState<ScopingData>({
    system_name: '',
    risk_category: 'high-risk',
    industry: '',
    organization_size: 'medium',
    deployment_status: 'production',
    has_governance_officer: 'no',
    existing_frameworks: '',
    num_ai_systems: '1',
  })
  const [submitting, setSubmitting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // C1: CMMI level explanation toggle per criterion
  const [levelExplainOpen, setLevelExplainOpen] = useState<string | null>(null)
  // C2: Article reference toggle per dimension
  const [articleRefOpen, setArticleRefOpen] = useState(false)
  // G1: Practice examples toggle per criterion
  const [exampleOpen, setExampleOpen] = useState<string | null>(null)
  // A6: Dimension weights toggle
  const [weightsOpen, setWeightsOpen] = useState(false)

  // Load dimensions
  useEffect(() => {
    fetch(`${API_BASE}/api/dimensions`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => setDimensions(data))
      .catch(err => console.error('Failed to load dimensions:', err))
  }, [])

  // Restore progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const { scores: s, scoping: sc, currentDimIndex: idx, naReasons: nr } = JSON.parse(saved)
        if (s) setScores(s)
        if (sc) setScoping(sc)
        if (typeof idx === 'number') setCurrentDimIndex(idx)
        if (nr) setNaReasons(nr)
      }
    } catch (err) { console.error('Failed to restore progress:', err) }
  }, [])

  // Persist progress to localStorage
  const saveProgress = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        scores,
        scoping,
        currentDimIndex,
        naReasons,
      }))
    } catch (err) { console.error('Failed to save progress:', err) }
  }, [scores, scoping, currentDimIndex, naReasons])

  useEffect(() => {
    saveProgress()
  }, [saveProgress])

  // Unsaved changes warning — prevent accidental tab close
  useEffect(() => {
    const hasProgress = Object.keys(scores).length > 0
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasProgress) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [scores])

  // Scroll to top on dimension change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentDimIndex])

  // Reset article ref toggle when changing dimensions
  useEffect(() => {
    setArticleRefOpen(false)
    setLevelExplainOpen(null)
    setExampleOpen(null)
  }, [currentDimIndex])

  const currentDim = currentDimIndex >= 0 ? dimensions[currentDimIndex] : null
  const totalDims = dimensions.length

  const isDimComplete = (dimIdx: number) => {
    if (dimIdx < 0 || dimIdx >= dimensions.length) return false
    return dimensions[dimIdx].criteria.every(c => c.id in scores)
  }

  const canNavigateTo = (dimIdx: number) => {
    if (dimIdx < 0) return true
    if (dimIdx === 0) return currentDimIndex >= 0
    for (let i = 0; i < dimIdx; i++) {
      if (!isDimComplete(i)) return false
    }
    return true
  }

  // 5.4: Shared navigation handler for progress bar (bars + labels)
  const navigateToDimension = (dimIdx: number) => {
    if (dimIdx < 0) {
      setShowSummary(false)
      setCurrentDimIndex(-1)
    } else if (canNavigateTo(dimIdx)) {
      setShowSummary(false)
      setCurrentDimIndex(dimIdx)
    }
  }

  const handleScore = (criterionId: string, score: number | null) => {
    setScores(prev => ({ ...prev, [criterionId]: score }))
  }

  // C4: Handle N/A reason
  const handleNaReason = (criterionId: string, reason: string) => {
    setNaReasons(prev => ({ ...prev, [criterionId]: reason }))
  }

  // C3: Check if dimension is mandatory for current risk category
  const isDimMandatory = (dimId: string) => {
    const mandatory = MANDATORY_DIMENSIONS[scoping.risk_category] || []
    return mandatory.includes(dimId)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const dimensionResults = dimensions.map(dim => ({
      dimension_id: dim.id,
      dimension_name: dim.name,
      criteria_scores: dim.criteria.map(c => ({
        criterion_id: c.id,
        score: scores[c.id] ?? null,
        is_na: scores[c.id] === null && c.id in scores,
      })),
    }))

    try {
      const res = await fetch(`${API_BASE}/api/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scoping,
          dimensions: dimensionResults,
          ...(scoping.weights && Object.keys(scoping.weights).length > 0 ? { weights: scoping.weights } : {}),
        }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => null)
        throw new Error(errBody?.detail || `Server error (${res.status})`)
      }
      const result = await res.json()
      localStorage.setItem('assessmentResult', JSON.stringify(result))
      // B1: Preserve criterion scores for heatmap/gap/maturity components on results page
      localStorage.setItem('criterionScores', JSON.stringify(scores))
      localStorage.removeItem(STORAGE_KEY)
      router.push('/results')
    } catch (e) {
      setSubmitError(t('assessment.errorSubmit'))
      setTimeout(() => setSubmitError(null), 5000)
    } finally {
      setSubmitting(false)
    }
  }

  const allCriteriaScored = currentDim
    ? currentDim.criteria.every(c => c.id in scores)
    : false

  const allDimensionsComplete = dimensions.length > 0 && dimensions.every((_, i) => isDimComplete(i))

  const getDimScore = (dimIdx: number) => {
    if (dimIdx < 0 || dimIdx >= dimensions.length) return null
    const dim = dimensions[dimIdx]
    const rated = dim.criteria.filter(c => c.id in scores && scores[c.id] !== null)
    if (rated.length === 0) return null
    const sum = rated.reduce((acc, c) => acc + (scores[c.id] as number), 0)
    return sum / rated.length
  }

  return (
    <div>
      {/* Segmented Progress Bar — clickable */}
      <div className="mb-10">
        <div className="flex justify-between text-sm text-gray-600 mb-3">
          <span className="font-medium">
            {showSummary ? t('assessment.summary') : currentDimIndex < 0 ? t('assessment.scoping') : `${currentDim?.id}: ${currentDim ? translateDimension(currentDim).name : ''}`}
          </span>
          <span className="font-medium text-accent-blue">
            {showSummary ? t('assessment.overview') : currentDimIndex < 0 ? t('assessment.stepOf').replace('{current}', '1').replace('{total}', '7') : t('assessment.stepOf').replace('{current}', String(currentDimIndex + 2)).replace('{total}', '7')}
          </span>
        </div>
        <div className="flex gap-1.5" role="progressbar" aria-label={t('assessment.progressLabel')} aria-valuenow={currentDimIndex + 2} aria-valuemin={1} aria-valuemax={7}>
          <button
            onClick={() => navigateToDimension(-1)}
            className={`h-2 rounded-full flex-1 transition-all duration-500 cursor-pointer hover:opacity-80 ${
              currentDimIndex >= 0 ? 'bg-accent-green' : 'bg-accent-blue'
            }`}
            title={t('assessment.scoping')}
          />
          {dimLabels.map((label, i) => {
            const navigable = canNavigateTo(i)
            return (
              <button
                key={label}
                onClick={() => navigateToDimension(i)}
                className={`h-2 rounded-full flex-1 transition-all duration-500 ${
                  i < currentDimIndex || isDimComplete(i)
                    ? 'bg-accent-green'
                    : i === currentDimIndex
                    ? 'bg-accent-blue'
                    : 'bg-pastel-slate'
                } ${navigable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}`}
                title={label}
                disabled={!navigable}
              />
            )
          })}
        </div>
        <div className="flex gap-1.5 mt-1.5">
          <button
            onClick={() => navigateToDimension(-1)}
            className="flex-1 text-center text-[10px] text-gray-400 hover:text-accent-blue cursor-pointer transition-colors"
          >
            {t('assessment.scoping')}
          </button>
          {dimLabels.map((label, i) => {
            const navigable = canNavigateTo(i)
            return (
              <button
                key={label}
                onClick={() => navigateToDimension(i)}
                className={`flex-1 text-center text-[10px] transition-colors ${
                  i === currentDimIndex && !showSummary ? 'text-accent-blue font-semibold' : 'text-gray-400'
                } ${navigable ? 'hover:text-accent-blue cursor-pointer' : 'cursor-not-allowed'}`}
                disabled={!navigable}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Animated Section Transitions */}
      <AnimatePresence mode="wait">
      {/* Scoping Phase */}
      {currentDimIndex < 0 && !showSummary && (
        <motion.div
          key="scoping"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="glass-strong rounded-2xl p-10"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('assessment.scopingTitle')}</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {t('assessment.scopingDesc')}
          </p>

          <div className="space-y-6">
            <div>
              <label htmlFor="scoping-system-name" className="block text-sm font-medium text-gray-700 mb-2">
                {t('assessment.systemNameLabel')}
              </label>
              <input
                id="scoping-system-name"
                type="text"
                value={scoping.system_name}
                onChange={e => setScoping(s => ({ ...s, system_name: e.target.value }))}
                className="w-full border border-pastel-indigo/50 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all"
                placeholder={t('assessment.systemNamePlaceholder')}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="scoping-risk-category" className="block text-sm font-medium text-gray-700 mb-2">{t('assessment.riskCategoryLabel')}</label>
                <select
                  id="scoping-risk-category"
                  value={scoping.risk_category}
                  onChange={e => setScoping(s => ({ ...s, risk_category: e.target.value }))}
                  className="w-full border border-pastel-indigo/50 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all"
                >
                  <option value="high-risk">{t('assessment.riskCategoryHighRisk')}</option>
                  <option value="limited-risk">{t('assessment.riskCategoryLimited')}</option>
                  <option value="minimal-risk">{t('assessment.riskCategoryMinimal')}</option>
                </select>
                {/* G4: Risk category explanation */}
                <div className="mt-3 p-3 rounded-lg bg-pastel-blue/10 border border-pastel-blue/20">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {t(`assessment.riskExplanation.${scoping.risk_category}`)}
                  </p>
                </div>
              </div>
              <div>
                <label htmlFor="scoping-industry" className="block text-sm font-medium text-gray-700 mb-2">{t('assessment.industryLabel')}</label>
                <input
                  id="scoping-industry"
                  type="text"
                  value={scoping.industry}
                  onChange={e => setScoping(s => ({ ...s, industry: e.target.value }))}
                  className="w-full border border-pastel-indigo/50 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all"
                  placeholder={t('assessment.industryPlaceholder')}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="scoping-org-size" className="block text-sm font-medium text-gray-700 mb-2">{t('assessment.orgSizeLabel')}</label>
                <select
                  id="scoping-org-size"
                  value={scoping.organization_size}
                  onChange={e => setScoping(s => ({ ...s, organization_size: e.target.value }))}
                  className="w-full border border-pastel-indigo/50 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all"
                >
                  <option value="small">{t('assessment.orgSizeSmall')}</option>
                  <option value="medium">{t('assessment.orgSizeMedium')}</option>
                  <option value="large">{t('assessment.orgSizeLarge')}</option>
                </select>
              </div>
              <div>
                <label htmlFor="scoping-deployment" className="block text-sm font-medium text-gray-700 mb-2">{t('assessment.deploymentLabel')}</label>
                <select
                  id="scoping-deployment"
                  value={scoping.deployment_status}
                  onChange={e => setScoping(s => ({ ...s, deployment_status: e.target.value }))}
                  className="w-full border border-pastel-indigo/50 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all"
                >
                  <option value="production">{t('assessment.deploymentProduction')}</option>
                  <option value="pre-deployment">{t('assessment.deploymentPreDeployment')}</option>
                </select>
              </div>
            </div>

            {/* C5: Extended Scoping Fields */}
            <div className="pt-4 mt-2 border-t border-pastel-indigo/20">
              <p className="text-xs text-gray-400 mb-4">{t('assessment.extendedScopingDesc')}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="scoping-governance-officer" className="block text-sm font-medium text-gray-700 mb-2">{t('scoping.governanceOfficerLabel')}</label>
                  <select
                    id="scoping-governance-officer"
                    value={scoping.has_governance_officer}
                    onChange={e => setScoping(s => ({ ...s, has_governance_officer: e.target.value }))}
                    className="w-full border border-pastel-indigo/50 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all"
                  >
                    <option value="yes">{t('scoping.governanceOfficerYes')}</option>
                    <option value="no">{t('scoping.governanceOfficerNo')}</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="scoping-frameworks" className="block text-sm font-medium text-gray-700 mb-2">{t('scoping.existingFrameworksLabel')}</label>
                  <input
                    id="scoping-frameworks"
                    type="text"
                    value={scoping.existing_frameworks}
                    onChange={e => setScoping(s => ({ ...s, existing_frameworks: e.target.value }))}
                    className="w-full border border-pastel-indigo/50 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all"
                    placeholder={t('scoping.existingFrameworksPlaceholder')}
                  />
                </div>
                <div>
                  <label htmlFor="scoping-num-ai-systems" className="block text-sm font-medium text-gray-700 mb-2">{t('scoping.numAiSystemsLabel')}</label>
                  <select
                    id="scoping-num-ai-systems"
                    value={scoping.num_ai_systems}
                    onChange={e => setScoping(s => ({ ...s, num_ai_systems: e.target.value }))}
                    className="w-full border border-pastel-indigo/50 rounded-xl px-4 py-3 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all"
                  >
                    <option value="1">{t('scoping.numAiSystems1')}</option>
                    <option value="2-5">{t('scoping.numAiSystems2_5')}</option>
                    <option value="6-20">{t('scoping.numAiSystems6_20')}</option>
                    <option value="20+">{t('scoping.numAiSystems20plus')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* A6: Dimension Weighting */}
            <div className="pt-4 mt-2 border-t border-pastel-indigo/20">
              <button
                onClick={() => setWeightsOpen(!weightsOpen)}
                className="text-xs text-accent-purple/70 hover:text-accent-purple transition-colors flex items-center gap-1.5"
              >
                <svg className={`w-3 h-3 transition-transform ${weightsOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                {t('assessment.weightingTitle')}
              </button>
              {weightsOpen && (
                <div className="mt-3 space-y-3">
                  <p className="text-[11px] text-gray-400">{t('assessment.weightingDesc')}</p>
                  {['D1', 'D2', 'D3', 'D4', 'D5', 'D6'].map(dimId => {
                    const weight = scoping.weights?.[dimId] ?? 1.0
                    return (
                      <div key={dimId} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-600 w-8">{dimId}</span>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={weight}
                          onChange={e => {
                            const val = parseFloat(e.target.value)
                            setScoping(s => ({
                              ...s,
                              weights: { ...(s.weights || {}), [dimId]: val },
                            }))
                          }}
                          className="flex-1 h-1.5 rounded-full appearance-none bg-pastel-indigo/30 accent-accent-purple"
                        />
                        <span className="text-xs font-mono text-gray-500 w-8 text-right">{weight.toFixed(1)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <ClickSpark sparkColor="#5C6BC0" sparkCount={10} extraScale={1.2}>
            <button
              onClick={() => setCurrentDimIndex(0)}
              disabled={!scoping.system_name}
              className="mt-10 bg-accent-blue text-white px-8 py-3 rounded-xl hover:bg-accent-indigo disabled:opacity-40 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
            >
              {t('assessment.startAssessment')}
            </button>
          </ClickSpark>
        </motion.div>
      )}

      {/* Dimension Assessment */}
      {currentDim && !showSummary && (
        <motion.div
          key={`dim-${currentDimIndex}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="glass-strong rounded-2xl p-10"
        >
          <DimensionContent
            dim={currentDim}
            scores={scores}
            naReasons={naReasons}
            scoping={scoping}
            locale={locale}
            articleRefOpen={articleRefOpen}
            levelExplainOpen={levelExplainOpen}
            exampleOpen={exampleOpen}
            articleDescriptions={articleDescriptions}
            t={t}
            translateDimension={translateDimension}
            isDimMandatory={isDimMandatory}
            setArticleRefOpen={setArticleRefOpen}
            setLevelExplainOpen={setLevelExplainOpen}
            setExampleOpen={setExampleOpen}
            handleScore={handleScore}
            handleNaReason={handleNaReason}
          />
          <div className="flex justify-between mt-10">
            <button
              onClick={() => setCurrentDimIndex(i => i - 1)}
              className="text-accent-blue/70 hover:text-accent-blue font-medium transition-colors duration-200 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              {t('assessment.back')}
            </button>
            {currentDimIndex < totalDims - 1 ? (
              <button
                onClick={() => setCurrentDimIndex(i => i + 1)}
                disabled={!allCriteriaScored}
                className="bg-accent-blue text-white px-8 py-3 rounded-xl hover:bg-accent-indigo disabled:opacity-40 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
              >
                {t('assessment.next').replace('{name}', dimensions[currentDimIndex + 1] ? translateDimensionName(dimensions[currentDimIndex + 1].id, dimensions[currentDimIndex + 1].name) : '')}
              </button>
            ) : (
              <button
                onClick={() => setShowSummary(true)}
                disabled={!allCriteriaScored}
                className="bg-accent-blue text-white px-8 py-3 rounded-xl hover:bg-accent-indigo disabled:opacity-40 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
              >
                {t('assessment.toSummary')}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Summary before submit */}
      {showSummary && (
        <motion.div
          key="summary"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="glass-strong rounded-2xl p-10"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('assessment.summaryTitle')}</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {t('assessment.summaryDesc')}
          </p>

          <div className="mb-8 p-5 rounded-xl bg-pastel-blue/10 border border-pastel-blue/30">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">{t('assessment.scoping')}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">{t('assessment.systemLabel')}</span> <span className="font-medium text-gray-800">{scoping.system_name}</span></div>
              <div><span className="text-gray-500">{t('assessment.industryLabelSummary')}</span> <span className="font-medium text-gray-800">{scoping.industry || '\u2013'}</span></div>
              <div><span className="text-gray-500">{t('assessment.riskCategoryLabelSummary')}</span> <span className="font-medium text-gray-800">{scoping.risk_category}</span></div>
              <div><span className="text-gray-500">{t('assessment.sizeLabel')}</span> <span className="font-medium text-gray-800">{scoping.organization_size}</span></div>
            </div>
          </div>

          <div className="space-y-4 mb-10">
            {dimensions.map((dim, i) => {
              const dimScore = getDimScore(i)
              const naCount = dim.criteria.filter(c => c.id in scores && scores[c.id] === null).length

              // I1: Consistency check — detect large score variance within dimension
              const ratedScores = dim.criteria
                .map(c => scores[c.id])
                .filter((s): s is number => s !== null && s !== undefined)
              const minScore = ratedScores.length > 0 ? Math.min(...ratedScores) : 0
              const maxScore = ratedScores.length > 0 ? Math.max(...ratedScores) : 0
              const hasConsistencyWarning = ratedScores.length >= 2 && (maxScore - minScore) >= 3

              return (
                <div key={dim.id} className="p-5 rounded-xl bg-white/50 border border-white/60">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-800">{dim.id}: {translateDimensionName(dim.id, dim.name)}</h3>
                      <span className="text-xs bg-pastel-blue/30 text-accent-blue font-medium px-2.5 py-0.5 rounded-full">
                        {dim.article}
                      </span>
                      {/* C3: Mandatory badge in summary */}
                      {isDimMandatory(dim.id) && (
                        <span className="text-[10px] bg-red-50 text-red-600 font-medium px-2 py-0.5 rounded-full border border-red-100">
                          {t('assessment.mandatoryBadge').replace('{risk}', RISK_LABELS[scoping.risk_category] || scoping.risk_category)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {naCount > 0 && (
                        <span className="text-xs text-gray-400">{naCount}\u00d7 N/A</span>
                      )}
                      <span className={`text-lg font-bold ${
                        dimScore && dimScore >= 3.5 ? 'text-accent-green'
                        : dimScore && dimScore >= 2.5 ? 'text-accent-yellow'
                        : 'text-accent-red'
                      }`}>
                        {dimScore?.toFixed(1) ?? '\u2013'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {dim.criteria.map(c => {
                      const s = scores[c.id]
                      const isNA = s === null && c.id in scores
                      const naR = naReasons[c.id]
                      return (
                        <button
                          key={c.id}
                          onClick={() => { setShowSummary(false); setCurrentDimIndex(i) }}
                          className={`text-xs px-2.5 py-1 rounded-lg transition-all hover:shadow-sm cursor-pointer ${
                            isNA
                              ? 'bg-pastel-orange/40 text-accent-orange'
                              : s != null && s >= 4
                              ? 'bg-pastel-green/40 text-accent-green'
                              : s != null && s >= 3
                              ? 'bg-pastel-blue/40 text-accent-blue'
                              : s != null
                              ? 'bg-pastel-pink/40 text-accent-red'
                              : 'bg-pastel-slate text-gray-400'
                          }`}
                          title={`${c.name}${isNA && naR ? ` \u2014 N/A: ${naR}` : ''} \u2014 ${t('assessment.clickToEdit')}`}
                        >
                          {c.id}: {isNA ? 'N/A' : s ?? '?'}
                        </button>
                      )
                    })}
                  </div>

                  {/* I1: Consistency warning */}
                  {hasConsistencyWarning && (
                    <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                      <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        {t('consistency.warning')
                          .replace('{dim}', translateDimensionName(dim.id, dim.name))
                          .replace('{min}', String(minScore))
                          .replace('{max}', String(maxScore))}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Inline error banner */}
          {submitError && (
            <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => { setShowSummary(false); setCurrentDimIndex(totalDims - 1) }}
              className="text-accent-blue/70 hover:text-accent-blue font-medium transition-colors duration-200 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              {t('assessment.backToD6')}
            </button>
            <ClickSpark sparkColor="#66BB6A" sparkCount={12} extraScale={1.3}>
              <button
                onClick={handleSubmit}
                disabled={!allDimensionsComplete || submitting}
                className="bg-accent-green text-white px-8 py-3 rounded-xl hover:brightness-110 disabled:opacity-40 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
              >
                {submitting ? t('assessment.submitting') : t('assessment.submitAssessment')}
              </button>
            </ClickSpark>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <ChatPanel
        page="assessment"
        dimensionId={currentDim?.id}
        assessmentContext={{
          scoping,
          current_dimension: currentDim?.id || 'scoping',
          scores,
        }}
      />
    </div>
  )
}

/* ---- Extracted DimensionContent (was IIFE, 5.1) ---- */

interface DimensionContentProps {
  dim: Dimension
  scores: Scores
  naReasons: NaReasons
  scoping: ScopingData
  locale: string
  articleRefOpen: boolean
  levelExplainOpen: string | null
  exampleOpen: string | null
  articleDescriptions: Record<string, string>
  t: (key: string) => string
  translateDimension: (dim: Dimension) => { name: string; description: string; criteria: { id: string; name: string; question: string; indicators: Record<string, string> }[] }
  isDimMandatory: (dimId: string) => boolean
  setArticleRefOpen: (open: boolean) => void
  setLevelExplainOpen: (id: string | null) => void
  setExampleOpen: (id: string | null) => void
  handleScore: (criterionId: string, score: number | null) => void
  handleNaReason: (criterionId: string, reason: string) => void
}

function DimensionContent({
  dim, scores, naReasons, scoping, locale,
  articleRefOpen, levelExplainOpen, exampleOpen, articleDescriptions,
  t, translateDimension, isDimMandatory,
  setArticleRefOpen, setLevelExplainOpen, setExampleOpen,
  handleScore, handleNaReason,
}: DimensionContentProps) {
  const tDim = translateDimension(dim)
  const artInfo = DIMENSION_ARTICLE_MAP[dim.id]

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{dim.id}: {tDim.name}</h2>
        <span className="text-xs bg-pastel-blue/50 text-accent-blue font-medium px-3 py-1 rounded-full">
          {dim.article}
        </span>
        {isDimMandatory(dim.id) && (
          <span className="text-[10px] bg-red-50 text-red-600 font-medium px-2 py-0.5 rounded-full border border-red-100">
            {t('assessment.mandatoryBadge').replace('{risk}', RISK_LABELS[scoping.risk_category] || scoping.risk_category)}
          </span>
        )}
      </div>
      <p className="text-gray-600 mb-4 leading-relaxed">{tDim.description}</p>

      {/* C2: EU AI Act Article Reference — collapsible */}
      {artInfo && (
        <div className="mb-6">
          <button
            onClick={() => setArticleRefOpen(!articleRefOpen)}
            className="text-xs text-accent-blue/70 hover:text-accent-blue transition-colors flex items-center gap-1.5"
          >
            <svg className={`w-3 h-3 transition-transform ${articleRefOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {t('assessment.regulatoryContext')}: {dim.article}
          </button>
          {articleRefOpen && (
            <div className="mt-2 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs text-gray-600 leading-relaxed">
              {articleDescriptions[dim.article] || dim.article}
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        {tDim.criteria.map(criterion => {
          const isNA = scores[criterion.id] === null && criterion.id in scores
          return (
            <SpotlightCard key={criterion.id} className="!rounded-xl">
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-800">
                    {criterion.id}: {criterion.name}
                  </h4>
                  <button
                    onClick={() => setLevelExplainOpen(levelExplainOpen === criterion.id ? null : criterion.id)}
                    className="w-5 h-5 rounded-full bg-pastel-blue/30 text-accent-blue text-[10px] font-bold flex items-center justify-center hover:bg-pastel-blue/50 transition-colors"
                    title={t('assessment.levelExplanationTitle')}
                  >
                    ?
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{criterion.question}</p>
              </div>

              {levelExplainOpen === criterion.id && (
                <div className="mb-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100 text-xs space-y-1.5">
                  <p className="font-semibold text-accent-purple mb-2">{t('assessment.levelExplanationTitle')}</p>
                  {[1, 2, 3, 4, 5].map(lvl => (
                    <p key={lvl} className={`leading-relaxed ${lvl === 3 ? 'font-medium text-accent-blue' : 'text-gray-600'}`}>
                      {t(`cmmiLevels.${lvl}`)}
                    </p>
                  ))}
                </div>
              )}

              <div className="bg-pastel-indigo/20 rounded-xl p-5 mb-4 text-sm space-y-2">
                {Object.entries(criterion.indicators).map(([level, desc]) => (
                  <div key={level} className="flex gap-2">
                    <span className="font-semibold text-accent-purple w-6 shrink-0">{level}:</span>
                    <span className="text-gray-700 leading-relaxed">{desc}</span>
                  </div>
                ))}
              </div>

              {PRACTICE_EXAMPLES[criterion.id] && (
                <div className="mb-4">
                  <button
                    onClick={() => setExampleOpen(exampleOpen === criterion.id ? null : criterion.id)}
                    className="text-xs text-emerald-600/70 hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                  >
                    <svg className={`w-3 h-3 transition-transform ${exampleOpen === criterion.id ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    {t('practiceExamples.title')}
                  </button>
                  {exampleOpen === criterion.id && (
                    <div className="mt-2 space-y-2">
                      <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">{t('practiceExamples.level2')}</span>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {PRACTICE_EXAMPLES[criterion.id].level2[locale as 'de' | 'en' | 'fr']}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">{t('practiceExamples.level3')}</span>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {PRACTICE_EXAMPLES[criterion.id].level3[locale as 'de' | 'en' | 'fr']}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1 max-w-sm">
                  <ScoreSlider
                    value={criterion.id in scores ? scores[criterion.id] : undefined}
                    onChange={(val) => handleScore(criterion.id, val)}
                  />
                </div>
                <button
                  onClick={() => handleScore(criterion.id, null)}
                  className={`min-w-[44px] min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isNA
                      ? 'bg-pastel-orange text-accent-orange shadow-md'
                      : 'bg-pastel-slate/80 text-gray-500 hover:bg-pastel-orange/30'
                  }`}
                >
                  N/A
                </button>
              </div>

              {isNA && (
                <div className="mt-3">
                  <p className="text-[10px] text-gray-400 mb-1">{t('assessment.naReasonHint')}</p>
                  <textarea
                    value={naReasons[criterion.id] || ''}
                    onChange={e => handleNaReason(criterion.id, e.target.value)}
                    placeholder={t('assessment.naReasonPlaceholder')}
                    rows={2}
                    className="w-full text-xs border border-pastel-orange/30 rounded-lg px-3 py-2 bg-pastel-orange/5 focus:outline-none focus:ring-1 focus:ring-accent-orange/30 transition-all resize-none"
                  />
                </div>
              )}
            </SpotlightCard>
          )
        })}
      </div>
    </>
  )
}
