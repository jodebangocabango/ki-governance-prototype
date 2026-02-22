'use client'

import React, { useRef, useCallback, useEffect } from 'react'

interface ClickSparkProps {
  children: React.ReactNode
  sparkColor?: string
  sparkCount?: number
  sparkSize?: number
  duration?: number
  extraScale?: number
}

const ClickSpark: React.FC<ClickSparkProps> = ({
  children,
  sparkColor = '#5C6BC0',
  sparkCount = 8,
  sparkSize = 10,
  duration = 400,
  extraScale = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sparksRef = useRef<
    { x: number; y: number; angle: number; startTime: number }[]
  >([])
  const animationRef = useRef<number>(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const now = performance.now()
    const activeSparks = sparksRef.current.filter(
      s => now - s.startTime < duration
    )
    sparksRef.current = activeSparks

    activeSparks.forEach(spark => {
      const elapsed = now - spark.startTime
      const progress = elapsed / duration
      const distance = progress * 30 * extraScale
      const lineLength = sparkSize * (1 - progress) * extraScale
      const opacity = 1 - progress

      const x = spark.x + Math.cos(spark.angle) * distance
      const y = spark.y + Math.sin(spark.angle) * distance
      const endX = x + Math.cos(spark.angle) * lineLength
      const endY = y + Math.sin(spark.angle) * lineLength

      ctx.strokeStyle = sparkColor
      ctx.globalAlpha = opacity
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(endX, endY)
      ctx.stroke()
    })

    ctx.globalAlpha = 1

    if (activeSparks.length > 0) {
      animationRef.current = requestAnimationFrame(draw)
    }
  }, [sparkColor, sparkSize, duration, extraScale])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const now = performance.now()
      const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
        x,
        y,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now,
      }))

      sparksRef.current.push(...newSparks)
      cancelAnimationFrame(animationRef.current)
      animationRef.current = requestAnimationFrame(draw)
    },
    [sparkCount, draw]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.offsetWidth
        canvas.height = parent.offsetHeight
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <div
      className="relative inline-block"
      onClick={handleClick}
    >
      {children}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-50"
      />
    </div>
  )
}

export default ClickSpark
