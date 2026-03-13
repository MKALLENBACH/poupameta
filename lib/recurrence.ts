import { addDays, addWeeks, addMonths } from 'date-fns'

export type TipoRecorrencia = 'nenhuma' | 'diaria' | 'semanal' | 'mensal'

/**
 * Calculates the next due date based on recurrence type.
 */
export function proximaData(dataAtual: string, tipo: TipoRecorrencia): string {
  const base = new Date(dataAtual + 'T00:00:00') // avoid TZ issues
  let next: Date

  switch (tipo) {
    case 'diaria':
      next = addDays(base, 1)
      break
    case 'semanal':
      next = addWeeks(base, 1)
      break
    case 'mensal':
      next = addMonths(base, 1)
      break
    default:
      return dataAtual
  }

  return next.toISOString().split('T')[0]
}
