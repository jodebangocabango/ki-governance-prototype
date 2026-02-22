'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useLanguage, type Locale } from '@/i18n/LanguageContext'

const languages: { locale: Locale; flag: string; label: string }[] = [
  { locale: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { locale: 'en', flag: '🇬🇧', label: 'English' },
  { locale: 'fr', flag: '🇫🇷', label: 'Français' },
]

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = languages.find(l => l.locale === locale) || languages[0]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 hover:shadow-md"
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 4px 16px rgba(92, 107, 192, 0.08)',
        }}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <svg
          className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M3 4.5l3 3 3-3" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 rounded-xl overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              boxShadow: '0 12px 40px rgba(92, 107, 192, 0.15), 0 4px 12px rgba(0,0,0,0.06)',
            }}
          >
            {languages.map(lang => (
              <button
                key={lang.locale}
                onClick={() => { setLocale(lang.locale); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  lang.locale === locale
                    ? 'bg-pastel-blue/20 text-accent-blue font-medium'
                    : 'text-gray-700 hover:bg-pastel-blue/10'
                }`}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span>{lang.label}</span>
                {lang.locale === locale && (
                  <svg className="w-3.5 h-3.5 ml-auto text-accent-blue" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 7l3.5 3.5L12 4" />
                  </svg>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
