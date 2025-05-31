import { create } from "zustand"
import { toast } from "sonner"
import { bookingsService, apiUtils } from '@/app/services/api'
import { ERROR_MESSAGES } from '@/app/constants'

export const useBookingsStore = create((set, get) => ({
  tours: [],
  selectedTour: null,
  isLoading: true,
  statusFilter: "all",
  
  setTours: (tours) => set({ tours }),
  setSelectedTour: (tour) => set({ selectedTour: tour }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  
  fetchTours: async () => {
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await bookingsService.getTourGuideAssignedBookings()
        
        // Transform the data to match our UI needs
        const transformedTours = data.map(booking => ({
          id: booking.booking_id,
          destination: booking.destination_name || 'Unknown Location',
          startDate: booking.start_date || new Date().toISOString(),
          endDate: booking.end_date || new Date().toISOString(),
          status: booking.status || 'confirmed',
          booking_status: booking.booking_status || 'upcoming',
          tourist_email: booking.tourist_email,
          tourist_phone: booking.tourist_phone || 'Not provided',
          tourist_id: booking.tourist_id,
          duration: booking.duration_days || 1,
          image: "/placeholder.svg",
          paymentStatus: 'paid', // Tour guides only see confirmed bookings
          amount: booking.total_cost || 0,
          activities: booking.activities || [],
          hotel: booking.hotel || null,
          transport: booking.transport || null,
          details: booking.guide_assignment_details || {}
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
  },

  fetchTourDetails: async (bookingId) => {
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await bookingsService.getTourGuideBookingDetails(bookingId)
        set({ selectedTour: data })
        return data
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: (error) => {
          console.error('Error fetching tour details:', error)
          toast.error('Failed to load tour details')
        }
      }
    )
  }
}))