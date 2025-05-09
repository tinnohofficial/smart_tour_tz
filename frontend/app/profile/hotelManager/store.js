import { create } from 'zustand'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const useHotelManagerProfileStore = create((set, get) => ({
  // State
  hotelName: "",
  hotelLocation: "",
  hotelDescription: "", // Added description field
  hotelCapacity: "",
  accommodationCosts: "",
  hotelFacilities: "",
  hotelImages: [],
  isSubmitting: false,
  isSaved: false,
  isUploading: false,
  fetchedProfileData: null,

  // Actions
  setHotelName: (hotelName) => set({ hotelName }),
  setHotelLocation: (hotelLocation) => set({ hotelLocation }),
  setHotelDescription: (hotelDescription) => set({ hotelDescription }), // Added setter for description
  setHotelCapacity: (hotelCapacity) => set({ hotelCapacity }),
  setAccommodationCosts: (accommodationCosts) => set({ accommodationCosts }),
  setHotelFacilities: (hotelFacilities) => set({ hotelFacilities }),
  setHotelImages: (hotelImages) => set({ hotelImages }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setIsSaved: (isSaved) => set({ isSaved }),
  setIsUploading: (isUploading) => set({ isUploading }),

  fetchProfile: async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Authentication Error: You must be logged in.')
        return
      }

      const response = await fetch(`${API_URL}/hotels/manager/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const profileData = await response.json()
        set({
          hotelName: profileData.name || "",
          hotelLocation: profileData.location || "",
          hotelDescription: profileData.description || "", // Added description mapping
          hotelCapacity: profileData.capacity || "",
          accommodationCosts: profileData.base_price_per_night || "", // Updated field name
          hotelFacilities: profileData.facilities || "",
          hotelImages: profileData.images || [],
          fetchedProfileData: profileData,
          isSaved: true
        })
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      toast.error("Failed to load profile data")
    }
  },

  submitProfile: async () => {
    set({ isSubmitting: true })
    const state = get()
    
    try {
      // Upload any new images first
      set({ isUploading: true })
      const uploadedImageUrls = []
      
      for (const imageFile of state.hotelImages) {
        if (imageFile instanceof File) {
          try {
            const formData = new FormData()
            formData.append("file", imageFile)
            
            const response = await fetch("/api/upload-url", {
              method: "POST",
              body: formData,
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || "Failed to upload file")
            }

            const { url } = await response.json()
            uploadedImageUrls.push(url)
          } catch (error) {
            console.error('Upload Error:', error)
            toast.error(`Failed to upload image: ${imageFile.name}`)
            set({ isSubmitting: false, isUploading: false })
            return
          }
        } else {
          uploadedImageUrls.push(imageFile) // Keep existing URLs
        }
      }

      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Authentication Error: You must be logged in.')
        set({ isSubmitting: false })
        return
      }

      // Check for required fields
      if (!state.hotelName || !state.hotelLocation || !state.hotelDescription || 
          !state.hotelCapacity || !state.accommodationCosts) {
        throw new Error('Required fields missing: name, location, description, capacity, and base_price_per_night are required')
      }

      // Prepare data for submission with corrected field names
      const profileData = {
        name: state.hotelName,
        location: state.hotelLocation,
        description: state.hotelDescription,
        capacity: state.hotelCapacity,
        base_price_per_night: state.accommodationCosts,
        facilities: state.hotelFacilities,
        images: uploadedImageUrls
      }

      const method = state.isSaved ? 'PUT' : 'POST'
      const response = await fetch(`${API_URL}/hotels`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save profile')
      }

      const responseData = await response.json()
      set({
        isSaved: true,
        fetchedProfileData: responseData,
        hotelImages: uploadedImageUrls // Update with new URLs
      })

      toast.success('Profile saved successfully!', {
        description: 'Your profile is now pending approval by the administrator.',
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Error saving profile', {
        description: error.message || 'There was an error saving your profile. Please try again.',
      })
    } finally {
      set({ isSubmitting: false, isUploading: false })
    }
  },

  savePartial: () => {
    const state = get()
    if (!state.hotelName && !state.hotelLocation && !state.hotelCapacity && 
        !state.accommodationCosts && !state.hotelFacilities && state.hotelImages.length === 0) {
      toast.error("Please fill in at least one field to save progress")
      return
    }
    
    // Save current state to localStorage
    const draft = {
      hotelName: state.hotelName,
      hotelLocation: state.hotelLocation,
      hotelDescription: state.hotelDescription, // Added description to draft
      hotelCapacity: state.hotelCapacity,
      accommodationCosts: state.accommodationCosts,
      hotelFacilities: state.hotelFacilities,
      hotelImages: state.hotelImages.filter(img => !(img instanceof File)) // Only save URLs, not files
    }
    
    localStorage.setItem('hotelManagerProfileDraft', JSON.stringify(draft))
    toast.success("Progress saved locally")
  },

  resetForm: () => set({
    hotelName: "",
    hotelLocation: "",
    hotelDescription: "", // Added to reset
    hotelCapacity: "",
    accommodationCosts: "",
    hotelFacilities: "",
    hotelImages: [],
    isSubmitting: false,
    isSaved: false,
    isUploading: false
  })
}))