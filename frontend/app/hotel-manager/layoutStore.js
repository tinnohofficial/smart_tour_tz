// hotel-manager layoutStore.js
import { create } from 'zustand'

export const useLayoutStore = create((set) => ({
  isSidebarOpen: false,
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}))