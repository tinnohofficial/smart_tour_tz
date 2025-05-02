// src/stores/assignmentsStore.js (or your preferred location)
import { create } from 'zustand';
import { toast } from 'sonner'; // Import toast from sonner
import { bookingsService } from "@/app/services/api"; // Assuming your service path

export const useAssignmentsStore = create((set, get) => ({
  // --- State ---
  bookings: [],
  filteredBookings: [],
  searchTerm: "",
  isLoading: true,
  isSubmitting: false, // Used for both fetching guides and assigning
  error: null,
  isAssignDialogOpen: false,
  selectedBooking: null,
  eligibleGuides: [],
  selectedGuideId: "",

  // --- Actions ---

  // Basic Setters
  setSearchTerm: (term) => {
    set({ searchTerm: term });
    get().filterBookings(); // Trigger filtering when term changes
  },
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setError: (errorMsg) => set({ error: errorMsg }),
  setIsAssignDialogOpen: (isOpen) => set({ isAssignDialogOpen: isOpen }),
  setSelectedBooking: (booking) => set({ selectedBooking: booking }),
  setSelectedGuideId: (guideId) => set({ selectedGuideId: guideId }),
  clearEligibleGuides: () => set({ eligibleGuides: [] }), // Helper to clear guides

  // Filtering Logic
  filterBookings: () => {
    const { bookings, searchTerm } = get();
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      set({
        filteredBookings: bookings.filter(
          (booking) =>
            booking.tourist_name.toLowerCase().includes(lowerSearchTerm) ||
            booking.destination_name.toLowerCase().includes(lowerSearchTerm)
        ),
      });
    } else {
      set({ filteredBookings: bookings }); // Show all if no search term
    }
  },

  // Fetching Action
  fetchUnassignedBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await bookingsService.getUnassignedBookings();
      set({ bookings: data });
      get().filterBookings(); // Apply initial filter (or show all)
    } catch (err) {
      console.error("Error fetching unassigned bookings:", err);
      const errorMsg = "Failed to load unassigned bookings. Please try again.";
      set({ error: errorMsg });
      toast.error(errorMsg); // Use sonner toast
    } finally {
      set({ isLoading: false });
    }
  },

  // Action to handle clicking the "Assign Guide" button
  prepareAssignDialog: async (booking) => {
    set({ selectedBooking: booking, isSubmitting: true, error: null, selectedGuideId: "", eligibleGuides: [] }); // Reset state for the dialog
    try {
      const guides = await bookingsService.getEligibleGuides(booking.id);
      set({ eligibleGuides: guides, isAssignDialogOpen: true });
    } catch (err) {
      console.error("Error fetching eligible guides:", err);
      const errorMsg = "Failed to fetch eligible tour guides. Please try again.";
      set({ error: errorMsg, selectedBooking: null }); // Clear selected booking on error
      toast.error(errorMsg);
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Action to perform the guide assignment
  assignGuide: async () => {
    const { selectedBooking, selectedGuideId } = get();
    if (!selectedBooking || !selectedGuideId) return;

    set({ isSubmitting: true });
    try {
      await bookingsService.assignGuide(selectedBooking.id, Number.parseInt(selectedGuideId));

      // Update state: remove the assigned booking
      set((state) => ({
        bookings: state.bookings.filter((b) => b.id !== selectedBooking.id),
      }));
      get().filterBookings(); // Re-filter the updated list

      toast.success("Guide assigned successfully!"); // Use sonner toast

      set({ isAssignDialogOpen: false, selectedBooking: null, selectedGuideId: "", eligibleGuides: [] }); // Close dialog and clear state

    } catch (err) {
      console.error("Error assigning guide:", err);
      const errorMsg = "There was an error assigning the tour guide. Please try again.";
      set({ error: errorMsg }); // Optionally set error state
      toast.error(errorMsg);
    } finally {
      set({ isSubmitting: false });
    }
  },
}));