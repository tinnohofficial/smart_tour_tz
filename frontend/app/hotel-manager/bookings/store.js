// hotel-manager/bookings/store.js
import { create } from 'zustand'
import { toast } from 'sonner'
import { hotelBookingsService, apiUtils } from '@/app/services/api'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/app/constants'

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
    return apiUtils.withLoadingAndError(
      async () => {
        const bookings = await hotelBookingsService.getPendingBookings()
        
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
          filteredBookings: parsedBookings
        })
        
        return parsedBookings
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: (error) => {
          console.error('Error fetching bookings:', error)
          toast.error(ERROR_MESSAGES.BOOKINGS_LOAD_ERROR)
        }
      }
    )
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
    const { roomDetails } = get()
    
    // Validate required fields
    if (!roomDetails.roomNumber || !roomDetails.roomType) {
      toast.error('Room number and type are required')
      return
    }

    return apiUtils.withLoadingAndError(
      async () => {
        await hotelBookingsService.confirmRoom(itemId, roomDetails)
        
        // Update local state - remove the confirmed booking
        set(state => ({
          bookings: state.bookings.filter(booking => booking.id !== itemId),
          filteredBookings: state.filteredBookings.filter(booking => booking.id !== itemId),
          isRoomDialogOpen: false
        }))
        
        toast.success(SUCCESS_MESSAGES.ROOM_CONFIRM_SUCCESS)
      },
      {
        setLoading: (loading) => set({ isSubmitting: loading }),
        setError: (error) => set({ error }),
        onError: (error, message) => {
          console.error('Error confirming room:', error)
          toast.error(message || ERROR_MESSAGES.ROOM_CONFIRM_ERROR)
        }
      }
    )
  }
}))