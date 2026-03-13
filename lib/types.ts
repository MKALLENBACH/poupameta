export type Frequencia = 'diaria' | 'semanal'
export type RecorrenciaTipo = 'nenhuma' | 'diaria' | 'semanal' | 'mensal'
export type ContaStatus = 'ativa' | 'concluida' | 'pausada'
export type CaixinhaStatus = 'ativa' | 'concluida'
export type RegistroStatus = 'saved' | 'partial' | 'skipped'

export interface Conta {
  id: string
  user_id: string
  nome: string
  valor: number
  data_vencimento: string
  frequencia_economia: Frequencia
  recorrencia_tipo: RecorrenciaTipo
  parcelas_total: number | null
  parcela_atual: number | null
  prioridade: boolean
  status: ContaStatus
  icone: string
  categoria: string | null
  notas: string | null
  created_at: string
  updated_at: string
}

export interface Caixinha {
  id: string
  conta_id: string
  meta_valor: number
  valor_guardado: number
  valor_por_periodo: number
  frequencia: Frequencia
  data_inicio: string
  data_vencimento: string
  status: CaixinhaStatus
  ultimo_calculo: string | null
}

export interface RegistroEconomia {
  id: string
  caixinha_id: string
  valor: number
  data: string
  status: RegistroStatus
  created_at: string
}

export interface CaixinhaComConta extends Caixinha {
  conta: Conta
}

export interface DashboardStats {
  totalGuardarHoje: number
  totalGuardadoMes: number
  totalRestante: number
  streak: number
}
