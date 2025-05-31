import { create } from 'zustand';
import { toast } from "sonner";
import { activitiesService, destinationsService, apiUtils } from '@/app/services/api'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/app/constants'

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
    // Ensure activities is always an array
    const activitiesArray = Array.isArray(activities) ? activities : [];
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      set({
        filteredActivities: activitiesArray.filter(
          (activity) =>
            activity && activity.name && activity.description &&
            (activity.name.toLowerCase().includes(lowerSearchTerm) ||
            activity.description.toLowerCase().includes(lowerSearchTerm))
        ),
      });
    } else {
      set({ filteredActivities: activitiesArray });
    }
  },

  // Fetching Actions
  fetchActivities: async () => {
    return apiUtils.withLoadingAndError(
      async () => {
        const response = await activitiesService.getAllActivities()
        // Backend returns { message, activities } - extract the activities array
        const activities = Array.isArray(response.activities) ? response.activities : 
                          Array.isArray(response) ? response : []
        set({ activities })
        get().filterActivities()
        return activities
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: (error) => {
          console.error("Error fetching activities:", error)
          toast.error(ERROR_MESSAGES.GENERIC_ERROR)
          // Set empty array on error to prevent map errors
          set({ activities: [], filteredActivities: [] })
        }
      }
    )
  },

  fetchDestinations: async () => {
    try {
      const data = await destinationsService.getAllDestinations()
      set({ destinations: data })
    } catch (err) {
      console.error("Error fetching destinations:", err)
      toast.error("Failed to load destinations. Some features may be limited.")
    }
  },

  // CRUD Actions
  addActivity: async () => {
    const { formData } = get();
    if (!formData.name || !formData.description || !formData.destination_id || !formData.price) {
      toast.error("Validation Error: Please fill in all required fields.");
      return;
    }

    return apiUtils.withLoadingAndError(
      async () => {
        const activityData = {
          name: formData.name,
          description: formData.description,
          destination_id: Number.parseInt(formData.destination_id),
          price: Number.parseFloat(formData.price),
        };

        const response = await activitiesService.createActivity(activityData)
        // Backend returns { message, activity } - extract the activity object
        const newActivity = response.activity || response
        
        set((state) => ({ activities: [...state.activities, newActivity] }))
        get().filterActivities()
        get().resetForm()
        set({ isAddDialogOpen: false })
        
        toast.success("Activity added: The new activity has been added successfully.")
        return newActivity
      },
      {
        setLoading: (loading) => set({ isSubmitting: loading }),
        setError: (error) => set({ error }),
        onError: (error, message) => {
          console.error("Error adding activity:", error)
          toast.error(message)
        }
      }
    )
  },

  // Prepare Edit Dialog
  prepareEditDialog: (activity) => {
    set({
        selectedActivity: activity,
        formData: {
            name: activity.name,
            description: activity.description,
            destination_id: activity.destination_id?.toString() || "", // Store ID as string for Select compatibility
            price: activity.price !== undefined && activity.price !== null ? activity.price.toString() : "0",
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

    return apiUtils.withLoadingAndError(
      async () => {
        const activityData = {
          name: formData.name,
          description: formData.description,
          price: Number.parseFloat(formData.price),
        };

        const response = await activitiesService.updateActivity(selectedActivity.id, activityData)
        // Backend returns { message, activity } - extract the activity object
        const updatedActivity = response.activity || response
        
        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === selectedActivity.id ? updatedActivity : activity
          ),
        }))
        get().filterActivities()
        get().resetForm()
        set({ isEditDialogOpen: false, selectedActivity: null })
        
        toast.success("Activity updated: The activity has been updated successfully.")
        return updatedActivity
      },
      {
        setLoading: (loading) => set({ isSubmitting: loading }),
        setError: (error) => set({ error }),
        onError: (error, message) => {
          console.error("Error updating activity:", error)
          toast.error(message)
        }
      }
    )
  },

  // Prepare Delete Dialog
  prepareDeleteDialog: (activity) => {
     set({ selectedActivity: activity, isDeleteDialogOpen: true, error: null });
  },

  deleteActivity: async () => {
    const { selectedActivity } = get();
    if (!selectedActivity) return;

    return apiUtils.withLoadingAndError(
      async () => {
        await activitiesService.deleteActivity(selectedActivity.id)
        
        set((state) => ({
          activities: state.activities.filter((activity) => activity.id !== selectedActivity.id),
        }))
        get().filterActivities()
        set({ isDeleteDialogOpen: false, selectedActivity: null })
        
        toast.success("Activity deleted: The activity has been deleted successfully.")
      },
      {
        setLoading: (loading) => set({ isSubmitting: loading }),
        setError: (error) => set({ error }),
        onError: (error, message) => {
          console.error("Error deleting activity:", error)
          const description = message?.includes("booking") || message?.includes("constraint")
            ? "This activity may be part of active bookings and cannot be deleted."
            : message || "Failed to delete activity. Please try again."
          toast.error(description)
        }
      }
    )
  },
}));