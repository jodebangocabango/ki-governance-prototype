'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { LanguageProvider } from '@/i18n/LanguageContext'
import AppDock from '@/components/AppDock'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import BackendWarmup from '@/components/BackendWarmup'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <LanguageProvider>
      <BackendWarmup>
        <LanguageSwitcher />
        <main className="max-w-7xl mx-auto px-4 py-8 pb-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <AppDock />
      </BackendWarmup>
    </LanguageProvider>
  )
}
