/**
 * Calculation engine — pure functions, no side effects, fully testable.
 */

export type Frequencia = 'diaria' | 'semanal'

/** Days between today and due date (minimum 1) */
export function diasRestantes(dataVencimento: Date): number {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const due = new Date(dataVencimento)
  due.setHours(0, 0, 0, 0)
  const diff = due.getTime() - hoje.getTime()
  return Math.max(1, Math.ceil(diff / 86_400_000))
}

/** Remaining weeks rounded up (minimum 1) */
export function semanasRestantes(dataVencimento: Date): number {
  return Math.max(1, Math.ceil(diasRestantes(dataVencimento) / 7))
}

/** Amount still to save */
export function valorRestante(meta: number, guardado: number): number {
  return Math.max(0, meta - guardado)
}

/** Core calculation engine: valor_restante / períodos_restantes */
export function calcularValorPorPeriodo(
  meta: number,
  guardado: number,
  dataVencimento: Date,
  frequencia: Frequencia
): number {
  const restante = valorRestante(meta, guardado)
  if (restante === 0) return 0

  if (frequencia === 'diaria') {
    return restante / diasRestantes(dataVencimento)
  } else {
    return restante / semanasRestantes(dataVencimento)
  }
}

/** Progress percentage (0–100) */
export function percentualProgresso(meta: number, guardado: number): number {
  if (meta <= 0) return 100
  return Math.min(100, Math.round((guardado / meta) * 100))
}

/** Urgency level based on days remaining and progress */
export function nivelUrgencia(
  diasRest: number,
  progresso: number
): 'ok' | 'warning' | 'danger' {
  if (progresso >= 100) return 'ok'
  if (diasRest <= 3 && progresso < 80) return 'danger'
  if (diasRest <= 7 && progresso < 50) return 'warning'
  return 'ok'
}

/** Dashboard summary across all active caixinhas */
export function calcularResumo(
  caixinhas: Array<{
    meta_valor: number
    valor_guardado: number
    valor_por_periodo: number
    frequencia: Frequencia
    data_vencimento: string
  }>
) {
  const totalGuardarHoje = caixinhas
    .filter((c) => c.frequencia === 'diaria')
    .reduce((acc, c) => acc + c.valor_por_periodo, 0)

  const totalGuardarSemana = caixinhas
    .filter((c) => c.frequencia === 'semanal')
    .reduce((acc, c) => acc + c.valor_por_periodo, 0)

  const totalRestante = caixinhas.reduce(
    (acc, c) => acc + valorRestante(c.meta_valor, c.valor_guardado),
    0
  )

  return { totalGuardarHoje, totalGuardarSemana, totalRestante }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
