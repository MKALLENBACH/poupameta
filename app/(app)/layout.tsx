import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { ContaFormModal } from '@/components/conta/ContaFormModal'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:pl-60 pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>
      <BottomNav />
      <ContaFormModal />
    </div>
  )
}
