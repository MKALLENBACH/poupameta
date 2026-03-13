import './globals.css'
import type { Metadata, Viewport } from 'next'
import { ToastProvider } from '@/components/ui/Toast'
import { PwaProvider } from '@/components/pwa/PwaProvider'

export const metadata: Metadata = {
  title: 'PoupaMeta — Planejador de Economia',
  description:
    'Guarde dinheiro gradualmente e pague suas contas antes do vencimento.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PoupaMeta',
  },
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased min-h-screen bg-[#0d0e17] text-slate-100">
        <PwaProvider>
          <ToastProvider />
          {children}
        </PwaProvider>
      </body>
    </html>
  )
}
