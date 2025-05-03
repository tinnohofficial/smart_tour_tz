import { create } from 'zustand'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const useTravelAgentProfileStore = create((set, get) => ({
  // State
  companyName: "",
  travelRoutes: "",
  legalDocuments: [],
  isSubmitting: false,
  isSaved: false,
  isUploading: false,
  fetchedProfileData: null,

  // Actions
  setCompanyName: (companyName) => set({ companyName }),
  setTravelRoutes: (travelRoutes) => set({ travelRoutes }),
  setLegalDocuments: (legalDocuments) => set({ legalDocuments }),
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

      const response = await fetch(`${API_URL}/travel-agents/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const profileData = await response.json()
        set({
          companyName: profileData.company_name || "",
          travelRoutes: profileData.travel_routes || "",
          legalDocuments: profileData.legal_documents || [],
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
      // Upload any new documents first
      set({ isUploading: true })
      const uploadedDocUrls = []
      
      for (const docFile of state.legalDocuments) {
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
            toast.error(`Failed to upload document: ${docFile.name}`)
            set({ isSubmitting: false, isUploading: false })
            return
          }
        } else {
          uploadedDocUrls.push(docFile) // Keep existing URLs
        }
      }

      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Authentication Error: You must be logged in.')
        set({ isSubmitting: false })
        return
      }

      // Prepare data for submission
      const profileData = {
        company_name: state.companyName,
        travel_routes: state.travelRoutes,
        legal_documents: uploadedDocUrls
      }

      const method = state.isSaved ? 'PUT' : 'POST'
      const response = await fetch(`${API_URL}/travel-agents/profile`, {
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
        legalDocuments: uploadedDocUrls // Update with new URLs
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
    if (!state.companyName && !state.travelRoutes && state.legalDocuments.length === 0) {
      toast.error("Please fill in at least one field to save progress")
      return
    }
    
    // Save current state to localStorage
    const draft = {
      companyName: state.companyName,
      travelRoutes: state.travelRoutes,
      legalDocuments: state.legalDocuments.filter(doc => !(doc instanceof File)) // Only save URLs, not files
    }
    
    localStorage.setItem('travelAgentProfileDraft', JSON.stringify(draft))
    toast.success("Progress saved locally")
  },

  resetForm: () => set({
    companyName: "",
    travelRoutes: "",
    legalDocuments: [],
    isSubmitting: false,
    isSaved: false,
    isUploading: false
  })
}))