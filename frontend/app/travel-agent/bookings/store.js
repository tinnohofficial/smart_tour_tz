"use client"

import { create } from "zustand"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL

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
  activeTab: "pending", // Added activeTab state

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
  setActiveTab: (tab) => set({ activeTab: tab }), // Added setActiveTab action

  fetchPendingBookings: async () => {
    try {
      set({ isLoading: true })
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_URL}/bookings/transport-bookings-pending`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch pending bookings')
      }

      const data = await response.json()
      set({ 
        pendingBookings: data,
        isLoading: false 
      })
    } catch (error) {
      console.error('Error fetching pending bookings:', error)
      toast.error('Failed to load pending bookings')
      set({ isLoading: false, error: error.message })
    }
  },

  fetchCompletedBookings: async () => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/bookings/transport-bookings-completed`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch completed bookings');
      }

      const data = await response.json();
      set({ 
        completedBookings: data,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching completed bookings:', error);
      toast.error('Failed to load completed bookings');
      set({ isLoading: false, error: error.message });
    }
  },

  assignTransportTicket: async (itemId, ticketDetails) => {
    try {
      set({ isLoading: true })
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Format dates for the API
      const formattedTicketDetails = {
        ...ticketDetails,
        departure_date: ticketDetails.departure_date ? 
          ticketDetails.departure_date.toISOString() : null,
        arrival_date: ticketDetails.arrival_date ? 
          ticketDetails.arrival_date.toISOString() : null
      }

      const response = await fetch(`${API_URL}/bookings/items/${itemId}/assign-ticket`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ticketDetails: formattedTicketDetails })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to assign ticket')
      }

      // After successful assignment, update the bookings list
      await get().fetchPendingBookings()
      // Potentially also re-fetch completed bookings if the status changes immediately
      // await get().fetchCompletedBookings(); 
      
      set({ isLoading: false })
      return true
    } catch (error) {
      console.error('Error assigning ticket:', error)
      set({ isLoading: false, error: error.message })
      throw error
    }
  }
}))