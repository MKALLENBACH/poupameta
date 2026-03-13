import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'PoupaMeta — Planejador de Economia',
  description:
    'Guarde dinheiro gradualmente e pague suas contas antes do vencimento.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased min-h-screen bg-[#0d0e17] text-slate-100">
        <ToastProvider />
        {children}
      </body>
    </html>
  )
}
