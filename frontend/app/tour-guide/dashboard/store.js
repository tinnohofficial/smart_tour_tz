import { create } from "zustand"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const useDashboardStore = create((set) => ({
  userData: null,
  tours: [],
  earnings: null,
  isLoading: true,
  isAvailable: false,
  profileStatus: null,
  error: null,

  setIsAvailable: (isAvailable) => set({ isAvailable }),
  
  fetchDashboard: async () => {
    set({ isLoading: true })
    try {
      // Fetch profile data
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/tour-guides/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        set({
          userData: {
            id: data.user_id,
            name: data.full_name,
            email: data.email,
            phone: data.phone_number,
            profileImage: data.profile_image || "/placeholder.svg",
            location: data.location,
            expertise: typeof data.expertise === 'object' 
              ? data.expertise 
              : { general: data.expertise || "", activities: [] },
            rating: data.rating || 4.5,
            reviewCount: data.review_count || 0,
            isAvailable: data.available || false,
            status: data.status
          },
          isAvailable: data.available || false,
          profileStatus: data.status
        })

        // Only fetch tours and earnings if profile is approved
        if (data.status === 'active') {
          // Fetch assigned tours
          const toursResponse = await fetch(`${API_URL}/bookings/tour-guide-assigned`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          
          if (toursResponse.ok) {
            const toursData = await toursResponse.json()
            set({ tours: toursData })
          }

          // For now using mock earnings data
          set({
            earnings: {
              total: "$5,200",
              currentMonth: "$1,200",
              pendingPayouts: "$800"
            }
          })
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      set({ error: 'Failed to load dashboard data' })
      toast.error('Failed to load dashboard data')
    } finally {
      set({ isLoading: false })
    }
  }
}))