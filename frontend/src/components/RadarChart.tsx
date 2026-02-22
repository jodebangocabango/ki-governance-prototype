'use client'

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { useLanguage } from '@/i18n/LanguageContext'
import { useTranslatedDimensions } from '@/i18n/useTranslatedDimensions'
import { BENCHMARK_MINIMUM, BENCHMARK_BEST_PRACTICE } from '@/utils/complianceHelpers'

interface RadarChartProps {
  dimensions: {
    dimension_id: string
    dimension_name: string
    dim_score: number | null
  }[]
}

export default function RadarChart({ dimensions }: RadarChartProps) {
  const { t } = useLanguage()
  const { translateDimensionName } = useTranslatedDimensions()
  const data = dimensions.map(d => ({
    dimension: d.dimension_id,
    name: translateDimensionName(d.dimension_id, d.dimension_name),
    score: d.dim_score ?? 0,
    // A5: Target overlay — minimum conformity (Level 3)
    target: BENCHMARK_MINIMUM[d.dimension_id] ?? 3.0,
    // A8: Best Practice reference
    bestPractice: BENCHMARK_BEST_PRACTICE[d.dimension_id] ?? 4.0,
    fullMark: 5,
  }))

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="#C5CAE9" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fontSize: 12, fill: '#5C6BC0' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 5]}
          tickCount={6}
          tick={{ fontSize: 10, fill: '#7E57C2' }}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            value.toFixed(2),
            name,
          ]}
          labelFormatter={(label: string) => {
            const dim = data.find(d => d.dimension === label)
            return dim ? `${dim.dimension}: ${dim.name}` : label
          }}
          contentStyle={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(197, 202, 233, 0.5)',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 16px rgba(92, 107, 192, 0.1)',
          }}
        />
        {/* A8: Best Practice reference line (outermost, lightest) */}
        <Radar
          name={t('radar.bestPractice')}
          dataKey="bestPractice"
          stroke="#86efac"
          fill="#86efac"
          fillOpacity={0.05}
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        {/* A5: Target / Soll line (minimum conformity) */}
        <Radar
          name={t('radar.targetLabel')}
          dataKey="target"
          stroke="#fbbf24"
          fill="#fbbf24"
          fillOpacity={0.05}
          strokeWidth={1.5}
          strokeDasharray="5 5"
        />
        {/* Actual scores (on top) */}
        <Radar
          name={t('radar.radarName')}
          dataKey="score"
          stroke="#5C6BC0"
          fill="#C5CAE9"
          fillOpacity={0.4}
          strokeWidth={2}
        />
        <Legend
          wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
}
