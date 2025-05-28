// src/stores/applicationsStore.js (or your preferred location)
import { create } from 'zustand';
import { toast } from "sonner";
import { applicationsService } from "@/app/services/api"; // Assuming your service path

export const useApplicationsStore = create((set, get) => ({
  // --- State ---
  applications: [],
  filteredApplications: [],
  searchTerm: "",
  isLoading: true,
  error: null,
  selectedApplication: null,
  isDetailsOpen: false,
  isProcessing: false, // For approve/reject actions

  // --- Actions ---

  // Basic Setters
  setSearchTerm: (term) => {
    set({ searchTerm: term });
    get().filterApplications(); // Trigger filtering when term changes
  },
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (errorMsg) => set({ error: errorMsg }),
  setIsDetailsOpen: (isOpen) => set({ isDetailsOpen: isOpen }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  setSelectedApplication: (app) => set({ selectedApplication: app }),

  // Filtering Logic
  filterApplications: () => {
    const { applications, searchTerm } = get();
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      set({
        filteredApplications: applications.filter(
          (app) =>
            (app.name && app.name.toLowerCase().includes(lowerSearchTerm)) ||
            app.email.toLowerCase().includes(lowerSearchTerm) ||
            app.role.toLowerCase().includes(lowerSearchTerm) ||
            (app.details && app.details.full_name && app.details.full_name.toLowerCase().includes(lowerSearchTerm)) ||
            (app.details && app.details.name && app.details.name.toLowerCase().includes(lowerSearchTerm))
        ),
      });
    } else {
      set({ filteredApplications: applications }); // Show all if no search term
    }
  },

  // Fetching Action
  fetchApplications: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await applicationsService.getPendingApplications();
      set({ applications: data });
      get().filterApplications(); // Apply initial filter (or show all)
    } catch (err) {
      console.error("Error fetching applications:", err);
      const errorMsg = "Failed to load applications. Please try again.";
      set({ error: errorMsg });
      toast.error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  // Approve Action
  approveApplication: async (userId) => {
    set({ isProcessing: true });
    try {
      await applicationsService.approveApplication(userId);

      // Update state: remove the approved application
      set((state) => ({
        applications: state.applications.filter((app) => app.user_id !== userId),
      }));
      get().filterApplications(); // Re-filter the updated list

      toast.success("The user account has been successfully approved.");
      set({ isDetailsOpen: false, selectedApplication: null }); // Close dialog and clear selection
    } catch (err) {
      console.error("Error approving application:", err);
      const errorMsg = "There was an error approving this application. Please try again.";
      set({ error: errorMsg }); // Optionally set error state
      toast.error(errorMsg);
    } finally {
      set({ isProcessing: false });
    }
  },

  // Reject Action
  rejectApplication: async (userId) => {
    set({ isProcessing: true });
    try {
      await applicationsService.rejectApplication(userId);

      // Update state: remove the rejected application
      set((state) => ({
        applications: state.applications.filter((app) => app.user_id !== userId),
      }));
      get().filterApplications(); // Re-filter the updated list

      toast.success("The user account has been rejected.");
      set({ isDetailsOpen: false, selectedApplication: null }); // Close dialog and clear selection
    } catch (err) {
      console.error("Error rejecting application:", err);
      const errorMsg = "There was an error rejecting this application. Please try again.";
      set({ error: errorMsg }); // Optionally set error state
      toast.error(errorMsg);
    } finally {
      set({ isProcessing: false });
    }
  },

  // View Details Action
  viewApplicationDetails: (application) => {
    set({ selectedApplication: application, isDetailsOpen: true, error: null }); // Clear error when opening details
  },
}));