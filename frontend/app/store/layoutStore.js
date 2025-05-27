import { create } from "zustand"

/**
 * Shared layout store for managing sidebar state across role-based dashboards
 * This replaces the individual layout stores in each role directory
 */
export const useLayoutStore = create((set) => ({
  isSidebarOpen: false,
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}))
