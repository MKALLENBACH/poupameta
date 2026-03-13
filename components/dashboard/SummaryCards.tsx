'use client'

import { formatCurrency } from '@/lib/calculations'
import { Card } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, Target, Flame } from 'lucide-react'

interface SummaryCardsProps {
  totalGuardarHoje: number
  totalGuardadoMes: number
  totalRestante: number
  streak: number
}

export function SummaryCards({
  totalGuardarHoje,
  totalGuardadoMes,
  totalRestante,
  streak,
}: SummaryCardsProps) {
  const cards = [
    {
      label: 'Guardar Hoje',
      value: formatCurrency(totalGuardarHoje),
      icon: TrendingUp,
      color: 'text-brand-400',
      bg: 'bg-brand-600/10',
      border: 'border-brand-500/20',
    },
    {
      label: 'Guardado no Mês',
      value: formatCurrency(totalGuardadoMes),
      icon: TrendingDown,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Total em Metas',
      value: formatCurrency(totalRestante),
      icon: Target,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'Sequência',
      value: `${streak} dias 🔥`,
      icon: Flame,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map(({ label, value, icon: Icon, color, bg, border }) => (
        <Card
          key={label}
          className={`border ${border}`}
        >
          <div className={`inline-flex p-2 rounded-xl ${bg} mb-3`}>
            <Icon size={18} className={color} />
          </div>
          <p className="text-xs text-slate-500 font-medium">{label}</p>
          <p className={`text-lg font-bold mt-0.5 ${color} leading-tight`}>
            {value}
          </p>
        </Card>
      ))}
    </div>
  )
}
