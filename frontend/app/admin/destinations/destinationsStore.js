// src/stores/destinationsStore.js (or your preferred location)
import { create } from 'zustand';
import { toast } from 'sonner'; // Import toast from sonner
import { destinationsService, apiUtils } from '@/app/services/api'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/app/constants'

export const useDestinationsStore = create((set, get) => ({
  // --- State ---
  destinations: [],
  isLoading: true,
  isSubmitting: false, // For Add/Update/Delete

  error: null,
  isAddDialogOpen: false,
  isEditDialogOpen: false,
  isDeleteDialogOpen: false,
  selectedDestination: null,
  formData: {
    name: "",
    description: "",
    image_url: "", // Store the final URL here
  },

  // --- Actions ---

  // Basic Setters
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsSubmitting: (submitting) => set({ isSubmitting: submitting }),
  setError: (errorMsg) => set({ error: errorMsg }),
  setIsAddDialogOpen: (isOpen) => set({ isAddDialogOpen: isOpen }),
  setIsEditDialogOpen: (isOpen) => set({ isEditDialogOpen: isOpen }),
  setIsDeleteDialogOpen: (isOpen) => set({ isDeleteDialogOpen: isOpen }),
  setSelectedDestination: (dest) => set({ selectedDestination: dest }),
  setFormDataField: (field, value) => set((state) => ({ formData: { ...state.formData, [field]: value } })),


  // Reset Form State
  resetFormAndFile: () => set({
    formData: { name: "", description: "", image_url: "" },
    error: null // Also clear errors on reset
  }),

  // Fetching Action
  fetchDestinations: async () => {
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await destinationsService.getAllDestinations()
        set({ destinations: data })
        return data
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: (error) => {
          console.error("Error fetching destinations:", error)
          toast.error(ERROR_MESSAGES.GENERIC_ERROR)
        }
      }
    )
  },

  // Add Destination Action
  addDestination: async () => {
    const { formData } = get();
    if (!formData.name || !formData.description) {
      toast.warning("Please fill in name and description.");
      return;
    }
    // Require image URL (SingleImageUploader handles upload)
    if (!formData.image_url) {
        toast.warning("Please upload an image.");
        return;
    }

    return apiUtils.withLoadingAndError(
      async () => {
        const destinationData = { 
          ...formData
        };
        const newDestination = await destinationsService.createDestination(destinationData)

        // Ensure the new destination has a valid ID before adding to state
        if (newDestination && newDestination.id) {
          set((state) => ({ 
            destinations: [...state.destinations.filter(d => d.id !== newDestination.id), newDestination] 
          }));
          toast.success("Destination added successfully!");
        } else {
          console.error("Invalid destination data received:", newDestination);
          // Refetch destinations to ensure consistency
          await get().fetchDestinations();
          toast.success("Destination added successfully!");
        }
        
        get().resetFormAndFile();
        set({ isAddDialogOpen: false });

        return newDestination
      },
      {
        setLoading: (loading) => set({ isSubmitting: loading }),
        setError: (error) => set({ error }),
        onError: (error, message) => {
          console.error("Error adding destination:", error);
          toast.error(message)
        }
      }
    )
  },

  // Prepare Edit Dialog
  prepareEditDialog: (destination) => {
    set({
      selectedDestination: destination,
      formData: {
        name: destination.name,
        description: destination.description,
        image_url: destination.image_url || "", // Ensure empty string if null/undefined
      },
      isEditDialogOpen: true,
      error: null
    });
  },

  // Update Destination Action
  updateDestination: async () => {
    const { formData, selectedDestination } = get();
    if (!selectedDestination) return;

    if (!formData.name || !formData.description) {
      toast.warning("Please fill in name and description.");
      return;
    }
     // Require image URL (SingleImageUploader handles upload)
    if (!formData.image_url) {
        toast.warning("Please upload an image.");
        return;
    }

    return apiUtils.withLoadingAndError(
      async () => {
        const destinationData = { 
          ...formData
        };
        const response = await destinationsService.updateDestination(selectedDestination.id, destinationData);
        
        // Extract the updated destination from the response
        // The controller now returns all fields of the destination
        if (response && response.id) {
          set((state) => ({
            destinations: state.destinations.map((dest) =>
              dest.id === selectedDestination.id ? response : dest
            ),
          }));
          toast.success("Destination updated successfully!");
        } else {
          console.error("Invalid updated destination data received:", response);
          // Refetch destinations to ensure consistency
          await get().fetchDestinations();
          toast.success("Destination updated successfully!");
        }
        get().resetFormAndFile();
        set({ isEditDialogOpen: false, selectedDestination: null });

        return response
      },
      {
        setLoading: (loading) => set({ isSubmitting: loading }),
        setError: (error) => set({ error }),
        onError: (error, message) => {
          console.error("Error updating destination:", error);
          toast.error(message)
        }
      }
    )
  },

   // Prepare Delete Dialog
   prepareDeleteDialog: (destination) => {
     set({ selectedDestination: destination, isDeleteDialogOpen: true, error: null });
   },

  // Delete Destination Action
  deleteDestination: async () => {
    const { selectedDestination } = get();
    if (!selectedDestination) return;

    return apiUtils.withLoadingAndError(
      async () => {
        await destinationsService.deleteDestination(selectedDestination.id)

        set((state) => ({
          destinations: state.destinations.filter((dest) => dest.id !== selectedDestination.id),
        }));
        toast.success(SUCCESS_MESSAGES.DESTINATION_DELETED);
        set({ isDeleteDialogOpen: false, selectedDestination: null });
      },
      {
        setLoading: (loading) => set({ isSubmitting: loading }),
        setError: (error) => set({ error }),
        onError: (error, message) => {
          console.error("Error deleting destination:", error);
          const description = error.message?.includes("activit") // Basic check
            ? "This destination may have associated activities and cannot be deleted."
            : message || ERROR_MESSAGES.GENERIC_ERROR;
          set({ error: description });
          toast.error(description);
        }
      }
    )
  },
}));