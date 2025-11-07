import { create } from 'zustand'

interface DemoModalState {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

export const useDemoModalStore = create<DemoModalState>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}))

