'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BarChart2, Settings, Plus, PiggyBank, LogOut } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const openContaModal = useDashboardStore((s) => s.openContaModal)
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-60 bg-[#0d0e17] border-r border-white/8 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/8">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/50 glow-sm">
          <PiggyBank size={20} className="text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-gradient">PoupaMeta</span>
          <p className="text-[10px] text-slate-500 leading-none">Planejador financeiro</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              pathname === href
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* CTA */}
      <div className="px-3 pb-4 space-y-2">
        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={() => openContaModal()}
          id="btn-nova-conta-sidebar"
        >
          <Plus size={18} />
          Nova Conta
        </Button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
