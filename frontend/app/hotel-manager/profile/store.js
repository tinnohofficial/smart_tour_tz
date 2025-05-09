// hotel-manager/profile/store.js
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
  
  // Form data
  hotelName: "",
  hotelLocation: "",
  hotelDescription: "",
  hotelCapacity: "",
  accommodationCosts: "",
  hotelImages: [],
  isApproved: false,

  // Actions
  fetchProfile: async () => {
    set({ isLoading: true })
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token found')

      const response = await fetch(`${API_URL}/hotels/manager/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        set({
          profileData: data,
          hotelName: data.name || "",
          hotelLocation: data.location || "",
          hotelDescription: data.description || "",
          hotelCapacity: data.capacity || "",
          // Format price to maintain decimal precision
          accommodationCosts: data.base_price_per_night ? parseFloat(data.base_price_per_night).toFixed(2) : "",
          hotelImages: data.images || [],
          isApproved: data.status === 'active'
        })
      } else if (response.status === 404) {
        // New profile, initialize empty state
        set({ profileData: null })
      } else {
        throw new Error('Failed to fetch profile data')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load hotel profile data')
      set({ error: error.message })
    } finally {
      set({ isLoading: false })
    }
  },

  setHotelImages: (images) => {
    set({ hotelImages: images })
  },

  updateProfile: async (formData) => {
    set({ isSubmitting: true })
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Get hotel images with null check to prevent filter error
      const currentImages = get().hotelImages || [];
      
      // Handle file uploads if there are new hotel images
      const newImages = currentImages.filter(img => img instanceof File)
      const existingImages = currentImages.filter(img => !(img instanceof File))
      
      let uploadedImageUrls = [...existingImages]
      
      if (newImages.length > 0) {
        set({ isUploading: true })
        
        for (const imageFile of newImages) {
          const uploadFormData = new FormData()
          uploadFormData.append('file', imageFile)

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData
          })

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload hotel image')
          }

          const { url } = await uploadResponse.json()
          uploadedImageUrls.push(url)
        }
      }

      // Ensure price has proper decimal format before sending
      const price = parseFloat(formData.accommodationCosts).toFixed(2);

      // Prepare hotel data for submission
      const profileData = {
        name: formData.hotelName,
        location: formData.hotelLocation,
        description: formData.hotelDescription,
        capacity: formData.hotelCapacity,
        base_price_per_night: price,
        images: uploadedImageUrls
      }

      // Determine if this is a create or update operation
      const method = get().profileData ? 'PUT' : 'POST'
      const endpoint = `${API_URL}/hotels/manager/profile`
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update hotel profile')
      }

      const updatedData = await response.json()
      
      // Make sure we preserve the token in localStorage
      // This ensures the user stays logged in after profile update
      localStorage.setItem('token', token)
      
      set({
        profileData: updatedData,
        hotelName: updatedData.name,
        hotelLocation: updatedData.location,
        hotelDescription: updatedData.description,
        hotelCapacity: updatedData.capacity,
        // Format price to maintain decimal precision
        accommodationCosts: updatedData.base_price_per_night ? parseFloat(updatedData.base_price_per_night).toFixed(2) : "",
        hotelImages: updatedData.images || [],
      })

      toast.success('Hotel profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update hotel profile')
      set({ error: error.message })
    } finally {
      set({ isSubmitting: false, isUploading: false })
    }
  }
}))