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
  location: "",
  expertise: {
    general: "",
    activities: []
  },
  licenseUrl: "",
  activityExpertise: [],
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
          location: data.location || "",
          expertise: typeof data.expertise === 'object' ? data.expertise : { general: data.expertise || "", activities: [] },
          licenseUrl: data.license_document_url || "",
          activityExpertise: data.activity_expertise || [],
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

        // Format expertise data
        const expertiseData = {
          general: formData.expertise,
          activities: get().activityExpertise
        }

        const profileData = {
          full_name: formData.full_name,
          location: formData.location,
          expertise: expertiseData,
          activity_expertise: get().activityExpertise,
          license_document_url: formData.license_document_url || get().licenseUrl
        }

        const updatedData = await tourGuideService.updateProfile(profileData)
        
        set({
          profileData: updatedData,
          fullName: updatedData.full_name,
          location: updatedData.location,
          expertise: updatedData.expertise,
          licenseUrl: updatedData.license_document_url,
          activityExpertise: updatedData.activity_expertise,
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
  }
}))