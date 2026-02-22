'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()

      if (data.ok) {
        router.push('/')
        router.refresh()
      } else {
        setError('Ungültiger Zugangscode')
      }
    } catch {
      setError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'linear-gradient(135deg, #B3D4FC30 0%, #ffffff 40%, #C5CAE920 100%)' }}>
      <div className="w-full max-w-md">
        <div className="rounded-2xl p-8"
             style={{
               background: 'rgba(255, 255, 255, 0.6)',
               backdropFilter: 'blur(20px)',
               WebkitBackdropFilter: 'blur(20px)',
               border: '1px solid rgba(255, 255, 255, 0.4)',
               boxShadow: '0 8px 32px rgba(92, 107, 192, 0.08)',
             }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                 style={{ background: 'linear-gradient(135deg, #5C6BC0, #3F51B5)' }}>
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              KI-Governance Assessment
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Bitte geben Sie den Zugangscode ein
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Zugangscode"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 text-gray-800
                           placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-blue/30
                           focus:border-accent-blue transition-all duration-200"
              />
            </div>

            {error && (
              <p className="text-accent-red text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !code}
              className="w-full bg-accent-blue text-white px-6 py-3 rounded-xl hover:bg-accent-indigo
                         transition-all duration-300 font-medium shadow-md hover:shadow-lg
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Prüfe...' : 'Zugang anfordern'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Forschungsprototyp — Zugang nur mit gültigem Code
          </p>
        </div>
      </div>
    </div>
  )
}
