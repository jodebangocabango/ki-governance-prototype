'use client'

import { useLanguage } from '@/i18n/LanguageContext'
import { useTranslatedDimensions } from '@/i18n/useTranslatedDimensions'

/**
 * G3: RACI Matrix showing responsibilities per dimension.
 * R=Responsible, A=Accountable, C=Consulted, I=Informed
 */

const ROLES = ['CISO', 'DPO', 'Risk Mgr', 'Dev Lead', 'Compliance'] as const

const RACI_DATA: Record<string, Record<string, 'R' | 'A' | 'C' | 'I'>> = {
  D1: { CISO: 'A', DPO: 'C', 'Risk Mgr': 'R', 'Dev Lead': 'C', Compliance: 'I' },
  D2: { CISO: 'I', DPO: 'A', 'Risk Mgr': 'C', 'Dev Lead': 'R', Compliance: 'C' },
  D3: { CISO: 'I', DPO: 'C', 'Risk Mgr': 'I', 'Dev Lead': 'R', Compliance: 'A' },
  D4: { CISO: 'C', DPO: 'A', 'Risk Mgr': 'I', 'Dev Lead': 'R', Compliance: 'C' },
  D5: { CISO: 'A', DPO: 'I', 'Risk Mgr': 'R', 'Dev Lead': 'C', Compliance: 'C' },
  D6: { CISO: 'A', DPO: 'I', 'Risk Mgr': 'C', 'Dev Lead': 'R', Compliance: 'I' },
}

const RACI_COLORS: Record<string, { bg: string; text: string }> = {
  R: { bg: 'bg-accent-blue/20', text: 'text-accent-blue' },
  A: { bg: 'bg-accent-purple/20', text: 'text-accent-purple' },
  C: { bg: 'bg-pastel-yellow/60', text: 'text-yellow-700' },
  I: { bg: 'bg-pastel-slate/60', text: 'text-gray-500' },
}

interface RACIMatrixProps {
  dimensions: { dimension_id: string; dimension_name: string }[]
}

export default function RACIMatrix({ dimensions }: RACIMatrixProps) {
  const { t } = useLanguage()
  const { translateDimensionName } = useTranslatedDimensions()

  return (
    <div className="flex flex-col h-full">
      <span className="text-xs font-medium text-gray-500 mb-1">{t('raci.title')}</span>
      <p className="text-[10px] text-gray-400 mb-3">{t('raci.subtitle')}</p>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr>
              <th className="text-left py-1.5 px-1 font-semibold text-gray-500 min-w-[80px]">
                {t('raci.dimension')}
              </th>
              {ROLES.map(role => (
                <th key={role} className="text-center py-1.5 px-1 font-semibold text-gray-500 min-w-[55px]">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dimensions.map(dim => {
              const raci = RACI_DATA[dim.dimension_id]
              if (!raci) return null
              return (
                <tr key={dim.dimension_id} className="border-t border-gray-100">
                  <td className="py-2 px-1 font-medium text-gray-700">
                    <span className="font-bold text-accent-blue">{dim.dimension_id}</span>{' '}
                    <span className="text-gray-500">{translateDimensionName(dim.dimension_id, dim.dimension_name)}</span>
                  </td>
                  {ROLES.map(role => {
                    const val = raci[role]
                    const colors = RACI_COLORS[val] || RACI_COLORS.I
                    return (
                      <td key={role} className="py-2 px-1 text-center">
                        <span className={`inline-block w-6 h-6 leading-6 rounded-md font-bold ${colors.bg} ${colors.text}`}>
                          {val}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-3 text-[10px] text-gray-400 flex-wrap">
        <div className="flex items-center gap-1">
          <span className={`inline-block w-4 h-4 leading-4 text-center rounded ${RACI_COLORS.R.bg} ${RACI_COLORS.R.text} font-bold`}>R</span>
          {t('raci.responsible')}
        </div>
        <div className="flex items-center gap-1">
          <span className={`inline-block w-4 h-4 leading-4 text-center rounded ${RACI_COLORS.A.bg} ${RACI_COLORS.A.text} font-bold`}>A</span>
          {t('raci.accountable')}
        </div>
        <div className="flex items-center gap-1">
          <span className={`inline-block w-4 h-4 leading-4 text-center rounded ${RACI_COLORS.C.bg} ${RACI_COLORS.C.text} font-bold`}>C</span>
          {t('raci.consulted')}
        </div>
        <div className="flex items-center gap-1">
          <span className={`inline-block w-4 h-4 leading-4 text-center rounded ${RACI_COLORS.I.bg} ${RACI_COLORS.I.text} font-bold`}>I</span>
          {t('raci.informed')}
        </div>
      </div>
    </div>
  )
}
