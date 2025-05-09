// hotel-manager/password/store.js
import { create } from 'zustand'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const usePasswordStore = create((set, get) => ({
  // State
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  isSubmitting: false,
  error: null,

  // Actions
  setCurrentPassword: (password) => set({ currentPassword: password }),
  setNewPassword: (password) => set({ newPassword: password }),
  setConfirmPassword: (password) => set({ confirmPassword: password }),
  
  resetForm: () => set({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    isSubmitting: false,
    error: null
  }),

  changePassword: async () => {
    set({ isSubmitting: true, error: null })
    
    try {
      const { currentPassword, newPassword, confirmPassword } = get()
      
      // Validate passwords
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error("All fields are required")
      }
      
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match")
      }
      
      if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters")
      }
      
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token found')
      
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to change password')
      }
      
      toast.success("Password changed successfully")
      set({ isSubmitting: false })
      return true
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error(error.message || 'Failed to change password')
      set({ error: error.message, isSubmitting: false })
      return false
    }
  }
}))