'use client'

import { cn } from '@/lib/utils'

interface BadgeProps {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'muted'
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

export function Badge({
  variant = 'brand',
  size = 'sm',
  children,
  className,
}: BadgeProps) {
  const variants = {
    brand: 'bg-brand-600/20 text-brand-400 border border-brand-500/30',
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    muted: 'bg-white/5 text-slate-400 border border-white/10',
  }
  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-lg font-semibold tracking-wide uppercase',
    md: 'text-xs px-2.5 py-1 rounded-xl font-semibold tracking-wide uppercase',
  }

  return (
    <span className={cn(variants[variant], sizes[size], className)}>
      {children}
    </span>
  )
}
