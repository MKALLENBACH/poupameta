'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useDashboardStore } from '@/store/dashboardStore'
import { criarConta, atualizarConta, excluirConta } from '@/actions/contas'

const schema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(100),
  valor: z.number({ invalid_type_error: 'Informe um valor' }).positive('Valor deve ser positivo'),
  data_vencimento: z.string().min(1, 'Data obrigatória'),
  frequencia_economia: z.enum(['diaria', 'semanal']),
  recorrencia_tipo: z.enum(['nenhuma', 'diaria', 'semanal', 'mensal']),
  prioridade: z.boolean(),
  icone: z.string().default('💰'),
  categoria: z.string().nullable().optional(),
})

type FormData = z.infer<typeof schema>

const EMOJIS = ['💰', '🏠', '🚗', '💡', '📱', '🏥', '🎓', '✈️', '🛒', '💳', '🔧', '🎮']

export function ContaFormModal() {
  const { isContaModalOpen, contaEditId, closeContaModal } = useDashboardStore()
  const addToast = useDashboardStore((s) => s.addToast)
  const [isPending, startTransition] = useTransition()
  const [showDelete, setShowDelete] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState('💰')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      frequencia_economia: 'diaria',
      recorrencia_tipo: 'nenhuma',
      prioridade: false,
      icone: '💰',
    },
  })

  function handleClose() {
    closeContaModal()
    reset()
    setShowDelete(false)
    setSelectedEmoji('💰')
  }

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        const payload = { ...data, icone: selectedEmoji, valor: Number(data.valor) }
        if (contaEditId) {
          await atualizarConta(contaEditId, payload)
          addToast('Conta atualizada!', 'success')
        } else {
          await criarConta(payload)
          addToast('Conta criada com sucesso!', 'success')
        }
        handleClose()
      } catch {
        addToast('Erro ao salvar conta.', 'error')
      }
    })
  }

  function handleDelete() {
    if (!contaEditId) return
    startTransition(async () => {
      try {
        await excluirConta(contaEditId)
        addToast('Conta excluída.', 'info')
        handleClose()
      } catch {
        addToast('Erro ao excluir.', 'error')
      }
    })
  }

  return (
    <Modal
      open={isContaModalOpen}
      onClose={handleClose}
      title={contaEditId ? 'Editar Conta' : 'Nova Conta'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Emoji picker */}
        <div>
          <p className="text-sm font-medium text-slate-300 mb-2">Ícone</p>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmoji(emoji)}
                className={`text-xl p-2 rounded-xl transition-all border ${
                  selectedEmoji === emoji
                    ? 'border-brand-500 bg-brand-600/20'
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <Input
          id="nome"
          label="Nome da Conta"
          placeholder="Ex: Aluguel, Internet, Energia..."
          error={errors.nome?.message}
          {...register('nome')}
        />

        <Input
          id="valor"
          type="number"
          step="0.01"
          label="Valor (R$)"
          placeholder="0,00"
          prefix="R$"
          error={errors.valor?.message}
          {...register('valor', { valueAsNumber: true })}
        />

        <Input
          id="data_vencimento"
          type="date"
          label="Data de Vencimento"
          error={errors.data_vencimento?.message}
          {...register('data_vencimento')}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Frequência</label>
            <select
              {...register('frequencia_economia')}
              className="w-full rounded-xl border border-white/10 bg-[#1e2030] px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            >
              <option value="diaria">Diária</option>
              <option value="semanal">Semanal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Recorrência</label>
            <select
              {...register('recorrencia_tipo')}
              className="w-full rounded-xl border border-white/10 bg-[#1e2030] px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            >
              <option value="nenhuma">Sem recorrência</option>
              <option value="diaria">Diária</option>
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            {...register('prioridade')}
            className="w-4 h-4 rounded accent-brand-500"
          />
          <div>
            <p className="text-sm font-medium text-slate-200 group-hover:text-white">
              ★ Marcar como prioritária
            </p>
            <p className="text-xs text-slate-500">Aparece no topo do dashboard</p>
          </div>
        </label>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {contaEditId && (
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={() => setShowDelete(true)}
              className="flex-1"
            >
              Excluir
            </Button>
          )}
          <Button type="button" variant="ghost" size="md" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isPending}
            className="flex-1"
            id="btn-salvar-conta"
          >
            {contaEditId ? 'Salvar' : 'Criar Conta'}
          </Button>
        </div>

        {/* Delete confirm */}
        {showDelete && (
          <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-4 space-y-3">
            <p className="text-sm text-red-300">
              Tem certeza que deseja excluir esta conta? Esta ação é irreversível.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowDelete(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={isPending}
                onClick={handleDelete}
              >
                Confirmar exclusão
              </Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
