import { create } from 'zustand'
import { toast } from 'sonner'
import { tourGuideService, uploadService, apiUtils } from '@/app/services/api'
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/app/constants'

export const useProfileStore = create((set, get) => ({
  // Profile data
  profileData: null,
  isLoading: true,
  isSubmitting: false,
  isUploading: false,
  error: null,
  licenseFile: null,

  // Form data
  fullName: "",
  destination_id: "",
  destination_name: "",
  destination_region: "",
  description: "",
  activities: [],
  licenseUrl: "",
  isAvailable: false,

  // Actions
  setLicenseFile: (file) => set({ licenseFile: file }),
  
  fetchProfile: async () => {
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await tourGuideService.getProfile()
        set({
          profileData: data,
          fullName: data.full_name || "",
          destination_id: data.destination_id || "",
          destination_name: data.destination_name || "",
          destination_region: data.destination_region || "",
          description: data.description || "",
          activities: data.activities || [],
          licenseUrl: data.license_document_url || "",
          isAvailable: data.available || false,
        })
        return data
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: (error) => {
          if (error.response?.status === 404) {
            // New profile, initialize empty state
            set({ profileData: null })
          } else {
            console.error('Error fetching profile:', error)
            toast.error(ERROR_MESSAGES.PROFILE_LOAD_ERROR)
          }
        }
      }
    )
  },

  updateProfile: async (formData) => {
    return apiUtils.withLoadingAndError(
      async () => {
        // Handle file upload if there's a new license document
        if (get().licenseFile) {
          set({ isUploading: true })
          const { url } = await uploadService.uploadDocument(get().licenseFile)
          formData.license_document_url = url
          set({ isUploading: false })
        }

        const profileData = {
          full_name: formData.full_name,
          destination_id: formData.destination_id,
          description: formData.description,
          activities: get().activities,
          license_document_url: formData.license_document_url || get().licenseUrl
        }

        const updatedData = await tourGuideService.updateProfile(profileData)
        
        set({
          profileData: updatedData,
          fullName: updatedData.full_name,
          destination_id: updatedData.destination_id,
          destination_name: updatedData.destination_name,
          destination_region: updatedData.destination_region,
          description: updatedData.description,
          activities: updatedData.activities || [],
          licenseUrl: updatedData.license_document_url,
        })

        toast.success(SUCCESS_MESSAGES.PROFILE_UPDATE_SUCCESS)
        return updatedData
      },
      {
        setLoading: (loading) => set({ isSubmitting: loading }),
        setError: (error) => set({ error }),
        onError: (error) => {
          console.error('Error updating profile:', error)
          toast.error(ERROR_MESSAGES.PROFILE_UPDATE_ERROR)
        },
        onFinally: () => set({ isUploading: false })
      }
    )
  },

  updateAvailability: async (available) => {
    return apiUtils.withLoadingAndError(
      async () => {
        await tourGuideService.updateAvailability(available)
        set({ isAvailable: available })
        toast.success(
          available ? 'You are now available for tours' : 'You are now unavailable for tours'
        )
      },
      {
        onError: (error) => {
          console.error('Error updating availability:', error)
          toast.error('Failed to update availability status')
        }
      }
    )
  },

  // Setters for form fields
  setFullName: (fullName) => set({ fullName }),
  setDestination: (destination_id, destination_name, destination_region) => 
    set({ destination_id, destination_name, destination_region }),
  setDescription: (description) => set({ description }),
  setActivities: (activities) => set({ activities }),
  setLicenseUrl: (licenseUrl) => set({ licenseUrl }),
  
  // Reset form
  resetForm: () => set({
    fullName: "",
    destination_id: "",
    destination_name: "",
    destination_region: "",
    description: "",
    activities: [],
    licenseUrl: "",
    licenseFile: null,
    error: null
  })
}))