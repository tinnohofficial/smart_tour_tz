import { create } from "zustand"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL

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
    set({ isLoading: true })
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/bookings/tour-guide-assigned`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tours')
      }

      const data = await response.json()
      
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
        rating: booking.rating,
        feedback: booking.feedback,
        details: booking.item_details || {}
      }))

      set({ 
        tours: transformedTours,
        isLoading: false 
      })
    } catch (error) {
      console.error('Error fetching tours:', error)
      toast.error('Failed to load tours')
      set({ isLoading: false })
    }
  }
}))