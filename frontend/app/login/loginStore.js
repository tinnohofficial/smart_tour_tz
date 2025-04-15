import { create } from 'zustand'

export const useLoginStore = create((set) => ({
  email: "",
  password: "",
  isLoading: false, 
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));