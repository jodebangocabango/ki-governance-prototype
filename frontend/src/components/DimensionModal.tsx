'use client'

import React, { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useLanguage } from '@/i18n/LanguageContext'
import { useTranslatedDimensions } from '@/i18n/useTranslatedDimensions'
import { de } from '@/i18n/translations/de'
import { en } from '@/i18n/translations/en'
import { fr } from '@/i18n/translations/fr'

const translations = { de, en, fr } as const

interface Indicator {
  [key: string]: string
}

interface Criterion {
  id: string
  name: string
  question: string
  indicators: Indicator
}

interface Dimension {
  id: string
  name: string
  article: string
  description: string
  criteria: Criterion[]
}

interface DimensionModalProps {
  dimension: Dimension | null
  onClose: () => void
}

const dimensionStyle = {
  border: 'border-pastel-blue',
  bg: 'bg-pastel-blue/20',
  text: 'text-accent-blue',
}

const DimensionModal: React.FC<DimensionModalProps> = ({ dimension, onClose }) => {
  const { locale, t } = useLanguage()
  const { translateDimension } = useTranslatedDimensions()
  const trans = translations[locale]
  const articleDescriptions = trans.modal.articleDescriptions as Record<string, string>
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!dimension) return null

  const tDim = translateDimension(dimension)
  const colors = dimensionStyle
  const articleDesc = articleDescriptions[dimension.article] || dimension.article

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Modal */}
      <motion.div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl"
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
                  {dimension.id}: {tDim.name}
                </h2>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                  {dimension.article}
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm">{tDim.description}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-pastel-slate/60 hover:bg-pastel-slate text-gray-500 hover:text-gray-700 transition-all"
              aria-label={t('modal.close')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="1" y1="1" x2="13" y2="13" />
                <line x1="13" y1="1" x2="1" y2="13" />
              </svg>
            </button>
          </div>

          {/* EU AI Act Article Info */}
          <div className={`mt-4 px-4 py-3 rounded-xl border ${colors.border} ${colors.bg}`}>
            <p className="text-xs text-gray-700 leading-relaxed">
              <span className="font-semibold">{articleDesc.split(':')[0]}:</span>
              {articleDesc.includes(':') ? articleDesc.substring(articleDesc.indexOf(':') + 1) : ''}
            </p>
          </div>
        </div>

        {/* Criteria List */}
        <div className="px-8 pb-8 pt-2 space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            {tDim.criteria.length} {t('modal.assessmentCriteria')}
          </h3>

          {tDim.criteria.map((criterion, idx) => (
            <div
              key={criterion.id}
              className={`rounded-xl border border-white/60 p-5 transition-all hover:shadow-md`}
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full ${colors.bg} ${colors.text} font-bold text-xs flex items-center justify-center`}>
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-sm">{criterion.id}: {criterion.name}</h4>
                </div>
              </div>

              {/* Indicators */}
              <div className="ml-10 mt-3 space-y-1.5">
                {Object.entries(criterion.indicators).map(([level, desc]) => (
                  <div key={level} className="flex gap-2 text-xs">
                    <span className={`font-bold ${colors.text} w-5 shrink-0`}>{level}</span>
                    <span className="text-gray-600 leading-relaxed">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Footer Action */}
          <div className="pt-4">
            <a
              href="/assessment"
              className="inline-block bg-accent-blue text-white px-8 py-3 rounded-xl hover:bg-accent-indigo transition-all duration-300 font-medium shadow-md hover:shadow-lg text-sm"
            >
              {t('modal.assessThisDimension')}
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DimensionModal
