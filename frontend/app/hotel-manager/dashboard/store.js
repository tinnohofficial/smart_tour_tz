// hotel-manager/dashboard/store.js
import { create } from 'zustand'
import { hotelManagerService, apiUtils } from '@/app/services/api'

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
        let hotelCapacity = 0
        let pendingBookings = []
        let completedBookings = []
        
        // Try to fetch hotel profile to get capacity
        try {
          const profileData = await hotelManagerService.getProfile()
          hotelCapacity = parseInt(profileData.capacity) || 0
        } catch (error) {
          console.warn('Could not fetch hotel profile:', error)
          // Continue with default capacity if profile can't be fetched
        }

        // Try to fetch pending bookings that need action
        try {
          pendingBookings = await api.get('/api/bookings/hotel-bookings-pending')
        } catch (error) {
          console.warn('Could not fetch pending bookings:', error)
          pendingBookings = []
        }

        // Try to fetch completed bookings for revenue calculation
        try {
          completedBookings = await api.get('/api/bookings/hotel-bookings-completed')
        } catch (error) {
          console.warn('Could not fetch completed bookings:', error)
          completedBookings = []
        }

        // Calculate current month revenue from completed bookings
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth()
        const currentYear = currentDate.getFullYear()
        
        const revenueThisMonth = completedBookings
          .filter(booking => {
            const bookingDate = new Date(booking.start_date)
            return bookingDate.getMonth() === currentMonth && 
                   bookingDate.getFullYear() === currentYear
          })
          .reduce((total, booking) => total + (parseFloat(booking.cost) || 0), 0)

        // Calculate occupancy based on current bookings
        const today = new Date().toISOString().split('T')[0]
        const currentOccupancy = completedBookings.filter(booking => {
          const checkIn = booking.start_date
          const checkOut = booking.end_date
          return checkIn <= today && checkOut >= today
        }).length

        const occupancyRate = hotelCapacity > 0 ? Math.round((currentOccupancy / hotelCapacity) * 100) : 0
        
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