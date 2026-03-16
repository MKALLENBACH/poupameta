'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Progress } from '@/components/ui/Progress'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useDashboardStore } from '@/store/dashboardStore'
import { formatCurrency, percentualProgresso, diasRestantes } from '@/lib/calculations'
import { registrarEconomia } from '@/actions/registros'
import { ajustarValorGuardado, listarCaixinhasComContas } from '@/actions/caixinhas'
import type { CaixinhaComConta } from '@/lib/types'

interface CaixinhaDetailModalProps {
  caixinhas: CaixinhaComConta[]
}

export function CaixinhaDetailModal({ caixinhas }: CaixinhaDetailModalProps) {
  const { selectedCaixinhaId, closeCaixinha } = useDashboardStore()
  const addToast = useDashboardStore((s) => s.addToast)
  const openContaModal = useDashboardStore((s) => s.openContaModal)
  const [isPending, startTransition] = useTransition()
  const [showPartial, setShowPartial] = useState(false)
  const [showAdjust, setShowAdjust] = useState(false)
  const [partialValue, setPartialValue] = useState('')
  const [adjustValue, setAdjustValue] = useState('')

  const caixinha = caixinhas.find((c) => c.id === selectedCaixinhaId)

  if (!selectedCaixinhaId || !caixinha) return null

  const progress = percentualProgresso(caixinha.meta_valor, caixinha.valor_guardado)
  const dias = diasRestantes(new Date(caixinha.data_vencimento + 'T00:00:00'))
  const restante = Math.max(0, caixinha.meta_valor - caixinha.valor_guardado)

  function handleSaveComplete() {
    startTransition(async () => {
      try {
        await registrarEconomia({
          caixinha_id: caixinha!.id,
          valor: caixinha!.valor_por_periodo,
          status: 'saved',
        })
        addToast(`✅ ${formatCurrency(caixinha!.valor_por_periodo)} guardado!`, 'success')
        closeCaixinha()
      } catch {
        addToast('Erro ao registrar.', 'error')
      }
    })
  }

  function handleSavePartial() {
    const val = parseFloat(partialValue.replace(',', '.'))
    if (isNaN(val) || val <= 0) return
    startTransition(async () => {
      try {
        await registrarEconomia({
          caixinha_id: caixinha!.id,
          valor: val,
          status: 'partial',
        })
        addToast(`✅ ${formatCurrency(val)} guardado!`, 'success')
        closeCaixinha()
      } catch {
        addToast('Erro ao registrar.', 'error')
      }
    })
  }

  function handleSkip() {
    startTransition(async () => {
      try {
        await registrarEconomia({
          caixinha_id: caixinha!.id,
          valor: 0,
          status: 'skipped',
        })
        addToast('Registrado como não guardado.', 'info')
        closeCaixinha()
      } catch {
        addToast('Erro ao registrar.', 'error')
      }
    })
  }

  function handleAdjust() {
    const val = parseFloat(adjustValue.replace(',', '.'))
    if (isNaN(val) || val < 0) return
    startTransition(async () => {
      try {
        await ajustarValorGuardado(caixinha!.id, val)
        addToast('Valor ajustado!', 'success')
        closeCaixinha()
      } catch {
        addToast('Erro ao ajustar.', 'error')
      }
    })
  }

  return (
    <Modal
      open={!!selectedCaixinhaId}
      onClose={closeCaixinha}
      title={`${caixinha.conta.icone} ${caixinha.conta.nome}`}
      size="md"
    >
      <div className="space-y-5">
        {/* Progress circle + stats */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-28 h-28 mb-3">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1e2030" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#7c3aed"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-bold text-white">{progress}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#1e2030] rounded-xl p-3">
              <p className="text-xs text-slate-500">Guardado</p>
              <p className="text-sm font-bold text-emerald-400">
                {formatCurrency(caixinha.valor_guardado)}
              </p>
            </div>
            <div className="bg-[#1e2030] rounded-xl p-3">
              <p className="text-xs text-slate-500">Restante</p>
              <p className="text-sm font-bold text-white">
                {formatCurrency(restante)}
              </p>
            </div>
            <div className="bg-[#1e2030] rounded-xl p-3">
              <p className="text-xs text-slate-500">
                {caixinha.frequencia === 'diaria' ? 'Por dia' : 'Por semana'}
              </p>
              <p className="text-sm font-bold text-brand-400">
                {formatCurrency(caixinha.valor_por_periodo)}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            {dias < 0
              ? `⚠️ Vencida há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'dia' : 'dias'}`
              : dias === 0
              ? '⏱ Vence hoje'
              : `⏱ ${dias} ${dias === 1 ? 'dia restante' : 'dias restantes'}`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={isPending}
            onClick={handleSaveComplete}
            id="btn-guardar-completo"
          >
            💰 Guardar {formatCurrency(caixinha.valor_por_periodo)} hoje
          </Button>

          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={() => {
              setShowPartial(!showPartial)
              setShowAdjust(false)
            }}
          >
            📊 Guardar valor parcial
          </Button>

          {showPartial && (
            <div className="bg-[#1e2030] rounded-xl p-3 space-y-3">
              <Input
                id="partial-value"
                type="number"
                step="0.01"
                placeholder="Valor guardado"
                prefix="R$"
                value={partialValue}
                onChange={(e) => setPartialValue(e.target.value)}
              />
              <Button
                variant="primary"
                size="md"
                className="w-full"
                loading={isPending}
                onClick={handleSavePartial}
              >
                Confirmar
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="md"
            className="w-full text-slate-400"
            loading={isPending}
            onClick={handleSkip}
          >
            ❌ Não consegui guardar hoje
          </Button>
        </div>

        {/* Adjust total */}
        <div>
          <button
            onClick={() => {
              setShowAdjust(!showAdjust)
              setShowPartial(false)
            }}
            className="text-xs text-slate-500 hover:text-brand-400 underline transition-colors"
          >
            Ajustar valor total guardado
          </button>

          {showAdjust && (
            <div className="bg-[#1e2030] rounded-xl p-3 space-y-3 mt-2">
              <p className="text-xs text-slate-400">
                Informe o valor total que você já guardou para esta conta.
              </p>
              <Input
                id="adjust-value"
                type="number"
                step="0.01"
                placeholder={String(caixinha.valor_guardado)}
                prefix="R$"
                value={adjustValue}
                onChange={(e) => setAdjustValue(e.target.value)}
              />
              <Button
                variant="outline"
                size="md"
                className="w-full"
                loading={isPending}
                onClick={handleAdjust}
              >
                Ajustar
              </Button>
            </div>
          )}
        </div>

        {/* Edit conta */}
        <div className="border-t border-white/8 pt-3">
          <button
            onClick={() => {
              closeCaixinha()
              openContaModal(caixinha.conta_id)
            }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ✏️ Editar conta
          </button>
        </div>
      </div>
    </Modal>
  )
}
