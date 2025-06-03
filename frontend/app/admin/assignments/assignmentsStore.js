// src/stores/assignmentsStore.js (or your preferred location)
import { create } from 'zustand';
import { toast } from 'sonner';
import { bookingsService } from "@/app/services/api";

export const useAssignmentsStore = create((set, get) => ({
  // --- State ---
  bookings: [],
  isLoading: true,
  isSubmitting: false, // Used for both fetching guides and assigning
  error: null,
  isAssignDialogOpen: false,
  selectedBooking: null,
  eligibleGuides: [],
  selectedGuideId: "",

  // --- Actions ---

  // Basic Setters
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setError: (errorMsg) => set({ error: errorMsg }),
  setIsAssignDialogOpen: (isOpen) => set({ isAssignDialogOpen: isOpen }),
  setSelectedBooking: (booking) => set({ selectedBooking: booking }),
  setSelectedGuideId: (guideId) => set({ selectedGuideId: guideId }),
  clearEligibleGuides: () => set({ eligibleGuides: [] }), // Helper to clear guides

  // Fetching Action
  fetchUnassignedBookings: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await bookingsService.getUnassignedBookings();
      set({ bookings: data, isLoading: false });
      return data;
    } catch (error) {
      console.error("Error fetching unassigned bookings:", error);
      set({ error: error.message, isLoading: false });
      toast.error("Failed to load unassigned bookings");
      throw error;
    }
  },

  // Action to handle clicking the "Assign Guide" button
  prepareAssignDialog: async (booking) => {
    try {
      set({ 
        selectedBooking: booking, 
        selectedGuideId: "", 
        eligibleGuides: [], 
        isSubmitting: true, 
        error: null 
      });
      
      const guides = await bookingsService.getEligibleGuides(booking.id);
      
      set({ 
        eligibleGuides: guides, 
        isAssignDialogOpen: true, 
        isSubmitting: false 
      });
      return guides;
    } catch (error) {
      console.error("Error fetching eligible guides:", error);
      set({ 
        selectedBooking: null, 
        isSubmitting: false, 
        error: error.message 
      });
      toast.error("Failed to fetch eligible tour guides");
      throw error;
    }
  },

  // Action to perform the guide assignment
  assignGuide: async () => {
    const { selectedBooking, selectedGuideId } = get();
    if (!selectedBooking || !selectedGuideId) {
      toast.error("Please select a tour guide");
      return;
    }

    try {
      set({ isSubmitting: true, error: null });
      
      await bookingsService.assignGuide(selectedBooking.id, parseInt(selectedGuideId));

      // Update state: remove the assigned booking
      set((state) => ({
        bookings: state.bookings.filter((b) => b.id !== selectedBooking.id),
        isSubmitting: false,
        isAssignDialogOpen: false,
        selectedBooking: null,
        selectedGuideId: "",
        eligibleGuides: []
      }));

      toast.success("Tour guide assigned successfully");
    } catch (error) {
      console.error("Error assigning guide:", error);
      set({ isSubmitting: false, error: error.message });
      toast.error("Failed to assign tour guide");
      throw error;
    }
  },
}));