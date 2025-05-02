import { create } from "zustand"

export const usePasswordStore = create((set) => ({
  isSubmitting: false,
  success: false,
  showCurrentPassword: false,
  showNewPassword: false,
  showConfirmPassword: false,
  setIsSubmitting: (state) => set({ isSubmitting: state }),
  setSuccess: (state) => set({ success: state }),
  setShowCurrentPassword: (state) => set({ showCurrentPassword: state }),
  setShowNewPassword: (state) => set({ showNewPassword: state }),
  setShowConfirmPassword: (state) => set({ showConfirmPassword: state }),
  resetState: () => set({
    isSubmitting: false,
    success: false,
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
  })
}))