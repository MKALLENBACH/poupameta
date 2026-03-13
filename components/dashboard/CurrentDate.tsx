'use client'

import { useState, useEffect } from 'react'

export function CurrentDate() {
  const [date, setDate] = useState('')

  useEffect(() => {
    setDate(
      new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    )
  }, [])

  return <span className="min-h-[20px] inline-block">{date}</span>
}
