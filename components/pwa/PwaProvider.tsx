'use client'

import { useEffect } from 'react'

export function PwaProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.error('SW registration failed:', err)
        })
      })
    }
  }, [])

  return <>{children}</>
}
