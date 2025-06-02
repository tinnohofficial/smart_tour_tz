// hotel-manager/dashboard/store.js
import { create } from 'zustand'
import { apiUtils } from '@/app/services/api'

const api = {
  get: async (url, options = {}) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }
}

export const useDashboardStore = create((set) => ({
  // Stats
  stats: {
    pendingBookings: 0,
    confirmedBookings: 0,
    totalBookings: 0,
  },
  recentBookings: [],
  isLoading: true,
  error: null,

  // Actions
  fetchDashboardData: async () => {
    return apiUtils.withLoadingAndError(
      async () => {
        let pendingBookings = []
        let completedBookings = []

        // Try to fetch pending bookings that need action
        try {
          pendingBookings = await api.get('/api/bookings/hotel-bookings-pending')
        } catch (error) {
          console.warn('Could not fetch pending bookings:', error)
          pendingBookings = []
        }

        // Try to fetch completed bookings
        try {
          completedBookings = await api.get('/api/bookings/hotel-bookings-completed')
        } catch (error) {
          console.warn('Could not fetch completed bookings:', error)
          completedBookings = []
        }

        // Format recent bookings from completed bookings (last 5)
        const recentBookings = completedBookings
          .slice(0, 5)
          .map(booking => ({
            id: booking.booking_id,
            guestName: booking.tourist_email?.split('@')[0] || 'Guest',
            email: booking.tourist_email,
            checkIn: booking.start_date,
            checkOut: booking.end_date,
            roomType: booking.item_details?.room_type || 'Standard',
            amount: parseFloat(booking.cost) || 0
          }))
        
        set({
          stats: {
            pendingBookings: pendingBookings.length,
            confirmedBookings: completedBookings.length,
            totalBookings: completedBookings.length + pendingBookings.length,
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