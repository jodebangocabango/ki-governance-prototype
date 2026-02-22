'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { de } from './translations/de'
import { en } from './translations/en'
import { fr } from './translations/fr'

export type Locale = 'de' | 'en' | 'fr'

const translations: Record<Locale, Record<string, unknown>> = { de, en, fr }

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

const STORAGE_KEY = 'language'

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return path
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : path
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('de')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
      if (saved && saved in translations) {
        setLocaleState(saved)
        document.documentElement.lang = saved
      }
    } catch {}
    setMounted(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem(STORAGE_KEY, newLocale)
    } catch {}
    document.documentElement.lang = newLocale
  }, [])

  const t = useCallback((key: string): string => {
    return getNestedValue(translations[locale] as unknown as Record<string, unknown>, key)
  }, [locale])

  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ locale: 'de', setLocale, t: (key: string) => getNestedValue(de as unknown as Record<string, unknown>, key) }}>
        {children}
      </LanguageContext.Provider>
    )
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
