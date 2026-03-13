'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Settings, LogOut, User } from 'lucide-react'

export default function ConfiguracoesPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setEmail(user.email ?? '')
    })
  }, [])

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6 lg:px-8 lg:py-8">
      <div>
        <h1 className="text-2xl font-bold text-white lg:text-3xl">Configurações</h1>
        <p className="text-sm text-slate-400 mt-0.5">Gerencie sua conta</p>
      </div>

      {/* Account info */}
      <div className="bg-[#13151f] border border-white/8 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/20 flex items-center justify-center">
            <User size={18} className="text-brand-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Sua conta</p>
            <p className="text-xs text-slate-500">{email || 'Carregando...'}</p>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-[#13151f] border border-white/8 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <Settings size={16} />
          <span className="text-sm font-semibold uppercase tracking-wider">Sobre o PoupaMeta</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-white/5">
            <span className="text-slate-400">Versão</span>
            <span className="text-white">1.0.0 MVP</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-400">Desenvolvido com</span>
            <span className="text-white">Next.js + Supabase</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          PoupaMeta é um planejador inteligente de economia. Nenhum dinheiro real é movimentado.
        </p>
      </div>

      {/* Logout */}
      <div className="bg-[#13151f] border border-white/8 rounded-2xl p-5">
        <Button
          variant="danger"
          size="md"
          onClick={handleLogout}
          loading={loading}
          className="w-full"
          id="btn-logout"
        >
          <LogOut size={16} />
          Sair da conta
        </Button>
      </div>
    </div>
  )
}
