'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { criarCaixinha } from './caixinhas'
import { proximaData } from '@/lib/recurrence'

const ContaSchema = z.object({
  nome: z.string().min(1).max(100),
  valor: z.number().positive(),
  data_vencimento: z.string().min(1),
  frequencia_economia: z.enum(['diaria', 'semanal']),
  recorrencia_tipo: z.enum(['nenhuma', 'diaria', 'semanal', 'mensal']),
  parcelas_total: z.number().nullable().optional(),
  parcela_atual: z.number().nullable().optional(),
  prioridade: z.boolean(),
  icone: z.string().optional().default('💰'),
  categoria: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
})

export type ContaInput = z.infer<typeof ContaSchema>

export async function criarConta(data: ContaInput) {
  const parsed = ContaSchema.parse(data)
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autorizado')

  const { data: conta, error } = await supabase
    .from('contas')
    .insert({ ...parsed, user_id: user.id })
    .select()
    .single()

  if (error) throw error

  await criarCaixinha({
    conta_id: conta.id,
    meta_valor: conta.valor,
    frequencia: conta.frequencia_economia,
    data_vencimento: conta.data_vencimento,
  })

  revalidatePath('/dashboard')
  return conta
}

export async function atualizarConta(
  id: string,
  data: Partial<ContaInput>
) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('contas')
    .update(data)
    .eq('id', id)
  if (error) throw error

  // Sync linked active caixinha with new account values
  const caixinhaUpdate: Record<string, unknown> = {}
  if (data.valor !== undefined) caixinhaUpdate.meta_valor = data.valor
  if (data.data_vencimento !== undefined) caixinhaUpdate.data_vencimento = data.data_vencimento
  if (data.frequencia_economia !== undefined) caixinhaUpdate.frequencia = data.frequencia_economia

  if (Object.keys(caixinhaUpdate).length > 0) {
    const { data: caixinhas } = await supabase
      .from('caixinhas')
      .update(caixinhaUpdate)
      .eq('conta_id', id)
      .eq('status', 'ativa')
      .select('id')

    // Recalculate valor_por_periodo for each affected caixinha
    if (caixinhas) {
      const { recalcularCaixinha } = await import('./caixinhas')
      await Promise.all(caixinhas.map((c) => recalcularCaixinha(c.id)))
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/relatorios')
}

export async function excluirConta(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from('contas').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/dashboard')
}

export async function duplicarConta(id: string) {
  const supabase = createServerClient()
  const { data: original } = await supabase
    .from('contas')
    .select('*')
    .eq('id', id)
    .single()
  if (!original) throw new Error('Conta não encontrada')
  // Return fields without id/timestamps for the confirmation modal
  const { id: _id, created_at: _ca, updated_at: _ua, ...fields } = original
  return fields
}

export async function salvarDuplicacao(fields: ContaInput) {
  await criarConta(fields)
  revalidatePath('/dashboard')
}

export async function concluirConta(id: string) {
  const supabase = createServerClient()
  const { data: conta } = await supabase
    .from('contas')
    .select('*')
    .eq('id', id)
    .single()
  if (!conta) throw new Error('Conta não encontrada')

  await supabase.from('contas').update({ status: 'concluida' }).eq('id', id)
  await supabase
    .from('caixinhas')
    .update({ status: 'concluida' })
    .eq('conta_id', id)

  if (conta.recorrencia_tipo !== 'nenhuma') {
    const hasLimit = conta.parcelas_total !== null && conta.parcelas_total > 0
    const atingiuLimite = hasLimit && (conta.parcela_atual ?? 1) >= (conta.parcelas_total as number)

    if (!atingiuLimite) {
      await criarConta({
        nome: conta.nome,
        valor: conta.valor,
        data_vencimento: proximaData(
          conta.data_vencimento,
          conta.recorrencia_tipo
        ),
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
}

export async function listarContas() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('contas')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'ativa')
    .order('prioridade', { ascending: false })
    .order('data_vencimento', { ascending: true })

  if (error) throw error
  return data ?? []
}
