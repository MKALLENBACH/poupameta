'use client'

import { useState, useTransition, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useDashboardStore } from '@/store/dashboardStore'
import { pagarConta, adiarConta, adiarContaRecorrente } from '@/actions/vencimento'
import type { Conta } from '@/lib/types'

interface VencimentoModalProps {
  contasVencidas: Conta[]
}

type Step =
  | 'pergunta-principal'      // "Foi paga?"
  | 'adiar-data'              // Non-recurring: ask new date
  | 'recorrente-somar'        // Recurring: "Somar dívida ao próximo?"
  | 'recorrente-nova-data'    // Recurring, no suma: ask new date

const DISMISSED_KEY = 'poupameta_vencimento_dismissed'

function getDismissed(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function dismiss(contaId: string, hoje: string) {
  const rec = getDismissed()
  rec[contaId] = hoje
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(rec))
}

export function VencimentoModal({ contasVencidas }: VencimentoModalProps) {
  const addToast = useDashboardStore((s) => s.addToast)
  const [isPending, startTransition] = useTransition()
  const [queue, setQueue] = useState<Conta[]>([])
  const [step, setStep] = useState<Step>('pergunta-principal')
  const [novaData, setNovaData] = useState('')

  const hoje = new Date().toISOString().split('T')[0]

  // On mount, filter out already-dismissed ones for today
  useEffect(() => {
    const dismissed = getDismissed()
    const pending = contasVencidas.filter((c) => dismissed[c.id] !== hoje)
    setQueue(pending)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const current = queue[0]

  if (!current) return null

  const isOpen = queue.length > 0
  const isRecorrente = current.recorrencia_tipo !== 'nenhuma'

  function advance() {
    dismiss(current.id, hoje)
    setQueue((q) => q.slice(1))
    setStep('pergunta-principal')
    setNovaData('')
  }

  function handleSim() {
    startTransition(async () => {
      try {
        await pagarConta(current.id)
        addToast(`✅ ${current.nome} marcada como paga!`, 'success')
        advance()
      } catch {
        addToast('Erro ao registrar pagamento.', 'error')
      }
    })
  }

  function handleNaoNaoRecorrente() {
    setStep('adiar-data')
  }

  function handleNaoRecorrente() {
    setStep('recorrente-somar')
  }

  function handleConfirmarNovaData() {
    if (!novaData) return
    startTransition(async () => {
      try {
        await adiarConta(current.id, novaData)
        addToast(`📅 ${current.nome} adiada para ${novaData}`, 'info')
        advance()
      } catch {
        addToast('Erro ao adiar conta.', 'error')
      }
    })
  }

  function handleSomarSim() {
    startTransition(async () => {
      try {
        await adiarContaRecorrente(current.id, true)
        addToast(`🔄 Dívida somada à próxima parcela de ${current.nome}`, 'info')
        advance()
      } catch {
        addToast('Erro ao processar.', 'error')
      }
    })
  }

  function handleSomarNao() {
    setStep('recorrente-nova-data')
  }

  function handleConfirmarNovaDataRecorrente() {
    if (!novaData) return
    startTransition(async () => {
      try {
        await adiarContaRecorrente(current.id, false, novaData)
        addToast(`📅 ${current.nome} adiada para ${novaData}`, 'info')
        advance()
      } catch {
        addToast('Erro ao adiar conta.', 'error')
      }
    })
  }

  function handleDismiss() {
    advance()
  }

  const titulo = `${current.icone} ${current.nome}`

  const diasAtras = Math.abs(
    Math.ceil(
      (new Date(current.data_vencimento + 'T00:00:00').getTime() -
        new Date(hoje).getTime()) /
        86_400_000
    )
  )

  const subtitulo =
    diasAtras === 0
      ? 'Vence hoje'
      : `Venceu há ${diasAtras} ${diasAtras === 1 ? 'dia' : 'dias'}`

  return (
    <Modal open={isOpen} onClose={handleDismiss} title={titulo} size="sm">
      <div className="space-y-5">
        {/* Sub-heading */}
        <div className="text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            ⏰ {subtitulo}
          </span>
        </div>

        {/* ── Step: pergunta principal ───────────────────────────── */}
        {step === 'pergunta-principal' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-300 text-center">
              Esta conta foi paga?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                loading={isPending}
                onClick={handleSim}
                id={`btn-venc-sim-${current.id}`}
              >
                ✅ Sim, paguei
              </Button>
              <Button
                variant="ghost"
                size="md"
                className="w-full"
                onClick={isRecorrente ? handleNaoRecorrente : handleNaoNaoRecorrente}
              >
                ❌ Não paguei
              </Button>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full text-xs text-slate-600 hover:text-slate-400 transition-colors mt-1"
            >
              Lembrar depois
            </button>
          </div>
        )}

        {/* ── Step: adiar data (non-recurring) ─────────────────── */}
        {step === 'adiar-data' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300 text-center">
              Qual a nova data de vencimento?
            </p>
            <Input
              id="nova-data-vencimento"
              type="date"
              label="Nova data"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="ghost" size="md" onClick={() => setStep('pergunta-principal')}>
                Voltar
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                loading={isPending}
                onClick={handleConfirmarNovaData}
                disabled={!novaData}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: recorrente — somar dívida? ─────────────────── */}
        {step === 'recorrente-somar' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300 text-center">
              Deseja somar a dívida ao próximo pagamento?
            </p>
            <p className="text-xs text-slate-500 text-center">
              Se sim, o valor não pago será adicionado à próxima parcela. O valor já guardado continuará abatendo o total.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                loading={isPending}
                onClick={handleSomarSim}
              >
                Sim, somar
              </Button>
              <Button
                variant="ghost"
                size="md"
                className="w-full"
                onClick={handleSomarNao}
              >
                Não, adiar
              </Button>
            </div>
            <button
              onClick={() => setStep('pergunta-principal')}
              className="w-full text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Voltar
            </button>
          </div>
        )}

        {/* ── Step: recorrente — nova data (sem somar) ─────────── */}
        {step === 'recorrente-nova-data' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300 text-center">
              Qual a nova data de vencimento?
            </p>
            <p className="text-xs text-slate-500 text-center">
              O valor já guardado será mantido para a próxima data.
            </p>
            <Input
              id="nova-data-recorrente"
              type="date"
              label="Nova data"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="ghost" size="md" onClick={() => setStep('recorrente-somar')}>
                Voltar
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                loading={isPending}
                onClick={handleConfirmarNovaDataRecorrente}
                disabled={!novaData}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
