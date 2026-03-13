'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { cn } from '@/lib/utils'

function ToastItem({
  id,
  message,
  type,
}: {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}) {
  const removeToast = useDashboardStore((s) => s.removeToast)

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), 4000)
    return () => clearTimeout(timer)
  }, [id, removeToast])

  const icons = {
    success: <CheckCircle size={18} className="text-emerald-400 shrink-0" />,
    error: <XCircle size={18} className="text-red-400 shrink-0" />,
    info: <Info size={18} className="text-brand-400 shrink-0" />,
  }

  const borders = {
    success: 'border-l-emerald-500',
    error: 'border-l-red-500',
    info: 'border-l-brand-500',
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 w-full max-w-sm',
        'bg-[#1e2030] border border-white/10 border-l-4 rounded-xl',
        'px-4 py-3 shadow-xl animate-slide-up',
        borders[type]
      )}
    >
      {icons[type]}
      <p className="text-sm text-slate-200 flex-1">{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="text-slate-500 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastProvider() {
  const toasts = useDashboardStore((s) => s.toasts)

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 lg:bottom-6 lg:right-6">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  )
}
