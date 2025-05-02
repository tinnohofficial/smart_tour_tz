// store/tourGuideProfileStore.js
import { create } from 'zustand'
import { toast } from 'sonner'
import { uploadToBlob } from '@/app/services/blob-service' // Adjust path if needed

const API_URL = process.env.NEXT_PUBLIC_API_URL 

export const useTourGuideProfileStore = create((set, get) => ({
  // State
  isSubmitting: false,
  isSaved: false,
  activities: [],
  isLoading: true,
  profileStatus: null,
  licenseFile: null,
  isUploading: false,
  fetchedProfileData: null, // Store fetched data temporarily

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setUploading: (isUploading) => set({ isUploading }),
  setLicenseFile: (file) => set({ licenseFile: file }),

  fetchInitialData: async () => {
    set({ isLoading: true, fetchedProfileData: null })
    try {
      // Fetch activities
      const activitiesResponse = await fetch(`${API_URL}/activities`)
      if (!activitiesResponse.ok) throw new Error('Failed to fetch activities')
      const activitiesData = await activitiesResponse.json()
      set({ activities: activitiesData })

      // Fetch existing profile if any
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('No token found, cannot fetch profile.')
        set({ isLoading: false })
        return null // Indicate no profile fetched
      }

      const profileResponse = await fetch(`${API_URL}/tour-guides/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        set({
          profileStatus: profileData.status,
          isSaved: profileData.status === 'active' || profileData.status === 'pending_approval',
          fetchedProfileData: profileData, // Store for form reset
        })
        return profileData // Return fetched data
      } else if (profileResponse.status === 404) {
        // No profile found, which is okay for a new user
        console.log('No existing profile found.')
        set({ profileStatus: null, isSaved: false })
        return null
      } else {
        throw new Error('Failed to fetch profile data')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data. Please refresh the page.')
      set({ profileStatus: 'error', isSaved: false }) // Indicate an error state
      return null // Indicate fetch failure
    } finally {
      set({ isLoading: false })
    }
  },

  submitProfile: async (data) => {
    set({ isSubmitting: true, isUploading: false })
    const { licenseFile } = get()
    let uploadedUrl = data.license_document_url // Keep existing URL if no new file

    try {
      // Upload license document if a new one is provided
      if (licenseFile) {
        set({ isUploading: true })
        try {
          uploadedUrl = await uploadToBlob(licenseFile)
          data.license_document_url = uploadedUrl // Update data payload
        } catch (error) {
          console.error('Upload Error:', error)
          toast.error('Failed to upload license document. Please try again.')
          set({ isSubmitting: false, isUploading: false })
          return // Stop submission
        } finally {
           set({ isUploading: false })
        }
      }

      // Get token from localStorage
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Authentication Error: You must be logged in.')
        set({ isSubmitting: false })
        return
      }

      // Determine API method (POST for new, PUT for update)
      const method = get().isSaved ? 'PUT' : 'POST' // Check if a profile exists/was saved before

      // Send data to API
      const response = await fetch(`${API_URL}/tour-guides/profile`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to ${method === 'POST' ? 'save' : 'update'} profile`)
      }

      const responseData = await response.json()
      const newStatus = responseData.status || 'pending_approval'
      set({
        profileStatus: newStatus,
        isSaved: true, // Mark as saved/updated
        fetchedProfileData: responseData, // Update stored profile data
        licenseFile: null, // Clear the staged file after successful upload/submit
      })

      toast.success('Profile saved successfully!', {
        description: `Your profile is now ${newStatus === 'active' ? 'active' : 'pending approval by the administrator'}.`,
      })

    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Error saving profile', {
        description: error instanceof Error ? error.message : 'There was an error saving your profile. Please try again.',
      })
    } finally {
      set({ isSubmitting: false, isUploading: false })
    }
  },
}))