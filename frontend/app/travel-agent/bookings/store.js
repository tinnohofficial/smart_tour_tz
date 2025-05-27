"use client"

import { create } from "zustand"
import { toast } from "sonner"
import { enhancedBookingsService, apiUtils } from "@/app/services/api"
import { SUCCESS_MESSAGES } from "@/app/constants"

export const useBookingsStore = create((set, get) => ({
  pendingBookings: [],
  completedBookings: [],
  isLoading: false,
  error: null,
  selectedBooking: null,
  isDialogOpen: false,
  ticketDetails: {
    departure_date: null,
    arrival_date: null,
    ticket_number: "",
    seat_number: "",
    additional_info: ""
  },
  activeTab: "pending",

  // Actions for dialog and ticket details
  setSelectedBooking: (booking) => set({ selectedBooking: booking }),
  setIsDialogOpen: (isOpen) => set({ isDialogOpen: isOpen }),
  setTicketDetails: (details) => set(state => ({ ticketDetails: { ...state.ticketDetails, ...details } })),
  resetTicketDetails: () => set({ 
    ticketDetails: {
      departure_date: null,
      arrival_date: null,
      ticket_number: "",
      seat_number: "",
      additional_info: ""
    } 
  }),
  
  openTicketDialog: (booking) => {
    set({ selectedBooking: booking, isDialogOpen: true });
    get().resetTicketDetails();
  },
  closeTicketDialog: () => set({ isDialogOpen: false, selectedBooking: null }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchPendingBookings: async () => {
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await enhancedBookingsService.getPendingBookings()
        set({ pendingBookings: data })
        return data
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: () => toast.error('Failed to load pending bookings')
      }
    )
  },

  fetchCompletedBookings: async () => {
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await enhancedBookingsService.getCompletedBookings()
        set({ completedBookings: data })
        return data
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: () => toast.error('Failed to load completed bookings')
      }
    )
  },

  assignTransportTicket: async (itemId, ticketDetails) => {
    return apiUtils.withLoadingAndError(
      async () => {
        // Format dates for the API
        const formattedTicketDetails = {
          ...ticketDetails,
          departure_date: ticketDetails.departure_date ? 
            ticketDetails.departure_date.toISOString() : null,
          arrival_date: ticketDetails.arrival_date ? 
            ticketDetails.arrival_date.toISOString() : null
        }

        await enhancedBookingsService.assignTransportTicket(itemId, formattedTicketDetails)
        
        // Refresh bookings after successful assignment
        await get().fetchPendingBookings()
        
        toast.success(SUCCESS_MESSAGES.TICKET_ASSIGNED)
        return true
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: (error, message) => {
          console.error('Error assigning ticket:', error)
          toast.error(message)
        }
      }
    )
  }
}))