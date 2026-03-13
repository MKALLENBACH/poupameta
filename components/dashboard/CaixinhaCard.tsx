'use client'

import { formatCurrency, percentualProgresso, diasRestantes, nivelUrgencia } from '@/lib/calculations'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { useDashboardStore } from '@/store/dashboardStore'
import { cn } from '@/lib/utils'
import type { CaixinhaComConta } from '@/lib/types'

interface CaixinhaCardProps {
  caixinha: CaixinhaComConta
}

export function CaixinhaCard({ caixinha }: CaixinhaCardProps) {
  const openCaixinha = useDashboardStore((s) => s.openCaixinha)
  const progress = percentualProgresso(caixinha.meta_valor, caixinha.valor_guardado)
  const dias = diasRestantes(new Date(caixinha.data_vencimento + 'T00:00:00'))
  const urgencia = nivelUrgencia(dias, progress)

  const urgencyColor = {
    ok: 'brand' as const,
    warning: 'warning' as const,
    danger: 'danger' as const,
  }[urgencia]

  return (
    <button
      onClick={() => openCaixinha(caixinha.id)}
      className={cn(
        'w-full text-left bg-[#13151f] border rounded-2xl p-4',
        'transition-all duration-200 hover:border-brand-500/40 hover:bg-[#1a1d2e]',
        'focus:outline-none focus:ring-2 focus:ring-brand-500/50',
        urgencia === 'danger' ? 'border-red-500/30' :
        urgencia === 'warning' ? 'border-amber-500/30' :
        'border-white/8'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="text-2xl leading-none shrink-0">{caixinha.conta.icone}</span>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm truncate">
              {caixinha.conta.nome}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {dias === 1 ? 'Vence amanhã' : `${dias} dias restantes`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {caixinha.conta.prioridade && (
            <Badge variant="brand" size="sm">★ Prioridade</Badge>
          )}
          {urgencia === 'danger' && (
            <Badge variant="danger" size="sm">Urgente</Badge>
          )}
          {urgencia === 'warning' && (
            <Badge variant="warning" size="sm">Atenção</Badge>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-slate-500">Progresso</span>
          <span className="text-xs font-semibold text-slate-300">{progress}%</span>
        </div>
        <Progress
          value={progress}
          color={urgencyColor}
          size="md"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="text-center">
          <p className="text-xs text-slate-500">Guardado</p>
          <p className="text-sm font-semibold text-emerald-400">
            {formatCurrency(caixinha.valor_guardado)}
          </p>
        </div>
        <div className="text-center border-x border-white/8">
          <p className="text-xs text-slate-500">Meta</p>
          <p className="text-sm font-semibold text-white">
            {formatCurrency(caixinha.meta_valor)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">
            {caixinha.frequencia === 'diaria' ? 'Por dia' : 'Por semana'}
          </p>
          <p className="text-sm font-semibold text-brand-400">
            {formatCurrency(caixinha.valor_por_periodo)}
          </p>
        </div>
      </div>
    </button>
  )
}
