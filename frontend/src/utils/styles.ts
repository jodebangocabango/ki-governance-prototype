import type { CSSProperties } from 'react'

/** Shared glassmorphism card style — single source of truth */
export const GLASS_CARD_STYLE: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  boxShadow: '0 8px 32px rgba(92, 107, 192, 0.08)',
}

/** Base bento card classes */
export const CARD_BASE = 'bento-card relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5'

/** Primary action button */
export const BTN_PRIMARY = 'bg-accent-blue text-white px-8 py-3 rounded-xl hover:bg-accent-indigo transition-all duration-300 font-medium shadow-md hover:shadow-lg'

/** Back/navigation button with arrow */
export const BTN_BACK = 'text-accent-blue/70 hover:text-accent-blue font-medium transition-colors duration-200 flex items-center gap-1.5'
