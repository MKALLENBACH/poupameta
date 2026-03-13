'use server'

import { createServerClient } from '@/lib/supabase/server'
import { recalcularCaixinha } from './caixinhas'
import { revalidatePath } from 'next/cache'

interface RegistroInput {
  caixinha_id: string
  valor: number
  status: 'saved' | 'partial' | 'skipped'
}

export async function registrarEconomia(data: RegistroInput) {
  const supabase = createServerClient()
  const hoje = new Date().toISOString().split('T')[0]

  // Upsert: one record per caixinha per day
  const { error } = await supabase.from('registros_economia').upsert(
    { ...data, data: hoje },
    { onConflict: 'caixinha_id,data' }
  )
  if (error) throw error

  if (data.status !== 'skipped' && data.valor > 0) {
    const { data: caixinha } = await supabase
      .from('caixinhas')
      .select('valor_guardado')
      .eq('id', data.caixinha_id)
      .single()

    if (caixinha) {
      const novoValor = Number(caixinha.valor_guardado) + data.valor
      await supabase
        .from('caixinhas')
        .update({ valor_guardado: novoValor })
        .eq('id', data.caixinha_id)
    }
  }

  await recalcularCaixinha(data.caixinha_id)
  revalidatePath('/dashboard')
}

export async function listarRegistros(caixinhaId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('registros_economia')
    .select('*')
    .eq('caixinha_id', caixinhaId)
    .order('data', { ascending: false })
    .limit(30)

  if (error) throw error
  return data ?? []
}

export async function obterEstatisticasMes(userId: string) {
  const supabase = createServerClient()
  const agora = new Date()
  const iniciomes = new Date(agora.getFullYear(), agora.getMonth(), 1)
    .toISOString()
    .split('T')[0]

  const { data, error } = await supabase
    .from('registros_economia')
    .select(`
      valor, data, status,
      caixinha:caixinhas!inner(conta_id, conta:contas!inner(user_id))
    `)
    .eq('caixinhas.contas.user_id', userId)
    .gte('data', iniciomes)
    .neq('status', 'skipped')

  if (error) return { totalGuardadoMes: 0, streak: 0 }

  const totalGuardadoMes = (data ?? []).reduce(
    (acc, r) => acc + Number(r.valor),
    0
  )

  return { totalGuardadoMes, streak: 0 }
}
