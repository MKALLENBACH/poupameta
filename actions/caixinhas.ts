'use server'

import { createServerClient } from '@/lib/supabase/server'
import { calcularValorPorPeriodo } from '@/lib/calculations'
import { revalidatePath } from 'next/cache'

interface NovaCaixinha {
  conta_id: string
  meta_valor: number
  frequencia: 'diaria' | 'semanal'
  data_vencimento: string
}

export async function criarCaixinha(data: NovaCaixinha) {
  const supabase = createServerClient()
  const valorPorPeriodo = calcularValorPorPeriodo(
    data.meta_valor,
    0,
    new Date(data.data_vencimento + 'T00:00:00'),
    data.frequencia
  )

  const { error } = await supabase.from('caixinhas').insert({
    ...data,
    valor_guardado: 0,
    valor_por_periodo: valorPorPeriodo,
    ultimo_calculo: new Date().toISOString(),
  })

  if (error) throw error
}

export async function recalcularCaixinha(id: string) {
  const supabase = createServerClient()
  const { data: c } = await supabase
    .from('caixinhas')
    .select('*')
    .eq('id', id)
    .single()

  if (!c || c.status === 'concluida') return

  const valorRestante = Math.max(0, c.meta_valor - c.valor_guardado)
  if (valorRestante === 0) {
    // Mark caixinha as concluded
    await supabase
      .from('caixinhas')
      .update({ status: 'concluida' })
      .eq('id', id)

    // Mark linked conta as concluded and create next installment if recurring
    const { data: conta } = await supabase
      .from('contas')
      .select('*')
      .eq('id', c.conta_id)
      .single()

    if (conta) {
      await supabase
        .from('contas')
        .update({ status: 'concluida' })
        .eq('id', conta.id)

      if (conta.recorrencia_tipo !== 'nenhuma') {
        const hasLimit = conta.parcelas_total !== null && conta.parcelas_total > 0
        const atingiuLimite =
          hasLimit && (conta.parcela_atual ?? 1) >= (conta.parcelas_total as number)

        if (!atingiuLimite) {
          const { criarConta } = await import('./contas')
          const { proximaData } = await import('@/lib/recurrence')
          await criarConta({
            nome: conta.nome,
            valor: conta.valor,
            data_vencimento: proximaData(conta.data_vencimento, conta.recorrencia_tipo),
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
    }
    return
  }

  const valorPorPeriodo = calcularValorPorPeriodo(
    c.meta_valor,
    c.valor_guardado,
    new Date(c.data_vencimento + 'T00:00:00'),
    c.frequencia
  )

  await supabase.from('caixinhas').update({
    valor_por_periodo: valorPorPeriodo,
    ultimo_calculo: new Date().toISOString(),
  }).eq('id', id)
}

export async function ajustarValorGuardado(id: string, novoValor: number) {
  const supabase = createServerClient()
  await supabase
    .from('caixinhas')
    .update({ valor_guardado: Math.max(0, novoValor) })
    .eq('id', id)
  await recalcularCaixinha(id)
  revalidatePath('/dashboard')
}

export async function listarCaixinhasComContas() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('caixinhas')
    .select(`
      *,
      conta:contas(*)
    `)
    .eq('status', 'ativa')
    .eq('contas.user_id', user.id)
    .order('contas(prioridade)', { ascending: false })
    .order('contas(data_vencimento)', { ascending: true })

  if (error) {
    // Fallback: fetch separately
    const { data: contas } = await supabase
      .from('contas')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'ativa')

    if (!contas) return []
    const contaIds = contas.map((c) => c.id)

    const { data: caixinhas } = await supabase
      .from('caixinhas')
      .select(`*, conta:contas!inner(*)`)
      .eq('status', 'ativa')
      .in('conta_id', contaIds)

    return caixinhas ?? []
  }

  return data ?? []
}
