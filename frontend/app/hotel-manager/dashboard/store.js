// hotel-manager/dashboard/store.js
import { create } from 'zustand'
import { hotelManagerService, hotelBookingsService, apiUtils } from '@/app/services/api'

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
    return apiUtils.withLoadingAndError(
      async () => {
        // Fetch hotel profile first to get capacity
        const profileData = await hotelManagerService.getProfile()
        const hotelCapacity = parseInt(profileData.capacity) || 0

        // Fetch pending bookings that need action
        let pendingBookings = []
        try {
          pendingBookings = await hotelBookingsService.getPendingBookings()
        } catch (error) {
          console.warn('Could not fetch pending bookings:', error)
          // Continue with empty array if bookings can't be fetched
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
          recentBookings
        })
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: (error) => {
          console.error('Error fetching dashboard data:', error)
        }
      }
    )
  }
}))