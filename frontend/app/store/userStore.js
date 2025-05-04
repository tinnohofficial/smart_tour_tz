import { create } from 'zustand'
import { toast } from 'sonner'

export const useUserStore = create((set) => ({
  isApproved: false,
  hasCompletedProfile: false,
  userRole: null,
  
  setIsApproved: (status) => set({ isApproved: status }),
  setHasCompletedProfile: (status) => set({ hasCompletedProfile: status }),
  setUserRole: (role) => set({ userRole: role }),

  // Fetch user status from API
  fetchUserStatus: async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        set({
          isApproved: data.isApproved,
          hasCompletedProfile: data.hasCompletedProfile,
          userRole: data.role
        })
      }
    } catch (error) {
      console.error('Error fetching user status:', error)
      toast.error('Failed to fetch user status')
    }
  }
}))