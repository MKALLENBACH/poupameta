'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefix, id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-slate-400 text-sm select-none pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full rounded-xl border border-white/10 bg-[#1e2030] px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500',
              'transition-all duration-200',
              'focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30',
              prefix && 'pl-9',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
