'use client'

import React, { useRef, useState, useCallback } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'

interface ScoreSliderProps {
  value?: number | null
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
}

const ScoreSlider: React.FC<ScoreSliderProps> = ({
  value,
  onChange,
  min = 1,
  max = 5,
  disabled = false,
}) => {
  const { t } = useLanguage()
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min)
  const hasValue = value != null && value !== undefined
  const currentValue = hasValue ? (value as number) : null
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoverStep, setHoverStep] = useState<number | null>(null)

  const getStepFromX = useCallback((clientX: number): number => {
    if (!trackRef.current) return min
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    const raw = min + ratio * (max - min)
    return Math.min(max, Math.max(min, Math.round(raw)))
  }, [min, max])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    const step = getStepFromX(e.clientX)
    onChange(step)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || disabled) return
    const step = getStepFromX(e.clientX)
    onChange(step)
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  const fillPercentage = hasValue
    ? ((currentValue! - min) / (max - min)) * 100
    : 0

  const thumbPosition = hasValue
    ? ((currentValue! - min) / (max - min)) * 100
    : -10 // hidden off-screen

  return (
    <div className={`w-full select-none ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Score step buttons */}
      <div className="flex items-center gap-1 mb-3">
        {steps.map(step => (
          <button
            key={step}
            type="button"
            onClick={() => !disabled && onChange(step)}
            onMouseEnter={() => setHoverStep(step)}
            onMouseLeave={() => setHoverStep(null)}
            className={`flex-1 h-10 rounded-lg text-sm font-semibold transition-all duration-200 ${
              currentValue === step
                ? 'bg-accent-blue text-white shadow-md scale-105'
                : hoverStep === step
                ? 'bg-pastel-blue/60 text-accent-blue'
                : 'bg-pastel-slate/60 text-gray-500 hover:bg-pastel-blue/40'
            }`}
          >
            {step}
          </button>
        ))}
      </div>

      {/* Elastic slider track */}
      <div
        ref={trackRef}
        className="relative h-8 flex items-center cursor-pointer touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Background track */}
        <div className="absolute inset-x-0 h-2 rounded-full bg-pastel-slate/80" />

        {/* Filled track */}
        <div
          className="absolute left-0 h-2 rounded-full transition-all duration-150 ease-out"
          style={{
            width: `${fillPercentage}%`,
            background: hasValue
              ? 'linear-gradient(90deg, #B3D4FC, #5C6BC0)'
              : 'transparent',
          }}
        />

        {/* Step dots */}
        <div className="absolute inset-x-0 flex justify-between pointer-events-none">
          {steps.map(step => (
            <div
              key={step}
              className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                currentValue != null && step <= currentValue
                  ? 'bg-accent-blue border-accent-blue scale-100'
                  : 'bg-white border-pastel-indigo/50 scale-90'
              }`}
            />
          ))}
        </div>

        {/* Thumb */}
        {hasValue && (
          <div
            className="absolute w-5 h-5 rounded-full bg-white border-2 border-accent-blue shadow-lg pointer-events-none transition-all duration-150 ease-out"
            style={{
              left: `calc(${thumbPosition}% - 10px)`,
              transform: isDragging ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        )}
      </div>

      {/* Value label */}
      <div className={`text-center text-xs font-semibold mt-1 transition-all duration-200 ${
        hasValue ? 'text-accent-blue' : 'text-gray-400'
      }`}>
        {hasValue ? t('scoreSlider.level').replace('{n}', String(currentValue)) : t('scoreSlider.notRated')}
      </div>
    </div>
  )
}

export default ScoreSlider
