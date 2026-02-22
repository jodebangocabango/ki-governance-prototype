'use client'

import { useState } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'

/**
 * E4: Glossary panel with searchable EU AI Act and framework terms.
 */

interface GlossaryEntry {
  key: string
  term: string
  definition: string
}

export default function GlossaryPanel() {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)

  // Build glossary entries from translation keys
  const glossaryKeys = [
    'cmmi', 'highRisk', 'limitedRisk', 'minimalRisk', 'conformityAssessment',
    'notifiedBody', 'postMarket', 'hitl', 'hotl', 'automationBias',
    'dataGovernance', 'biasDetection', 'dataLineage', 'explainability',
    'gracefulDegradation', 'driftDetection', 'adversarial', 'riskAppetite',
    'maturityModel', 'dimScore',
  ]

  const entries: GlossaryEntry[] = glossaryKeys.map(key => ({
    key,
    term: t(`glossary.${key}.term`),
    definition: t(`glossary.${key}.def`),
  }))

  const filtered = search.trim()
    ? entries.filter(e =>
        e.term.toLowerCase().includes(search.toLowerCase()) ||
        e.definition.toLowerCase().includes(search.toLowerCase())
      )
    : entries

  return (
    <div className="flex flex-col h-full">
      <span className="text-xs font-medium text-gray-500 mb-1">{t('glossary.title')}</span>
      <p className="text-[10px] text-gray-400 mb-3">{t('glossary.subtitle')}</p>

      {/* Search */}
      <div className="relative mb-3">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('glossary.searchPlaceholder')}
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white/60 focus:outline-none focus:ring-1 focus:ring-accent-blue/40 focus:border-accent-blue/40"
        />
      </div>

      {/* Terms list */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-gray-400 text-center py-4">{t('glossary.noResults')}</p>
        ) : (
          filtered.map(entry => (
            <div key={entry.key} className="rounded-lg border border-gray-100 bg-white/40 overflow-hidden">
              <button
                onClick={() => setExpandedTerm(expandedTerm === entry.key ? null : entry.key)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-pastel-blue/10 transition-colors"
              >
                <span className="text-xs font-medium text-gray-700">{entry.term}</span>
                <svg
                  className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${expandedTerm === entry.key ? 'rotate-180' : ''}`}
                  viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
              {expandedTerm === entry.key && (
                <div className="px-3 pb-2">
                  <p className="text-[11px] text-gray-600 leading-relaxed">{entry.definition}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-2 text-[10px] text-gray-400 text-right">
        {filtered.length} / {entries.length} {t('glossary.terms')}
      </div>
    </div>
  )
}
