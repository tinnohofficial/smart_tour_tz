// hotel-manager/dashboard/store.js
import { create } from 'zustand'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const useDashboardStore = create((set) => ({
  // Stats
  stats: {
    pendingBookings: 0,
    confirmedBookings: 0,
    totalBookings: 0,
    currentOccupancy: 0,
    occupancyRate: 0,
    revenueThisMonth: 0,
  },
  recentBookings: [],
  isLoading: true,
  error: null,

  // Actions
  fetchDashboardData: async () => {
    set({ isLoading: true })
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token found')

      // Fetch hotel profile first to get capacity
      const profileResponse = await fetch(`${API_URL}/hotels/manager/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch hotel profile')
      }
      
      const profileData = await profileResponse.json()
      const hotelCapacity = parseInt(profileData.capacity) || 0

      // Fetch pending bookings that need action
      const pendingResponse = await fetch(`${API_URL}/bookings/hotel-bookings-pending`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      // Even if there's an error with bookings, we can still show other stats
      let pendingBookings = []
      if (pendingResponse.ok) {
        pendingBookings = await pendingResponse.json()
      }

      // For this simple version, we'll generate demo data for the dashboard
      // In a real system, you would have API endpoints for these statistics
      const confirmedBookings = Math.floor(Math.random() * 20) + 5
      const currentOccupancy = Math.floor(Math.random() * hotelCapacity)
      const occupancyRate = hotelCapacity > 0 ? Math.round((currentOccupancy / hotelCapacity) * 100) : 0
      const revenueThisMonth = (Math.random() * 10000 + 5000).toFixed(2)
      
      // Generate demo recent bookings
      const recentBookings = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        guestName: `Guest ${i + 1}`,
        email: `guest${i + 1}@example.com`,
        checkIn: new Date(Date.now() + (i * 86400000)).toISOString().split('T')[0],
        checkOut: new Date(Date.now() + ((i + 3) * 86400000)).toISOString().split('T')[0],
        roomType: ['Deluxe', 'Standard', 'Suite', 'Family', 'Presidential'][Math.floor(Math.random() * 5)],
        amount: (Math.random() * 500 + 100).toFixed(2)
      }))
      
      set({
        stats: {
          pendingBookings: pendingBookings.length,
          confirmedBookings,
          totalBookings: confirmedBookings + pendingBookings.length,
          currentOccupancy,
          occupancyRate,
          revenueThisMonth
        },
        recentBookings,
        isLoading: false
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      set({ error: error.message, isLoading: false })
    }
  }
}))