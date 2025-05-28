// src/stores/destinationsStore.js (or your preferred location)
import { create } from 'zustand';
import { toast } from 'sonner'; // Import toast from sonner
import { destinationsService, uploadService, apiUtils } from '@/app/services/api'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/app/constants'

export const useDestinationsStore = create((set, get) => ({
  // --- State ---
  destinations: [],
  isLoading: true,
  isSubmitting: false, // For Add/Update/Delete
  isUploading: false,  // For image upload specifically
  error: null,
  isAddDialogOpen: false,
  isEditDialogOpen: false,
  isDeleteDialogOpen: false,
  selectedDestination: null,
  selectedFile: null,
  previewUrl: null, // Can be data URL or existing image URL
  formData: {
    name: "",
    description: "",
    region: "",
    image_url: "", // Store the final URL here
    cost: "", // Added cost field
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

  // Handle File Selection and Preview
  handleFileChange: (file) => {
    if (file) {
      set({ selectedFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        set({ previewUrl: reader.result }); // Set preview to data URL
      };
      reader.readAsDataURL(file);
      // Clear manual image_url input if a file is selected
      set((state) => ({ formData: { ...state.formData, image_url: "" } }));
    } else {
      // If file is cleared, reset selectedFile and potentially preview
      set({ selectedFile: null });
      // Optionally reset preview if needed, or keep existing if editing
      // set({ previewUrl: null });
    }
  },

  // Reset Form and File State
  resetFormAndFile: () => set({
    formData: { name: "", description: "", region: "", image_url: "", cost: "" },
    selectedFile: null,
    previewUrl: null,
    error: null // Also clear errors on reset
  }),

  // Image Upload Helper (Internal)
  _uploadImageToBlob: async (file) => {
    if (!file) return null;
    set({ isUploading: true });
    try {
      const { url } = await uploadService.uploadFile(file)
      return url;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(`Image upload failed: ${error.message}`);
      throw error; 
    } finally {
      set({ isUploading: false });
    }
  },

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
    const { formData, selectedFile } = get();
    if (!formData.name || !formData.description || !formData.region) {
      toast.warning("Please fill in name, description, and region.");
      return;
    }
    // Require either a file or a URL
    if (!selectedFile && !formData.image_url) {
        toast.warning("Please select an image file or provide an image URL.");
        return;
    }

    return apiUtils.withLoadingAndError(
      async () => {
        let imageUrl = formData.image_url; // Use URL from form first
        if (selectedFile) {
          imageUrl = await get()._uploadImageToBlob(selectedFile); // Upload if file exists
          if (!imageUrl) throw new Error("Image upload failed, cannot proceed."); // Stop if upload fails
        }

        const destinationData = { ...formData, image_url: imageUrl };
        const newDestination = await destinationsService.createDestination(destinationData)

        set((state) => ({ destinations: [...state.destinations, newDestination] }));
        toast.success("Destination added successfully!");
        get().resetFormAndFile();
        set({ isAddDialogOpen: false });

        return newDestination
      },
      {
        setLoading: (loading) => set({ isSubmitting: loading }),
        setError: (error) => set({ error }),
        onError: (error, message) => {
          console.error("Error adding destination:", error);
          // Toast handled in _uploadImageToBlob or here if API call fails
          if (!error.message?.includes("upload failed")) { // Avoid double toast
            toast.error(message)
          }
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
        region: destination.region,
        image_url: destination.image_url || "", // Ensure empty string if null/undefined
        cost: destination.cost || "", // Added cost field
      },
      previewUrl: destination.image_url || null, // Set initial preview
      selectedFile: null, // Clear any previously selected file
      isEditDialogOpen: true,
      error: null
    });
  },

  // Update Destination Action
  updateDestination: async () => {
    const { formData, selectedFile, selectedDestination } = get();
    if (!selectedDestination) return;

    if (!formData.name || !formData.description || !formData.region) {
      toast.warning("Please fill in name, description, and region.");
      return;
    }
     // Require either a file or a URL (even if it's the existing one)
    if (!selectedFile && !formData.image_url) {
        toast.warning("Please select an image file or provide an image URL.");
        return;
    }

    return apiUtils.withLoadingAndError(
      async () => {
        let imageUrl = formData.image_url; // Start with potentially existing URL
        if (selectedFile) { // If a *new* file is selected, upload it
          imageUrl = await get()._uploadImageToBlob(selectedFile);
           if (!imageUrl) throw new Error("Image upload failed, cannot proceed."); // Stop if upload fails
        }

        const destinationData = { ...formData, image_url: imageUrl };
        const response = await destinationsService.updateDestination(selectedDestination.id, destinationData);
        
        // Extract the updated destination from the response
        // The controller now returns all fields of the destination
        if (response) {
          set((state) => ({
            destinations: state.destinations.map((dest) =>
              dest.id === selectedDestination.id ? response : dest
            ),
          }));
          toast.success("Destination updated successfully!");
        }
        get().resetFormAndFile();
        set({ isEditDialogOpen: false, selectedDestination: null });

        return updatedDestination
      },
      {
        setLoading: (loading) => set({ isSubmitting: loading }),
        setError: (error) => set({ error }),
        onError: (error, message) => {
          console.error("Error updating destination:", error);
          if (!error.message?.includes("upload failed")) { // Avoid double toast
            toast.error(message)
          }
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