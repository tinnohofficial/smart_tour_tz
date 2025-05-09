import { create } from 'zustand'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const useDashboardStore = create((set) => ({
  stats: {
    pendingBookings: 0,
    completedBookings: 0,
    totalRoutes: 0,
    monthlyRevenue: 0
  },
  isLoading: true,
  userStatus: "pending_profile",
  
  // Actions
  setStats: (stats) => set({ stats }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setUserStatus: (userStatus) => set({ userStatus }),
  
  // Fetch dashboard data
  fetchDashboardData: async (router) => {
    set({ isLoading: true })
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Get agency profile to check status
      const profileResponse = await fetch(`${API_URL}/travel-agents/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!profileResponse.ok) {
        if (profileResponse.status === 404) {
          set({ userStatus: "pending_profile" })
        } else if (profileResponse.status === 401) {
          localStorage.removeItem('token')
          router.push('/login')
          return
        }
        set({ isLoading: false })
        return
      }

      const profileData = await profileResponse.json()
      set({ userStatus: profileData.status || "pending_profile" })

      // Only fetch stats if user is active
      if (profileData.status === "active") {
        // Fetch pending bookings count
        const pendingResponse = await fetch(`${API_URL}/bookings/transport-bookings-pending`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const pendingBookings = await pendingResponse.json()

        // Fetch completed bookings count
        let completedBookingsCount = 0; // Default value
        try {
            const completedResponse = await fetch(`${API_URL}/bookings/transport-bookings-completed`, { // NEW ENDPOINT
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (completedResponse.ok) {
                const completedBookingsArray = await completedResponse.json();
                completedBookingsCount = completedBookingsArray.length || 0;
            } else {
                console.warn("Dashboard: Could not fetch completed bookings. Status:", completedResponse.status);
            }
        } catch (err) {
            console.error("Dashboard: Error fetching completed bookings:", err);
        }

        // Fake data for now - in a real app you'd get this from the API
        set({
          stats: {
            pendingBookings: pendingBookings.length || 0,
            completedBookings: completedBookingsCount, // UPDATED to use fetched data
            totalRoutes: profileData.routes ? profileData.routes.length : 0,
            monthlyRevenue: Math.floor(Math.random() * 10000) // monthlyRevenue remains random as per original
          }
        })
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      set({ isLoading: false })
    }
  }
}))