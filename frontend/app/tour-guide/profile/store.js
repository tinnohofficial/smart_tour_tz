import { create } from 'zustand'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL

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
    set({ isLoading: true })
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token found')

      const response = await fetch(`${API_URL}/tour-guides/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        set({
          profileData: data,
          fullName: data.full_name || "",
          location: data.location || "",
          expertise: typeof data.expertise === 'object' ? data.expertise : { general: data.expertise || "", activities: [] },
          licenseUrl: data.license_document_url || "",
          activityExpertise: data.activity_expertise || [],
          isAvailable: data.available || false,
        })
      } else if (response.status === 404) {
        // New profile, initialize empty state
        set({ profileData: null })
      } else {
        throw new Error('Failed to fetch profile data')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile data')
      set({ error: error.message })
    } finally {
      set({ isLoading: false })
    }
  },

  updateProfile: async (formData) => {
    set({ isSubmitting: true })
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Handle file upload if there's a new license document
      if (get().licenseFile) {
        set({ isUploading: true })
        const uploadFormData = new FormData()
        uploadFormData.append('file', get().licenseFile)

        const uploadResponse = await fetch('/api/upload-url', {
          method: 'POST',
          body: uploadFormData
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload license document')
        }

        const { url } = await uploadResponse.json()
        formData.license_document_url = url
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

      const response = await fetch(`${API_URL}/tour-guides/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }

      const updatedData = await response.json()
      set({
        profileData: updatedData,
        fullName: updatedData.full_name,
        location: updatedData.location,
        expertise: updatedData.expertise,
        licenseUrl: updatedData.license_document_url,
        activityExpertise: updatedData.activity_expertise,
      })

      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
      set({ error: error.message })
    } finally {
      set({ isSubmitting: false, isUploading: false })
    }
  },

  updateAvailability: async (available) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/tour-guides/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ available })
      })

      if (!response.ok) {
        throw new Error('Failed to update availability')
      }

      set({ isAvailable: available })
      toast.success(
        available ? 'You are now available for tours' : 'You are now unavailable for tours'
      )
    } catch (error) {
      console.error('Error updating availability:', error)
      toast.error('Failed to update availability status')
    }
  }
}))