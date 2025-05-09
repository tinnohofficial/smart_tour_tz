"use client"

import { create } from 'zustand'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const useProfileStore = create((set, get) => ({
  // State
  profileData: null,
  name: "",
  routes: [],
  documentUrl: [],
  isLoading: false,
  isSubmitting: false,
  isUploading: false,
  error: null,
  isApproved: false,

  // Actions
  setName: (name) => set({ name }),
  setRoutes: (routes) => set({ routes }),
  setDocumentUrl: (documentUrl) => set({ documentUrl }),
  addRoute: (route) => set(state => ({ routes: [...state.routes, route] })),
  updateRoute: (index, updatedRoute) => set(state => ({
    routes: state.routes.map((route, i) => i === index ? updatedRoute : route)
  })),
  removeRoute: (index) => set(state => ({
    routes: state.routes.filter((_, i) => i !== index)
  })),

  fetchProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication Error: You must be logged in.')
      }

      const response = await fetch(`${API_URL}/travel-agents/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        set({
          profileData: data,
          name: data.name || "",
          routes: data.routes || [],
          documentUrl: data.document_url ? 
            (Array.isArray(data.document_url) ? data.document_url : [data.document_url]) : 
            [],
          isApproved: data.status === 'active'
        })
      } else if (response.status === 404) {
        // Profile not yet created
        set({ profileData: null })
      } else {
        throw new Error('Failed to load profile data')
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      set({ error: error.message })
      toast.error("Failed to load profile data")
    } finally {
      set({ isLoading: false })
    }
  },

  updateProfile: async (formData = {}) => {
    set({ isSubmitting: true, error: null })
    try {
      // Use form data if provided, otherwise use state
      const data = {
        name: formData.name || get().name,
        routes: formData.routes || get().routes
      }

      // Handle document uploads
      set({ isUploading: true })
      const uploadedDocUrls = []
      
      for (const docFile of get().documentUrl) {
        if (docFile instanceof File) {
          try {
            const formData = new FormData()
            formData.append("file", docFile)
            
            const response = await fetch("/api/upload-url", {
              method: "POST",
              body: formData,
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || "Failed to upload file")
            }

            const { url } = await response.json()
            uploadedDocUrls.push(url)
          } catch (error) {
            console.error('Upload Error:', error)
            throw new Error(`Failed to upload document: ${docFile.name}`)
          }
        } else {
          uploadedDocUrls.push(docFile) // Keep existing URLs
        }
      }
      set({ isUploading: false })

      data.document_url = uploadedDocUrls

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication Error: You must be logged in.')
      }

      // Check if we should create or update
      const method = get().profileData ? 'PUT' : 'POST'
      const response = await fetch(`${API_URL}/travel-agents/profile`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save profile')
      }

      const responseData = await response.json()
      set({
        profileData: responseData,
        documentUrl: uploadedDocUrls // Update with new URLs
      })

      toast.success('Profile saved successfully!', {
        description: get().profileData ? 'Your profile has been updated.' : 'Your profile is now pending approval by the administrator.',
      })
      
      return true
    } catch (error) {
      console.error('Error updating profile:', error)
      set({ error: error.message })
      toast.error('Error saving profile', {
        description: error.message || 'There was an error saving your profile. Please try again.',
      })
      return false
    } finally {
      set({ isSubmitting: false })
    }
  }
}))