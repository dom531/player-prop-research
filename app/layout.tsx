import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Baccarat Boyz Terminal | AI-Powered NBA Analysis',
  description: 'Professional-grade NBA player prop betting research with advanced analytics, matchup insights, and AI-powered predictions. Compare players, export analysis, and make data-driven betting decisions.',
  keywords: ['NBA', 'player props', 'betting', 'analytics', 'sports betting', 'basketball', 'AI analysis', 'baccarat boyz'],
  authors: [{ name: 'Baccarat Boyz' }],
  openGraph: {
    title: 'Baccarat Boyz Terminal | AI-Powered NBA Analysis',
    description: 'Professional-grade NBA player prop betting research with advanced analytics',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#00ff41',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
