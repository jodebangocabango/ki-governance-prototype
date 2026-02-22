'use client'

import { useMemo } from 'react'
import { useLanguage, type Locale } from './LanguageContext'
import { de } from './translations/de'
import { en } from './translations/en'
import { fr } from './translations/fr'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translations: Record<Locale, Record<string, any>> = { de, en, fr }

/* ---- Types for backend data ---- */

interface BackendCriterion {
  id: string
  name: string
  question: string
  indicators: Record<string, string>
}

interface BackendDimension {
  id: string
  name: string
  article: string
  description: string
  criteria: BackendCriterion[]
}

interface ResultDimension {
  dimension_id: string
  dimension_name: string
  dim_score: number | null
  num_rated: number
  num_na: number
}

interface GapItem {
  dimension_id: string
  dimension_name: string
  dim_score: number
  gap_severity: string
  priority_rank: number
  recommendation: string
}

/* ---- Hook ---- */

export function useTranslatedDimensions() {
  const { locale } = useLanguage()

  const trans = translations[locale]
  const dimTrans = trans.dimensions ?? {}
  const recTrans = trans.recommendations ?? {}

  /** Translate a full dimension from /api/dimensions */
  function translateDimension(dim: BackendDimension): BackendDimension {
    const dt = dimTrans[dim.id]
    if (!dt) return dim

    return {
      ...dim,
      name: dt.name ?? dim.name,
      description: dt.description ?? dim.description,
      criteria: dim.criteria.map((c: BackendCriterion) => {
        const ct = dt.criteria?.[c.id]
        if (!ct) return c
        return {
          ...c,
          name: ct.name ?? c.name,
          question: ct.question ?? c.question,
          indicators: Object.fromEntries(
            Object.entries(c.indicators).map(([level, desc]) => [
              level,
              ct.indicators?.[level] ?? desc,
            ])
          ),
        }
      }),
    }
  }

  /** Translate an array of dimensions */
  function translateDimensions(dims: BackendDimension[]): BackendDimension[] {
    return dims.map(translateDimension)
  }

  /** Translate just a dimension name by ID (for results/gaps) */
  function translateDimensionName(dimId: string, fallback: string): string {
    return dimTrans[dimId]?.name ?? fallback
  }

  /** Translate a gap recommendation by dimension ID */
  function translateRecommendation(dimId: string, fallback: string): string {
    return recTrans[dimId] ?? fallback
  }

  /** Translate a maturity label (English key → localized) */
  function translateMaturityLabel(label: string): string {
    const mapping: Record<string, number> = {
      Initial: 1,
      Managed: 2,
      Defined: 3,
      Measured: 4,
      Optimizing: 5,
    }
    const level = mapping[label]
    if (level && trans.maturityLevels?.[level]) {
      return trans.maturityLevels[level]
    }
    return label
  }

  return useMemo(
    () => ({
      translateDimension,
      translateDimensions,
      translateDimensionName,
      translateRecommendation,
      translateMaturityLabel,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  )
}
