'use client'

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence
} from 'motion/react'
import React, { Children, cloneElement, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLanguage } from '@/i18n/LanguageContext'

/* ---- Dock Item ---- */

function DockItem({
  children,
  className = '',
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  isActive = false,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  mouseX: MotionValue<number>
  spring: SpringOptions
  distance: number
  baseItemSize: number
  magnification: number
  isActive?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isHovered = useMotionValue(0)

  const mouseDistance = useTransform(mouseX, val => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize }
    return val - rect.x - baseItemSize / 2
  })

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize])
  const size = useSpring(targetSize, spring)

  return (
    <motion.div
      ref={ref}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full shadow-md cursor-pointer ${className}`}
      style={{
        width: size,
        height: size,
        background: isActive ? 'rgba(92, 107, 192, 0.25)' : 'rgba(255, 255, 255, 0.7)',
        border: isActive ? '2px solid rgba(92, 107, 192, 0.6)' : '2px solid rgba(197, 202, 233, 0.4)',
      }}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
    >
      {Children.map(children, child =>
        React.isValidElement(child)
          ? cloneElement(child as React.ReactElement<{ isHovered?: MotionValue<number> }>, { isHovered })
          : child
      )}
    </motion.div>
  )
}

/* ---- Dock Label ---- */

function DockLabel({ children, className = '', isHovered }: {
  children: React.ReactNode
  className?: string
  isHovered?: MotionValue<number>
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isHovered) return
    const unsubscribe = isHovered.on('change', latest => setIsVisible(latest === 1))
    return () => unsubscribe()
  }, [isHovered])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`${className} absolute -top-8 left-1/2 w-fit whitespace-pre rounded-lg px-3 py-1.5 text-xs font-medium`}
          role="tooltip"
          style={{
            x: '-50%',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(197, 202, 233, 0.5)',
            color: '#3F51B5',
            boxShadow: '0 4px 16px rgba(92, 107, 192, 0.15)',
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ---- Dock Icon ---- */

function DockIcon({ children, className = '' }: {
  children: React.ReactNode
  className?: string
  isHovered?: MotionValue<number>
}) {
  return <div className={`flex items-center justify-center ${className}`}>{children}</div>
}

/* ---- SVG Icons ---- */

const DashboardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5C6BC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="8" height="8" rx="2" />
    <rect x="13" y="3" width="8" height="4" rx="1.5" />
    <rect x="13" y="9" width="8" height="12" rx="2" />
    <rect x="3" y="13" width="8" height="8" rx="2" />
  </svg>
)

const SlidersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5C6BC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
    <circle cx="15" cy="7" r="2" fill="#5C6BC0" stroke="none" />
    <circle cx="10" cy="12" r="2" fill="#5C6BC0" stroke="none" />
    <circle cx="17" cy="17" r="2" fill="#5C6BC0" stroke="none" />
  </svg>
)

const RadarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5C6BC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" />
    <polygon points="12,6 17,9 16,15 12,17 7,14 6,9" fill="rgba(92,107,192,0.15)" stroke="#5C6BC0" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1" fill="#5C6BC0" stroke="none" />
  </svg>
)

/* ---- Main Dock ---- */

export default function AppDock() {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLanguage()
  const mouseX = useMotionValue(Infinity)

  const spring: SpringOptions = { mass: 0.1, stiffness: 150, damping: 12 }
  const magnification = 80
  const distance = 200
  const panelHeight = 68
  const baseItemSize = 56

  const navItems = [
    { icon: <DashboardIcon />, label: t('nav.dashboard'), href: '/' },
    { icon: <SlidersIcon />, label: t('nav.assessment'), href: '/assessment' },
    { icon: <RadarIcon />, label: t('nav.results'), href: '/results' },
  ]

  return (
    <div className="fixed bottom-3 left-0 right-0 flex justify-center z-40 pointer-events-none" data-dock="true">
      <motion.div
        onMouseMove={({ pageX }) => mouseX.set(pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="flex items-end gap-5 rounded-2xl pb-2.5 px-6 pointer-events-auto"
        style={{
          height: panelHeight,
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 4px 30px rgba(92, 107, 192, 0.12), 0 1px 4px rgba(0,0,0,0.04)',
        }}
        role="toolbar"
        aria-label="Navigation"
      >
        {navItems.map((item, index) => (
          <DockItem
            key={index}
            onClick={() => router.push(item.href)}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
            isActive={pathname === item.href}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </div>
  )
}
