import { create } from 'zustand'
import { toast } from 'sonner'
// import { tourGuideApi } from '@/app/services/api'

export const useProfileStore = create((set) => ({
  // Profile data
  full_name: "",
  location: "",
  expertise: {
    general: "",
    activities: []
  },
  license_document_url: "",
  available: true,
  
  // UI state
  isLoading: true,
  isSubmitting: false,
  availabilityUpdating: false,
  errors: null,
  
  // Activities list (these should match the IDs in your database)
  activities: [
    { id: "game-drive", name: "Game Drive Safari", description: "Lead safari tours through national parks" },
    { id: "balloon-safari", name: "Hot Air Balloon Safari", description: "Guide aerial tours over wildlife areas" },
    { id: "nature-walk", name: "Guided Nature Walk", description: "Lead walking tours through scenic trails" },
    { id: "cultural-tour", name: "Cultural Village Tours", description: "Guide tours to local communities" },
    { id: "hiking", name: "Mountain Hiking", description: "Lead hiking expeditions on mountain trails" },
    { id: "bird-watching", name: "Bird Watching", description: "Guide bird watching tours in various habitats" }
  ],

  // Actions
  setFullName: (name) => set({ full_name: name }),
  setLocation: (loc) => set({ location: loc }),
  setGeneralExpertise: (exp) => set(state => ({
    expertise: {
      ...state.expertise,
      general: exp
    }
  })),
  setActivityExpertise: (activities) => set(state => ({
    expertise: {
      ...state.expertise,
      activities: activities
    }
  })),
  setLicenseDocument: (url) => set({ license_document_url: url }),

  // API actions
  fetchProfileData: async () => {
    try {
      set({ isLoading: true, errors: null });
      const data = await tourGuideApi.getProfile();
      
      set({
        full_name: data.full_name || "",
        location: data.location || "",
        expertise: data.expertise ? 
          (typeof data.expertise === 'string' ? 
            { general: data.expertise, activities: [] } : 
            data.expertise
          ) : { general: "", activities: [] },
        license_document_url: data.license_document_url || "",
        available: data.available || false,
        isLoading: false
      });
      
      return data;
    } catch (error) {
      set({ 
        errors: error.response?.data?.message || "Failed to load profile",
        isLoading: false 
      });
      throw error;
    }
  },

  updateProfile: async (data) => {
    try {
      set({ isSubmitting: true, errors: null });
      
      // Format the data to match backend expectations
      const formattedData = {
        full_name: data.full_name,
        location: data.location,
        expertise: {
          general: data.expertise.general,
          activities: data.expertise.activities
        },
        activity_expertise: data.expertise.activities,
        license_document_url: Array.isArray(data.license_document_url) ? 
          data.license_document_url[0] : 
          data.license_document_url
      };

      const response = await tourGuideApi.updateProfile(formattedData);
      set({ isSubmitting: false });
      return response;
    } catch (error) {
      set({ 
        isSubmitting: false,
        errors: error.response?.data?.message || "Failed to update profile" 
      });
      throw error;
    }
  },

  toggleAvailability: async (available) => {
    try {
      set({ availabilityUpdating: true, errors: null });
      const response = await tourGuideApi.updateAvailability(available);
      set({ 
        available,
        availabilityUpdating: false 
      });
      return response;
    } catch (error) {
      set({ 
        availabilityUpdating: false,
        errors: error.response?.data?.message || "Failed to update availability" 
      });
      throw error;
    }
  }
}))