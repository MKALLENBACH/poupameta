'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { proximaData } from '@/lib/recurrence'
import type { TipoRecorrencia } from '@/lib/recurrence'

/** Mark a conta as paid. Fills guardado to meta, concludes conta+caixinha, creates next installment if recurring. */
export async function pagarConta(contaId: string) {
  const supabase = createServerClient()

  const { data: conta } = await supabase
    .from('contas')
    .select('*')
    .eq('id', contaId)
    .single()
  if (!conta) throw new Error('Conta não encontrada')

  // Mark conta as concluded
  await supabase.from('contas').update({ status: 'concluida' }).eq('id', contaId)

  // Find active caixinha and fill it to 100%
  const { data: caixinha } = await supabase
    .from('caixinhas')
    .select('id, meta_valor')
    .eq('conta_id', contaId)
    .eq('status', 'ativa')
    .single()

  if (caixinha) {
    await supabase
      .from('caixinhas')
      .update({ valor_guardado: caixinha.meta_valor, status: 'concluida' })
      .eq('id', caixinha.id)
  }

  // Create next installment if recurring and limit not reached
  if (conta.recorrencia_tipo !== 'nenhuma') {
    const hasLimit = conta.parcelas_total !== null && conta.parcelas_total > 0
    const atingiuLimite =
      hasLimit && (conta.parcela_atual ?? 1) >= (conta.parcelas_total as number)

    if (!atingiuLimite) {
      const { criarConta } = await import('./contas')
      await criarConta({
        nome: conta.nome,
        valor: conta.valor,
        data_vencimento: proximaData(conta.data_vencimento, conta.recorrencia_tipo as TipoRecorrencia),
        frequencia_economia: conta.frequencia_economia,
        recorrencia_tipo: conta.recorrencia_tipo,
        parcelas_total: conta.parcelas_total,
        parcela_atual: (conta.parcela_atual ?? 1) + 1,
        prioridade: conta.prioridade,
        icone: conta.icone,
        categoria: conta.categoria,
        notas: conta.notas,
      })
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/relatorios')
}

/** Postpone a non-recurring (or recurring that didn't want to sum) conta to a new due date. Keeps current guardado. */
export async function adiarConta(contaId: string, novaData: string) {
  const supabase = createServerClient()

  await supabase
    .from('contas')
    .update({ data_vencimento: novaData })
    .eq('id', contaId)

  // Update caixinha date and recalculate
  const { data: caixinha } = await supabase
    .from('caixinhas')
    .select('id')
    .eq('conta_id', contaId)
    .eq('status', 'ativa')
    .single()

  if (caixinha) {
    await supabase
      .from('caixinhas')
      .update({ data_vencimento: novaData })
      .eq('id', caixinha.id)

    const { recalcularCaixinha } = await import('./caixinhas')
    await recalcularCaixinha(caixinha.id)
  }

  revalidatePath('/dashboard')
}

/**
 * Handle a recurring conta that was NOT paid.
 * If somarDivida=true: conclude this conta+caixinha, create next installment with
 * valor += unpaid amount (but keep any already-guardado amount as a credit).
 * If somarDivida=false: just postpone to novaData.
 */
export async function adiarContaRecorrente(
  contaId: string,
  somarDivida: boolean,
  novaData?: string
) {
  const supabase = createServerClient()

  if (!somarDivida) {
    if (!novaData) throw new Error('Nova data requerida')
    await adiarConta(contaId, novaData)
    return
  }

  // somarDivida = true: conclude current, create next with increased valor
  const { data: conta } = await supabase
    .from('contas')
    .select('*')
    .eq('id', contaId)
    .single()
  if (!conta) throw new Error('Conta não encontrada')

  const { data: caixinha } = await supabase
    .from('caixinhas')
    .select('id, valor_guardado, meta_valor')
    .eq('conta_id', contaId)
    .eq('status', 'ativa')
    .single()

  const valorGuardado = caixinha ? Number(caixinha.valor_guardado) : 0
  const valorNaoPago = Math.max(0, Number(conta.valor) - valorGuardado)

  // Conclude current conta and caixinha
  await supabase.from('contas').update({ status: 'concluida' }).eq('id', contaId)
  if (caixinha) {
    await supabase
      .from('caixinhas')
      .update({ status: 'concluida' })
      .eq('id', caixinha.id)
  }

  // Create next installment with increased valor
  const hasLimit = conta.parcelas_total !== null && conta.parcelas_total > 0
  const atingiuLimite =
    hasLimit && (conta.parcela_atual ?? 1) >= (conta.parcelas_total as number)

  if (!atingiuLimite) {
    const { criarConta } = await import('./contas')
    await criarConta({
      nome: conta.nome,
      valor: conta.valor + valorNaoPago,  // next installment includes the debt
      data_vencimento: proximaData(conta.data_vencimento, conta.recorrencia_tipo as TipoRecorrencia),
      frequencia_economia: conta.frequencia_economia,
      recorrencia_tipo: conta.recorrencia_tipo,
      parcelas_total: conta.parcelas_total,
      parcela_atual: (conta.parcela_atual ?? 1) + 1,
      prioridade: conta.prioridade,
      icone: conta.icone,
      categoria: conta.categoria,
      notas: conta.notas,
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/relatorios')
}
