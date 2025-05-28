// src/stores/assignmentsStore.js (or your preferred location)
import { create } from 'zustand';
import { toast } from 'sonner';
import { bookingsService, apiUtils } from "@/app/services/api";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/app/constants';

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
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await bookingsService.getUnassignedBookings();
        set({ bookings: data });
        return data;
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: (error) => {
          console.error("Error fetching unassigned bookings:", error);
          toast.error(ERROR_MESSAGES.BOOKINGS_LOAD_ERROR);
        }
      }
    );
  },

  // Action to handle clicking the "Assign Guide" button
  prepareAssignDialog: async (booking) => {
    set({ selectedBooking: booking, selectedGuideId: "", eligibleGuides: [] });
    
    return apiUtils.withLoadingAndError(
      async () => {
        const guides = await bookingsService.getEligibleGuides(booking.id);
        set({ eligibleGuides: guides, isAssignDialogOpen: true });
        return guides;
      },
      {
        setLoading: (loading) => set({ isSubmitting: loading }),
        setError: (error) => set({ error }),
        onError: (error) => {
          console.error("Error fetching eligible guides:", error);
          set({ selectedBooking: null });
          toast.error("Failed to fetch eligible tour guides. Please try again.");
        }
      }
    );
  },

  // Action to perform the guide assignment
  assignGuide: async () => {
    const { selectedBooking, selectedGuideId } = get();
    if (!selectedBooking || !selectedGuideId) return;

    return apiUtils.withLoadingAndError(
      async () => {
        await bookingsService.assignGuide(selectedBooking.id, Number.parseInt(selectedGuideId));

        // Update state: remove the assigned booking
        set((state) => ({
          bookings: state.bookings.filter((b) => b.id !== selectedBooking.id),
        }));

        toast.success(SUCCESS_MESSAGES.BOOKING_ASSIGNED);
        set({ isAssignDialogOpen: false, selectedBooking: null, selectedGuideId: "", eligibleGuides: [] });
      },
      {
        setLoading: (loading) => set({ isSubmitting: loading }),
        setError: (error) => set({ error }),
        onError: (error) => {
          console.error("Error assigning guide:", error);
          toast.error("There was an error assigning the tour guide. Please try again.");
        }
      }
    );
  },
}));