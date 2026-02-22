import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'

export const metadata: Metadata = {
  title: 'KI-Governance Assessment Framework',
  description: 'Bewertungsframework für die Umsetzung des EU AI Acts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
