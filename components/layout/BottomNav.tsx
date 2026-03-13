'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BarChart2, Settings, Plus } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
  { href: '/configuracoes', label: 'Config', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  const openContaModal = useDashboardStore((s) => s.openContaModal)

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0d0e17]/95 border-t border-white/8 backdrop-blur-xl">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {/* First two items */}
        {navItems.slice(0, 2).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
              pathname === href
                ? 'text-brand-400'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}

        {/* FAB */}
        <button
          onClick={() => openContaModal()}
          id="btn-nova-conta-mobile"
          className="flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-900/50 transition-all duration-200 active:scale-95 -mt-5 glow"
        >
          <Plus size={26} className="text-white" />
        </button>

        {/* Last item */}
        {navItems.slice(2).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
              pathname === href
                ? 'text-brand-400'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
