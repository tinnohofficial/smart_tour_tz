"use client"

import { create } from 'zustand'
import { toast } from 'sonner'
import { travelAgentService, apiUtils } from '@/app/services/api'
import { SUCCESS_MESSAGES, USER_STATUS } from '@/app/constants'

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
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await travelAgentService.getProfile()
        set({
          profileData: data,
          name: data.name || "",
          routes: data.routes || [],
          documentUrl: data.document_url ? 
            (Array.isArray(data.document_url) ? data.document_url : [data.document_url]) : 
            [],
          isApproved: data.status === USER_STATUS.ACTIVE
        })
        return data
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: (error) => {
          // Handle 404 as profile not created yet
          if (error.response?.status === 404) {
            set({ profileData: null, error: null })
          } else {
            console.error("Failed to fetch profile:", error)
            toast.error("Failed to load profile data")
          }
        }
      }
    )
  },

  updateProfile: async (formData = {}) => {
    set({ isSubmitting: true, error: null })
    
    try {
      const { uploadService } = await import('@/app/services/api')
      
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
            const { url } = await uploadService.uploadDocument(docFile)
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

      // Use appropriate service method based on whether profile exists
      const isUpdate = !!get().profileData
      const responseData = isUpdate 
        ? await travelAgentService.updateProfile(data)
        : await travelAgentService.createProfile(data)

      set({
        profileData: responseData,
        documentUrl: uploadedDocUrls
      })

      const successMessage = isUpdate 
        ? SUCCESS_MESSAGES.PROFILE_UPDATED 
        : SUCCESS_MESSAGES.PROFILE_CREATED
      
      toast.success(successMessage, {
        description: isUpdate 
          ? 'Your profile has been updated.' 
          : 'Your profile is now pending approval by the administrator.',
      })
      
      return true
    } catch (error) {
      console.error('Error updating profile:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save profile'
      set({ error: errorMessage })
      toast.error('Error saving profile', {
        description: errorMessage,
      })
      return false
    } finally {
      set({ isSubmitting: false })
    }
  }
}))