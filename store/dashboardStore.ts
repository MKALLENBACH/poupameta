import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface DashboardStore {
  selectedCaixinhaId: string | null
  isContaModalOpen: boolean
  contaEditId: string | null
  toasts: Toast[]

  openCaixinha: (id: string) => void
  closeCaixinha: () => void
  openContaModal: (editId?: string) => void
  closeContaModal: () => void
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  selectedCaixinhaId: null,
  isContaModalOpen: false,
  contaEditId: null,
  toasts: [],

  openCaixinha: (id) => set({ selectedCaixinhaId: id }),
  closeCaixinha: () => set({ selectedCaixinhaId: null }),

  openContaModal: (editId) =>
    set({ isContaModalOpen: true, contaEditId: editId ?? null }),
  closeContaModal: () =>
    set({ isContaModalOpen: false, contaEditId: null }),

  addToast: (message, type = 'success') =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { id: crypto.randomUUID(), message, type },
      ],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
