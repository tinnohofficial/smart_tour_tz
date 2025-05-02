import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL


// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Check if localStorage is available (for server-side rendering safety)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("token")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)


// Authentication services
export const authService = {
  login: async (email, password) => { 
    const response = await api.post("/auth/login", { email, password })
    if (response.data.token && typeof window !== 'undefined') {
      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.user))
    }
    return response.data
  },
  logout: () => {
    if (typeof window !== 'undefined') { 
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  },
  getCurrentUser: () => {
    if (typeof window !== 'undefined') { 
      const userStr = localStorage.getItem("user")
      if (userStr) return JSON.parse(userStr)
    }
    return null
  },
}

// Applications services
export const applicationsService = {
  getPendingApplications: async () => {
    const response = await api.get("/applications/pending")
    return response.data
  },
  approveApplication: async (userId) => { 
    const response = await api.patch(`/applications/${userId}/status`, { newStatus: "active" })
    return response.data
  },
  rejectApplication: async (userId) => { 
    const response = await api.patch(`/applications/${userId}/status`, { newStatus: "rejected" })
    return response.data
  },
}

// Destinations services
export const destinationsService = {
  getAllDestinations: async () => {
    const response = await api.get("/destinations")
    return response.data
  },
  getDestinationById: async (id) => { 
    const response = await api.get(`/destinations/${id}`)
    return response.data
  },
  createDestination: async (destinationData) => {
    const response = await api.post("/destinations", destinationData)
    return response.data
  },
  updateDestination: async (id, destinationData) => { 
    const response = await api.put(`/destinations/${id}`, destinationData)
    return response.data
  },
  deleteDestination: async (id) => {
    const response = await api.delete(`/destinations/${id}`)
    return response.data
  },
}

// Activities services
export const activitiesService = {
  getAllActivities: async () => {
    const response = await api.get("/activities")
    return response.data
  },
  getActivitiesByDestination: async (destinationId) => { 
    const response = await api.get(`/activities?destinationId=${destinationId}`)
    return response.data
  },
  getActivityById: async (id) => { 
    const response = await api.get(`/activities/${id}`)
    return response.data
  },
  createActivity: async (activityData) => { 
    const response = await api.post("/activities", activityData)
    return response.data
  },
  updateActivity: async (id, activityData) => { 
    const response = await api.put(`/activities/${id}`, activityData)
    return response.data
  },
  deleteActivity: async (id) => { 
    const response = await api.delete(`/activities/${id}`)
    return response.data
  },
}

// Bookings and assignments services
export const bookingsService = {
  getUnassignedBookings: async () => {
    const response = await api.get("/bookings/unassigned-bookings")
    return response.data
  },
  getEligibleGuides: async (bookingId) => { 
    const response = await api.get(`/bookings/${bookingId}/eligible-guides`)
    return response.data
  },
  assignGuide: async (bookingId, guideId) => { 
    const response = await api.post(`/bookings/${bookingId}/assign-guide`, { guideId })
    return response.data
  },
}



export default api