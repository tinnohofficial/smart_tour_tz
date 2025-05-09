// hotel-manager/bookings/store.js
import { create } from 'zustand'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const useBookingsStore = create((set, get) => ({
  // Booking data
  bookings: [],
  filteredBookings: [],
  selectedBooking: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  searchTerm: "",
  isRoomDialogOpen: false,
  roomDetails: {
    roomNumber: "",
    roomType: "",
    checkIn: "",
    checkOut: "",
    specialRequests: "",
    amenities: []
  },

  // Actions
  setSearchTerm: (term) => {
    set({ searchTerm: term })
    get().filterBookings()
  },

  filterBookings: () => {
    const { bookings, searchTerm } = get()
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase()
      set({
        filteredBookings: bookings.filter(
          (booking) =>
            booking.tourist_email?.toLowerCase().includes(lowerSearchTerm) ||
            booking.booking_id?.toString().includes(lowerSearchTerm)
        ),
      })
    } else {
      set({ filteredBookings: bookings })
    }
  },

  fetchBookings: async () => {
    set({ isLoading: true })
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token found')

      const response = await fetch(`${API_URL}/bookings/hotel-bookings-pending`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch bookings')
      
      const bookings = await response.json()
      
      // Parse the item details if needed
      const parsedBookings = bookings.map(booking => {
        if (booking.item_details && typeof booking.item_details === 'string') {
          try {
            booking.item_details = JSON.parse(booking.item_details)
          } catch (e) {
            console.error('Failed to parse item details:', e)
          }
        }
        return booking
      })
      
      set({ 
        bookings: parsedBookings, 
        filteredBookings: parsedBookings,
        isLoading: false 
      })
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load bookings')
      set({ error: error.message, isLoading: false })
    }
  },

  setSelectedBooking: (booking) => {
    set({ selectedBooking: booking })
  },

  setIsRoomDialogOpen: (isOpen) => {
    set({ isRoomDialogOpen: isOpen })
    
    // Reset room details when dialog is closed
    if (!isOpen) {
      set({
        roomDetails: {
          roomNumber: "",
          roomType: "",
          checkIn: "",
          checkOut: "",
          specialRequests: "",
          amenities: []
        }
      })
    }
  },

  updateRoomDetails: (field, value) => {
    set(state => ({
      roomDetails: {
        ...state.roomDetails,
        [field]: value
      }
    }))
  },

  toggleAmenity: (amenity) => {
    set(state => {
      const currentAmenities = state.roomDetails.amenities || []
      const amenityExists = currentAmenities.includes(amenity)
      
      return {
        roomDetails: {
          ...state.roomDetails,
          amenities: amenityExists 
            ? currentAmenities.filter(a => a !== amenity)
            : [...currentAmenities, amenity]
        }
      }
    })
  },

  confirmRoom: async (itemId) => {
    set({ isSubmitting: true })
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token found')

      const { roomDetails } = get()
      
      // Validate required fields
      if (!roomDetails.roomNumber || !roomDetails.roomType) {
        toast.error('Room number and type are required')
        set({ isSubmitting: false })
        return
      }

      const response = await fetch(`${API_URL}/bookings/items/${itemId}/confirm-room`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ roomDetails })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to confirm room')
      }

      toast.success('Room confirmed successfully')
      
      // Update local state - remove the confirmed booking
      set(state => ({
        bookings: state.bookings.filter(booking => booking.id !== itemId),
        filteredBookings: state.filteredBookings.filter(booking => booking.id !== itemId),
        isRoomDialogOpen: false,
        isSubmitting: false
      }))
    } catch (error) {
      console.error('Error confirming room:', error)
      toast.error(error.message || 'Failed to confirm room')
      set({ isSubmitting: false })
    }
  }
}))