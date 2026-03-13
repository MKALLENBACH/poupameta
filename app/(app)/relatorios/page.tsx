'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/calculations'

const COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c084fc', '#d8b4fe']

function EmptyChart() {
  return (
    <div className="h-40 flex items-center justify-center">
      <p className="text-sm text-slate-500">Nenhum dado disponível</p>
    </div>
  )
}

export default function RelatoriosPage() {
  const [monthlyData, setMonthlyData] = useState<{ mes: string; valor: number }[]>([])
  const [concluidasData, setConcluidasData] = useState<{ nome: string; valor: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Monthly savings last 6 months
      const months: { mes: string; valor: number }[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
        const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

        const { data } = await supabase
          .from('registros_economia')
          .select('valor, caixinhas!inner(conta:contas!inner(user_id))')
          .gte('data', start)
          .lte('data', end)
          .neq('status', 'skipped')

        const total = (data ?? []).reduce((acc, r) => acc + Number(r.valor), 0)
        months.push({ mes: label, valor: total })
      }
      setMonthlyData(months)

      // Concluded accounts
      const { data: contas } = await supabase
        .from('contas')
        .select('nome, valor')
        .eq('user_id', user.id)
        .eq('status', 'concluida')
        .order('updated_at', { ascending: false })
        .limit(5)

      setConcluidasData(
        (contas ?? []).map((c) => ({ nome: c.nome, valor: Number(c.valor) }))
      )
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto space-y-6 lg:px-8 lg:py-8">
      <div>
        <h1 className="text-2xl font-bold text-white lg:text-3xl">Relatórios</h1>
        <p className="text-sm text-slate-400 mt-0.5">Acompanhe sua evolução financeira</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly evolution */}
          <div className="bg-[#13151f] border border-white/8 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Evolução Mensal</h3>
            {monthlyData.every((d) => d.valor === 0) ? (
              <EmptyChart />
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="mes" stroke="#4b5563" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#4b5563" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip
                      contentStyle={{ background: '#1a1d24', border: '1px solid #7c3aed', borderRadius: '12px' }}
                      formatter={(v: number) => [formatCurrency(v), 'Guardado']}
                    />
                    <Area type="monotone" dataKey="valor" stroke="#7c3aed" fill="url(#areaGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Concluded accounts */}
          <div className="bg-[#13151f] border border-white/8 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Contas Concluídas</h3>
            {concluidasData.length === 0 ? (
              <EmptyChart />
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={concluidasData} layout="vertical">
                    <XAxis type="number" stroke="#4b5563" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                    <YAxis type="category" dataKey="nome" stroke="#4b5563" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip
                      contentStyle={{ background: '#1a1d24', border: '1px solid #7c3aed', borderRadius: '12px' }}
                      formatter={(v: number) => [formatCurrency(v), 'Valor']}
                    />
                    <Bar dataKey="valor" fill="#7c3aed" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Distribution by account */}
          <div className="bg-[#13151f] border border-white/8 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Distribuição de Metas</h3>
            {concluidasData.length === 0 && monthlyData.every((d) => d.valor === 0) ? (
              <EmptyChart />
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthlyData.filter((d) => d.valor > 0)}
                      dataKey="valor"
                      nameKey="mes"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      strokeWidth={0}
                    >
                      {monthlyData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1a1d24', border: '1px solid #7c3aed', borderRadius: '12px' }}
                      formatter={(v: number) => [formatCurrency(v), '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Monthly totals table */}
          <div className="bg-[#13151f] border border-white/8 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Histórico por Mês</h3>
            <div className="space-y-2">
              {monthlyData.map((d) => (
                <div key={d.mes} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-slate-400 capitalize">{d.mes}</span>
                  <span className={`text-sm font-semibold ${d.valor > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {formatCurrency(d.valor)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
