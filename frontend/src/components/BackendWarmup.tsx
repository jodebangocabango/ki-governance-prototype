'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { API_BASE } from '@/utils/api'

export default function BackendWarmup({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [attempt, setAttempt] = useState(0)

  // Skip warmup on login page
  const isLoginPage = pathname === '/login'

  useEffect(() => {
    if (isLoginPage) {
      setReady(true)
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/`, { signal: AbortSignal.timeout(8000) })
        if (res.ok && !cancelled) {
          setReady(true)
          return
        }
      } catch {
        // Backend not ready yet
      }
      if (!cancelled) {
        setAttempt(a => a + 1)
        timer = setTimeout(check, 3000)
      }
    }

    check()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [isLoginPage])

  if (isLoginPage || ready) return <>{children}</>

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ background: 'linear-gradient(135deg, #B3D4FC30 0%, #ffffff 40%, #C5CAE920 100%)' }}>
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
             style={{ background: 'linear-gradient(135deg, #5C6BC0, #3F51B5)' }}>
          <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Server wird gestartet...</h2>
        <p className="text-gray-400 text-sm">
          {attempt < 3
            ? 'Das kann beim ersten Aufruf bis zu 60 Sekunden dauern.'
            : 'Der Server wird vorbereitet. Bitte haben Sie einen Moment Geduld.'}
        </p>
        <div className="mt-4 flex justify-center gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-accent-blue/40 animate-bounce"
                 style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
