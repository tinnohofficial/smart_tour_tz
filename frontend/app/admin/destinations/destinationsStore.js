// src/stores/destinationsStore.js (or your preferred location)
import { create } from 'zustand';
import { toast } from 'sonner'; // Import toast from sonner

// Define API base URL (can be shared or redefined here)
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper to get token safely
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("token");
  }
  return null;
};

export const useDestinationsStore = create((set, get) => ({
  // --- State ---
  destinations: [],
  filteredDestinations: [],
  searchTerm: "",
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
  setSearchTerm: (term) => {
    set({ searchTerm: term });
    get().filterDestinations();
  },
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

  // Filtering Logic
  filterDestinations: () => {
    const { destinations, searchTerm } = get();
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      set({
        filteredDestinations: destinations.filter(
          (dest) =>
            dest.name.toLowerCase().includes(lowerSearchTerm) ||
            dest.description.toLowerCase().includes(lowerSearchTerm) ||
            dest.region.toLowerCase().includes(lowerSearchTerm)
        ),
      });
    } else {
      set({ filteredDestinations: destinations });
    }
  },

  // Image Upload Helper (Internal)
  _uploadImageToBlob: async (file) => {
    if (!file) return null;
    set({ isUploading: true });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { 
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.error || "Failed to upload image");
      }
      const { url } = await response.json();
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
    set({ isLoading: true, error: null });
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/destinations`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!response.ok) throw new Error("Failed to fetch destinations");
      const data = await response.json();
      set({ destinations: data });
      get().filterDestinations();
    } catch (err) {
      console.error("Error fetching destinations:", err);
      const errorMsg = "Failed to load destinations. Please try again.";
      set({ error: errorMsg });
      toast.error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
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


    set({ isSubmitting: true, error: null });
    try {
      let imageUrl = formData.image_url; // Use URL from form first
      if (selectedFile) {
        imageUrl = await get()._uploadImageToBlob(selectedFile); // Upload if file exists
        if (!imageUrl) throw new Error("Image upload failed, cannot proceed."); // Stop if upload fails
      }

      const destinationData = { ...formData, image_url: imageUrl };
      const token = getToken();
      const response = await fetch(`${API_URL}/destinations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify(destinationData),
      });
      if (!response.ok) throw new Error("Failed to create destination");
      const newDestination = await response.json();

      set((state) => ({ destinations: [...state.destinations, newDestination] }));
      get().filterDestinations();
      toast.success("Destination added successfully!");
      get().resetFormAndFile();
      set({ isAddDialogOpen: false });

    } catch (err) {
      console.error("Error adding destination:", err);
      const errorMsg = `Failed to add destination: ${err.message || 'Please try again.'}`;
      set({ error: errorMsg });
      // Toast handled in _uploadImageToBlob or here if API call fails
       if (!err.message?.includes("upload failed")) { // Avoid double toast
           toast.error(errorMsg);
       }
    } finally {
      set({ isSubmitting: false });
    }
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

    set({ isSubmitting: true, error: null });
    try {
      let imageUrl = formData.image_url; // Start with potentially existing URL
      if (selectedFile) { // If a *new* file is selected, upload it
        imageUrl = await get()._uploadImageToBlob(selectedFile);
         if (!imageUrl) throw new Error("Image upload failed, cannot proceed."); // Stop if upload fails
      }

      const destinationData = { ...formData, image_url: imageUrl };
      const token = getToken();
      const response = await fetch(`${API_URL}/destinations/${selectedDestination.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify(destinationData),
      });
      if (!response.ok) throw new Error("Failed to update destination");
      const updatedDestination = await response.json();

      set((state) => ({
        destinations: state.destinations.map((dest) =>
          dest.id === selectedDestination.id ? updatedDestination : dest
        ),
      }));
      get().filterDestinations();
      toast.success("Destination updated successfully!");
      get().resetFormAndFile();
      set({ isEditDialogOpen: false, selectedDestination: null });

    } catch (err) {
      console.error("Error updating destination:", err);
      const errorMsg = `Failed to update destination: ${err.message || 'Please try again.'}`;
      set({ error: errorMsg });
       if (!err.message?.includes("upload failed")) { // Avoid double toast
           toast.error(errorMsg);
       }
    } finally {
      set({ isSubmitting: false });
    }
  },

   // Prepare Delete Dialog
   prepareDeleteDialog: (destination) => {
     set({ selectedDestination: destination, isDeleteDialogOpen: true, error: null });
   },

  // Delete Destination Action
  deleteDestination: async () => {
    const { selectedDestination } = get();
    if (!selectedDestination) return;

    set({ isSubmitting: true, error: null });
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/destinations/${selectedDestination.id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!response.ok) {
        let errorMsg = "Failed to delete destination.";
        try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (_) { /* Ignore */ }
        throw new Error(errorMsg);
      }

      set((state) => ({
        destinations: state.destinations.filter((dest) => dest.id !== selectedDestination.id),
      }));
      get().filterDestinations();
      toast.success("Destination deleted successfully!");
      set({ isDeleteDialogOpen: false, selectedDestination: null });

    } catch (err) {
      console.error("Error deleting destination:", err);
      const description = err.message?.includes("activit") // Basic check
        ? "This destination may have associated activities and cannot be deleted."
        : err.message || "Failed to delete destination. Please try again.";
      set({ error: description });
      toast.error(description);
    } finally {
      set({ isSubmitting: false });
    }
  },
}));