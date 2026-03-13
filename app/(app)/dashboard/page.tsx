import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { CaixinhaCard } from '@/components/dashboard/CaixinhaCard'
import { CaixinhaDetailModal } from '@/components/caixinha/CaixinhaDetailModal'
import { calcularResumo } from '@/lib/calculations'
import { CurrentDate } from '@/components/dashboard/CurrentDate'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch caixinhas with conta data
  const { data: caixinhas } = await supabase
    .from('caixinhas')
    .select(`*, conta:contas!inner(*)`)
    .eq('status', 'ativa')
    .eq('contas.user_id', user.id)

  // Fetch monthly savings
  const { data: registros } = await supabase
    .from('registros_economia')
    .select('valor, status, caixinha_id, data')
    .gte('data', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
    .neq('status', 'skipped')

  const activeCaixinhas = (caixinhas ?? []).filter(
    (c) => c.conta && c.conta.user_id === user.id
  )

  const resumo = calcularResumo(
    activeCaixinhas.map((c) => ({
      meta_valor: Number(c.meta_valor),
      valor_guardado: Number(c.valor_guardado),
      valor_por_periodo: Number(c.valor_por_periodo),
      frequencia: c.frequencia,
      data_vencimento: c.data_vencimento,
    }))
  )

  const totalGuardadoMes = (registros ?? []).reduce(
    (acc, r) => acc + Number(r.valor),
    0
  )

  // Sort: priority first, then by due date
  const sorted = [...activeCaixinhas].sort((a, b) => {
    const priA = a.conta?.prioridade ? 1 : 0
    const priB = b.conta?.prioridade ? 1 : 0
    if (priB !== priA) return priB - priA
    return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()
  })

  const hojeStr = new Date().toISOString().split('T')[0]

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto space-y-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white lg:text-3xl">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5 min-h-[20px]">
            <CurrentDate />
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        totalGuardarHoje={resumo.totalGuardarHoje}
        totalGuardadoMes={totalGuardadoMes}
        totalRestante={resumo.totalRestante}
        streak={0}
      />

      {/* Main Content */}
      <div className="lg:flex lg:gap-6 lg:items-start">
        {/* Caixinhas List */}
        <section className="lg:w-3/5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Suas Caixinhas ({sorted.length})
          </h2>

          {sorted.length === 0 ? (
            <div className="bg-[#13151f] border border-dashed border-white/10 rounded-2xl p-10 text-center space-y-3">
              <p className="text-4xl">🐷</p>
              <h3 className="text-lg font-semibold text-white">Nenhuma conta ainda</h3>
              <p className="text-sm text-slate-400">
                Crie sua primeira conta para começar a guardar dinheiro com inteligência.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((caixinha) => {
                const jaGuardouHoje = (registros ?? []).some(
                  (r) => r.caixinha_id === caixinha.id && r.data === hojeStr && r.status !== 'skipped'
                )
                return (
                  <CaixinhaCard key={caixinha.id} caixinha={caixinha as any} jaGuardouHoje={jaGuardouHoje} />
                )
              })}
            </div>
          )}
        </section>

        {/* Desktop sidebar panel */}
        <aside className="hidden lg:block lg:w-2/5 space-y-4 mt-7">
          {/* Upcoming */}
          <div className="bg-[#13151f] border border-white/8 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Próximos vencimentos
            </h3>
            <div className="space-y-2">
              {sorted.slice(0, 5).map((c) => {
                const dias = Math.ceil(
                  (new Date(c.data_vencimento + 'T00:00:00').getTime() - new Date().setHours(0,0,0,0)) / 86400000
                )
                return (
                  <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <span>{c.conta?.icone}</span>
                      <span className="text-sm text-slate-200">{c.conta?.nome}</span>
                    </div>
                    <span className={`text-xs font-medium ${
                      dias <= 3 ? 'text-red-400' : dias <= 7 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {dias <= 0 ? 'Vencido!' : dias === 1 ? 'amanhã' : `${dias}d`}
                    </span>
                  </div>
                )
              })}
              {sorted.length === 0 && (
                <p className="text-xs text-slate-500">Nenhuma conta ativa.</p>
              )}
            </div>
          </div>

          {/* Summary stats */}
          <div className="bg-[#13151f] border border-white/8 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Resumo
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Contas ativas</span>
                <span className="text-white font-medium">{sorted.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Prioritárias</span>
                <span className="text-brand-400 font-medium">
                  {sorted.filter((c) => c.conta?.prioridade).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Guardado no mês</span>
                <span className="text-emerald-400 font-medium">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGuardadoMes)}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Caixinha Detail Modal */}
      <CaixinhaDetailModal caixinhas={sorted as any} />
    </div>
  )
}
