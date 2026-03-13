import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated'
  hover?: boolean
}

export function Card({
  className,
  variant = 'default',
  hover = false,
  children,
  ...props
}: CardProps) {
  const base = 'rounded-2xl p-4'
  const variants = {
    default: 'bg-[#13151f] border border-white/8',
    glass: 'glass',
    elevated: 'bg-[#1e2030] border border-white/10 shadow-xl',
  }

  return (
    <div
      className={cn(
        base,
        variants[variant],
        hover &&
          'cursor-pointer transition-all duration-200 hover:border-brand-500/30 hover:bg-[#1a1d2e]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
