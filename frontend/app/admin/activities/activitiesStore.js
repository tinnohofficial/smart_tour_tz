// src/stores/activitiesStore.js (or wherever you keep your stores)
import { create } from 'zustand';
import { toast } from "sonner"; // Import toast here

// Define API base URL (can be shared or redefined here)
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper to get token safely
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("token");
  }
  return null;
};

export const useActivitiesStore = create((set, get) => ({
  // --- State ---
  activities: [],
  filteredActivities: [],
  destinations: [],
  searchTerm: "",
  isLoading: true,
  isSubmitting: false,
  error: null,
  isAddDialogOpen: false,
  isEditDialogOpen: false,
  isDeleteDialogOpen: false,
  selectedActivity: null,
  formData: {
    name: "",
    description: "",
    destination_id: "",
    price: "",
  },

  // --- Actions ---

  // Basic Setters
  setSearchTerm: (term) => {
    set({ searchTerm: term });
    get().filterActivities(); // Re-filter when search term changes
  },
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setError: (errorMsg) => set({ error: errorMsg }),
  setIsAddDialogOpen: (isOpen) => set({ isAddDialogOpen: isOpen }),
  setIsEditDialogOpen: (isOpen) => set({ isEditDialogOpen: isOpen }),
  setIsDeleteDialogOpen: (isOpen) => set({ isDeleteDialogOpen: isOpen }),
  setSelectedActivity: (activity) => set({ selectedActivity: activity }),
  setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  resetForm: () => set({ formData: { name: "", description: "", destination_id: "", price: "" } }),

  // Filtering Logic (Internal)
  filterActivities: () => {
    const { activities, searchTerm } = get();
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      set({
        filteredActivities: activities.filter(
          (activity) =>
            activity.name.toLowerCase().includes(lowerSearchTerm) ||
            activity.description.toLowerCase().includes(lowerSearchTerm)
        ),
      });
    } else {
      set({ filteredActivities: activities });
    }
  },

  // Fetching Actions
  fetchActivities: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/activities`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!response.ok) throw new Error("Failed to fetch activities");
      const data = await response.json();
      set({ activities: data });
      get().filterActivities(); // Filter after fetching
    } catch (err) {
      console.error("Error fetching activities:", err);
      set({ error: "Failed to load activities. Please try again." });
      toast({ variant: "destructive", title: "Error", description: get().error }); // Show toast on error
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDestinations: async () => {
    // No loading state change here usually, as it's secondary data
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/destinations`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!response.ok) throw new Error("Failed to fetch destinations");
      const data = await response.json();
      set({ destinations: data });
    } catch (err) {
      console.error("Error fetching destinations:", err);
      // Show toast directly for this less critical fetch failure
      toast.error("Failed to load destinations. Some features may be limited.");
    }
  },

  // CRUD Actions
  addActivity: async () => {
    const { formData } = get();
    if (!formData.name || !formData.description || !formData.destination_id || !formData.price) {
      toast.error("Validation Error: Please fill in all required fields.");
      return;
    }

    set({ isSubmitting: true, error: null });
    try {
      const activityData = {
        name: formData.name,
        description: formData.description,
        destination_id: Number.parseInt(formData.destination_id),
        price: Number.parseFloat(formData.price),
      };
      const token = getToken();
      const response = await fetch(`${API_URL}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify(activityData),
      });
      if (!response.ok) throw new Error("Failed to create activity");
      const newActivity = await response.json();

      set((state) => ({ activities: [...state.activities, newActivity] }));
      get().filterActivities(); // Re-filter to include the new activity
      toast.success("Activity added: The new activity has been added successfully.");
      get().resetForm();
      set({ isAddDialogOpen: false });

    } catch (err) {
      console.error("Error adding activity:", err);
      set({ error: "Failed to add activity. Please try again." });
      toast.error(get().error);
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Prepare Edit Dialog
  prepareEditDialog: (activity) => {
    set({
        selectedActivity: activity,
        formData: {
            name: activity.name,
            description: activity.description,
            destination_id: activity.destination_id.toString(), // Store ID as string for Select compatibility
            price: activity.price.toString(),
        },
        isEditDialogOpen: true,
        error: null // Clear previous errors
    });
  },

  updateActivity: async () => {
    const { formData, selectedActivity } = get();
    if (!selectedActivity) return;

    if (!formData.name || !formData.description || !formData.price) {
      toast.error("Validation Error: Name, description, and price are required.");
      return;
    }

    set({ isSubmitting: true, error: null });
    try {
      // Only send fields that can be updated (don't send destination_id)
      const activityData = {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
      };
      const token = getToken();
      const response = await fetch(`${API_URL}/activities/${selectedActivity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify(activityData),
      });
      if (!response.ok) throw new Error("Failed to update activity");
      const updatedActivity = await response.json();

      set((state) => ({
        activities: state.activities.map((act) => (act.id === selectedActivity.id ? updatedActivity : act)),
      }));
      get().filterActivities(); // Re-filter
      toast.success("Activity updated: The activity has been updated successfully.");
      get().resetForm();
      set({ isEditDialogOpen: false, selectedActivity: null }); // Close and clear selection

    } catch (err) {
      console.error("Error updating activity:", err);
      set({ error: "Failed to update activity. Please try again." });
      toast.error(get().error);
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Prepare Delete Dialog
  prepareDeleteDialog: (activity) => {
     set({ selectedActivity: activity, isDeleteDialogOpen: true, error: null });
  },

  deleteActivity: async () => {
    const { selectedActivity } = get();
    if (!selectedActivity) return;

    set({ isSubmitting: true, error: null });
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/activities/${selectedActivity.id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!response.ok) {
          // Attempt to read error message from backend if available
          let errorMsg = "Failed to delete activity.";
          try {
              const errorData = await response.json();
              errorMsg = errorData.message || errorMsg;
          } catch (_) { /* Ignore parsing error */ }
          throw new Error(errorMsg);
      }

      set((state) => ({
        activities: state.activities.filter((act) => act.id !== selectedActivity.id),
      }));
      get().filterActivities(); // Re-filter
      toast.success("Activity deleted: The activity has been deleted successfully.");
      set({ isDeleteDialogOpen: false, selectedActivity: null }); // Close and clear selection

    } catch (err) {
      console.error("Error deleting activity:", err);
      const description = err.message?.includes("booking") // Basic check for constraint error
        ? "This activity may be part of active bookings and cannot be deleted."
        : err.message || "Failed to delete activity. Please try again.";
      set({ error: description }); // Set error state for potential display elsewhere
      toast.error(description);
    } finally {
      set({ isSubmitting: false });
    }
  },
}));