'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { gsap } from 'gsap'

const GLOW_COLOR = '92, 107, 192'

const createParticleElement = (x: number, y: number): HTMLDivElement => {
  const el = document.createElement('div')
  el.style.cssText = `
    position: absolute; width: 4px; height: 4px; border-radius: 50%;
    background: rgba(${GLOW_COLOR}, 1); box-shadow: 0 0 6px rgba(${GLOW_COLOR}, 0.6);
    pointer-events: none; z-index: 100; left: ${x}px; top: ${y}px;
  `
  return el
}

export const ParticleCard: React.FC<{
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}> = ({ children, className = '', style, onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement[]>([])
  const timeoutsRef = useRef<number[]>([])
  const isHoveredRef = useRef(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const clearParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    particlesRef.current.forEach(p => {
      gsap.to(p, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)', onComplete: () => p.remove() })
    })
    particlesRef.current = []
  }, [])

  useEffect(() => {
    if (isMobile || !cardRef.current) return
    const el = cardRef.current

    const onEnter = () => {
      isHoveredRef.current = true
      const { width, height } = el.getBoundingClientRect()
      for (let i = 0; i < 6; i++) {
        const tid = window.setTimeout(() => {
          if (!isHoveredRef.current || !cardRef.current) return
          const p = createParticleElement(Math.random() * width, Math.random() * height)
          el.appendChild(p)
          particlesRef.current.push(p)
          gsap.fromTo(p, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' })
          gsap.to(p, { x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60, duration: 2 + Math.random() * 2, ease: 'none', repeat: -1, yoyo: true })
          gsap.to(p, { opacity: 0.3, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true })
        }, i * 120)
        timeoutsRef.current.push(tid)
      }
    }

    const onLeave = () => {
      isHoveredRef.current = false
      clearParticles()
    }

    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mouseleave', onLeave)
      clearParticles()
    }
  }, [isMobile, clearParticles])

  return (
    <div
      ref={cardRef}
      className={`${className} relative overflow-hidden`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export const GlobalSpotlight: React.FC<{ gridRef: React.RefObject<HTMLDivElement | null> }> = ({ gridRef }) => {
  const spotlightRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!gridRef?.current) return

    const spotlight = document.createElement('div')
    spotlight.style.cssText = `
      position: fixed; width: 800px; height: 800px; border-radius: 50%;
      pointer-events: none; z-index: 200; opacity: 0; transform: translate(-50%, -50%);
      mix-blend-mode: screen;
      background: radial-gradient(circle,
        rgba(${GLOW_COLOR}, 0.1) 0%, rgba(${GLOW_COLOR}, 0.05) 25%,
        rgba(${GLOW_COLOR}, 0.02) 50%, transparent 70%);
    `
    document.body.appendChild(spotlight)
    spotlightRef.current = spotlight

    const onMove = (e: MouseEvent) => {
      if (!spotlightRef.current || !gridRef.current) return
      const rect = gridRef.current.getBoundingClientRect()
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom

      if (!inside) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3 })
        return
      }

      gsap.to(spotlightRef.current, { left: e.clientX, top: e.clientY, duration: 0.1, ease: 'power2.out' })

      gridRef.current.querySelectorAll('.bento-card').forEach(card => {
        const cardEl = card as HTMLElement
        const cardRect = cardEl.getBoundingClientRect()
        const relX = ((e.clientX - cardRect.left) / cardRect.width) * 100
        const relY = ((e.clientY - cardRect.top) / cardRect.height) * 100
        const centerX = cardRect.left + cardRect.width / 2
        const centerY = cardRect.top + cardRect.height / 2
        const dist = Math.max(0, Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2)
        const glow = dist <= 150 ? 1 : dist <= 300 ? (300 - dist) / 150 : 0

        cardEl.style.setProperty('--glow-x', `${relX}%`)
        cardEl.style.setProperty('--glow-y', `${relY}%`)
        cardEl.style.setProperty('--glow-intensity', glow.toString())
      })

      gsap.to(spotlightRef.current, { opacity: 0.6, duration: 0.2 })
    }

    const onLeave = () => {
      if (spotlightRef.current) gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3 })
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      spotlightRef.current?.remove()
    }
  }, [gridRef])

  return null
}
