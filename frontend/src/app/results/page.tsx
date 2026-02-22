'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { decompressFromEncodedURIComponent } from 'lz-string'
import ChatPanel from '@/components/ChatPanel'
import BentoResults from '@/components/BentoResults'
import { useLanguage } from '@/i18n/LanguageContext'
import type { AssessmentResult } from '@/types/assessment'

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20"><div className="glass-strong rounded-2xl p-12 max-w-md mx-auto"><div className="w-8 h-8 border-3 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin mx-auto mb-4" /><p className="text-gray-500 text-sm">Loading...</p></div></div>}>
      <ResultsContent />
    </Suspense>
  )
}

function ResultsContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const [result, setResult] = useState<AssessmentResult | null>(null)

  // 5.3a: Load result from URL param or localStorage (A6: static import for speed)
  useEffect(() => {
    const urlData = searchParams.get('data')
    if (urlData) {
      try {
        const decompressed = decompressFromEncodedURIComponent(urlData)
        if (decompressed) {
          setResult(JSON.parse(decompressed))
          return
        }
      } catch { /* lz-string failed, try base64 fallback */ }
      try {
        setResult(JSON.parse(decodeURIComponent(atob(urlData))))
      } catch { /* Invalid data */ }
      return
    }

    const stored = localStorage.getItem('assessmentResult')
    if (stored) {
      setResult(JSON.parse(stored))
    }
  }, [searchParams])

  // 5.3b: Save to assessment history when result is loaded from localStorage
  useEffect(() => {
    if (!result) return
    // Only save history for localStorage results (not shared links)
    if (searchParams.get('data')) return

    try {
      const history = JSON.parse(localStorage.getItem('assessmentHistory') || '[]')
      const alreadySaved = history.some((h: { timestamp: string }) =>
        h.timestamp === (result as AssessmentResult & { _savedAt?: string })._savedAt
      )
      if (!alreadySaved) {
        const timestamped = { ...result, _savedAt: new Date().toISOString() }
        history.push({ ...timestamped, timestamp: timestamped._savedAt })
        if (history.length > 10) history.shift()
        localStorage.setItem('assessmentHistory', JSON.stringify(history))
        localStorage.setItem('assessmentResult', JSON.stringify(timestamped))
      }
    } catch { /* Ignore history errors */ }
  }, [result, searchParams])

  if (!result) {
    return (
      <div className="text-center py-20">
        <div className="glass-strong rounded-2xl p-12 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-pastel-blue/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('results.noResultsTitle')}</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {t('results.noResultsDesc')}
          </p>
          <a href="/assessment" className="inline-block bg-accent-blue text-white px-8 py-3 rounded-xl hover:bg-accent-indigo transition-all duration-300 font-medium shadow-md hover:shadow-lg">
            {t('results.startAssessment')}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <BentoResults result={result} />

      <ChatPanel
        page="results"
        assessmentContext={{
          results: {
            overall_score: result.overall_score,
            maturity_label: result.maturity_label,
            dimensions: result.dimensions.map(d => ({
              dimension_id: d.dimension_id,
              dimension_name: d.dimension_name,
              dim_score: d.dim_score,
            })),
            gaps: result.gaps.map(g => ({
              dimension_id: g.dimension_id,
              gap_severity: g.gap_severity,
              dim_score: g.dim_score,
            })),
          },
          scoping: result.scoping,
        }}
      />
    </div>
  )
}
