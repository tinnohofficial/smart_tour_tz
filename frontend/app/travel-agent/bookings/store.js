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
  ticketFile: null,
  activeTab: "pending",

  // Actions for dialog and ticket details
  setSelectedBooking: (booking) => set({ selectedBooking: booking }),
  setIsDialogOpen: (isOpen) => set({ isDialogOpen: isOpen }),
  setTicketFile: (file) => set({ ticketFile: file }),
  resetTicketFile: () => set({ ticketFile: null }),
  
  openTicketDialog: (booking) => {
    set({ selectedBooking: booking, isDialogOpen: true });
    get().resetTicketFile();
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

  assignTransportTicket: async (itemId, ticketFile) => {
    return apiUtils.withLoadingAndError(
      async () => {
        // First upload the PDF file
        const formData = new FormData();
        formData.append('file', ticketFile);
        
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload ticket PDF');
        }
        
        const uploadResult = await uploadResponse.json();
        
        // Then assign the ticket with the PDF URL
        await enhancedBookingsService.assignTransportTicket(itemId, uploadResult.url)
        
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