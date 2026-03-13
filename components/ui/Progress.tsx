'use client'

import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number // 0-100
  className?: string
  color?: 'brand' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md'
  animated?: boolean
}

export function Progress({
  value,
  className,
  color = 'brand',
  size = 'md',
  animated = true,
}: ProgressProps) {
  const colors = {
    brand: 'bg-gradient-to-r from-brand-600 to-brand-400',
    success: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
    warning: 'bg-gradient-to-r from-amber-600 to-amber-400',
    danger: 'bg-gradient-to-r from-red-600 to-red-400',
  }
  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
  }

  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div
      className={cn(
        'w-full bg-white/10 rounded-full overflow-hidden',
        sizes[size],
        className
      )}
    >
      <div
        className={cn(
          'h-full rounded-full',
          colors[color],
          animated && 'transition-all duration-500 ease-out'
        )}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  )
}
