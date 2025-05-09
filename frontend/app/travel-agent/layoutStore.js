"use client"

import { create } from "zustand"

export const useLayoutStore = create((set) => ({
  isSidebarOpen: false,
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}))