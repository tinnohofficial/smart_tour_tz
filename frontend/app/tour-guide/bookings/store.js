import { create } from "zustand"
import { toast } from "sonner"
import { bookingsService, apiUtils } from '@/app/services/api'
import { ERROR_MESSAGES } from '@/app/constants'

export const useBookingsStore = create((set) => ({
  tours: [],
  isLoading: true,
  searchQuery: "",
  statusFilter: "all",
  
  setTours: (tours) => set({ tours }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  
  fetchTours: async () => {
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await bookingsService.getTourGuideAssignedBookings()
        
        // Transform the data to match our UI needs
        const transformedTours = data.map(booking => ({
          id: booking.booking_id,
          destination: booking.destination_name || booking.destination || 'Unknown Location',
          startDate: booking.start_date || booking.created_at,
          endDate: booking.end_date || booking.created_at,
          status: booking.status === 'completed' ? 'completed' : 'upcoming',
          touristCount: booking.tourist_count || 1,
          touristNames: booking.tourist_names || [booking.tourist_email],
          image: booking.image || "/placeholder.svg",
          paymentStatus: booking.payment_status || 'paid',
          amount: booking.cost || 0,
          details: booking.item_details || {}
        }))

        set({ tours: transformedTours })
        return transformedTours
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: (error) => {
          console.error('Error fetching tours:', error)
          toast.error(ERROR_MESSAGES.BOOKINGS_LOAD_ERROR)
        }
      }
    )
  }
}))