const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Utility function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

// Generic API request handler
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const config = {
    headers: getAuthHeaders(),
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  }

  const response = await fetch(url, config)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }))
    const error = new Error(errorData.message || `HTTP ${response.status}`)
    error.response = { status: response.status, data: errorData }
    throw error
  }

  return response.json()
}

// API Utils for common patterns
export const apiUtils = {
  async withLoadingAndError(
    asyncFn,
    {
      setLoading = () => {},
      setError = () => {},
      onSuccess = () => {},
      onError = () => {},
      onFinally = () => {}
    } = {}
  ) {
    try {
      setLoading(true)
      setError(null)
      const result = await asyncFn()
      onSuccess(result)
      return result
    } catch (error) {
      console.error('API Error:', error)
      setError(error.message)
      onError(error, error.message)
      throw error
    } finally {
      setLoading(false)
      onFinally()
    }
  },

  handleAuthError(error, router) {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userData')
      router.push('/login')
    }
  }
}

// Authentication Service
export const authService = {
  async login(credentials) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
  },

  async register(userData) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  },

  async getUserStatus() {
    return apiRequest('/auth/status')
  },

  async changePassword(passwordData) {
    return apiRequest('/users/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData)
    })
  }
}

// Hotel Manager Service
export const hotelManagerService = {
  async getProfile() {
    return apiRequest('/hotels/manager/profile')
  },

  async createProfile(profileData) {
    return apiRequest('/hotels/manager/profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    })
  },

  async updateProfile(profileData) {
    return apiRequest('/hotels/manager/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  }
}

// Travel Agent Service
export const travelAgentService = {
  async getProfile() {
    return apiRequest('/travel-agents/profile')
  },

  async createProfile(profileData) {
    return apiRequest('/travel-agents/profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    })
  },

  async updateProfile(profileData) {
    return apiRequest('/travel-agents/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  }
}

// Tour Guide Service
export const tourGuideService = {
  async getProfile() {
    return apiRequest('/tour-guides/profile')
  },

  async createProfile(profileData) {
    return apiRequest('/tour-guides/profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    })
  },

  async updateProfile(profileData) {
    return apiRequest('/tour-guides/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  },

  async updateAvailability(available) {
    return apiRequest('/tour-guides/availability', {
      method: 'PATCH',
      body: JSON.stringify({ available })
    })
  }
}

// Destinations Service
export const destinationsService = {
  async getAllDestinations() {
    return apiRequest('/destinations')
  },

  async getDestinationById(id) {
    return apiRequest(`/destinations/${id}`)
  },

  async createDestination(destinationData) {
    return apiRequest('/destinations', {
      method: 'POST',
      body: JSON.stringify(destinationData)
    })
  },

  async updateDestination(id, destinationData) {
    return apiRequest(`/destinations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(destinationData)
    })
  },

  async deleteDestination(id) {
    return apiRequest(`/destinations/${id}`, {
      method: 'DELETE'
    })
  }
}

// Activities Service
export const activitiesService = {
  async getAllActivities() {
    return apiRequest('/activities')
  },

  async getActivitiesByDestination(destinationId) {
    return apiRequest(`/activities?destinationId=${destinationId}`)
  },

  async getActivitiesWithScheduling(destinationId) {
    const query = destinationId ? `?destinationId=${destinationId}` : '';
    return apiRequest(`/activities/scheduling${query}`)
  },

  async getActivityAvailability(activityId, date, timeSlot) {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (timeSlot) params.append('time_slot', timeSlot);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/activities/${activityId}/availability${query}`)
  },

  async getActivityById(id) {
    return apiRequest(`/activities/${id}`)
  },

  async createActivity(activityData) {
    return apiRequest('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData)
    })
  },

  async updateActivity(id, activityData) {
    return apiRequest(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(activityData)
    })
  },

  async deleteActivity(id) {
    return apiRequest(`/activities/${id}`, {
      method: 'DELETE'
    })
  }
}

// Bookings Service
export const bookingsService = {
  async getUnassignedBookings() {
    return apiRequest('/bookings/unassigned-bookings')
  },

  async getEligibleGuides(bookingId) {
    return apiRequest(`/bookings/${bookingId}/eligible-guides`)
  },

  async assignGuide(bookingId, guideId) {
    return apiRequest(`/bookings/${bookingId}/assign-guide`, {
      method: 'POST',
      body: JSON.stringify({ guide_id: guideId })
    })
  },

  async getTourGuideAssignedBookings() {
    return apiRequest('/bookings/tour-guide-assigned')
  }
}

// Enhanced Bookings Service
export const enhancedBookingsService = {
  async getPendingBookings() {
    return apiRequest('/bookings/transport-bookings-pending')
  },

  async getCompletedBookings() {
    return apiRequest('/bookings/transport-bookings-completed')
  },

  async assignTransportTicket(itemId, ticketDetails) {
    return apiRequest(`/bookings/items/${itemId}/assign-ticket`, {
      method: 'POST',
      body: JSON.stringify(ticketDetails)
    })
  }
}

// Hotel Bookings Service
export const hotelBookingsService = {
  async getPendingBookings() {
    return apiRequest('/bookings/hotel-bookings-pending')
  },

  async getCompletedBookings() {
    return apiRequest('/bookings/hotel-bookings-completed')
  },

  async confirmRoom(itemId, roomDetails) {
    return apiRequest(`/bookings/items/${itemId}/confirm-room`, {
      method: 'POST',
      body: JSON.stringify(roomDetails)
    })
  }
}

// Transport Service
export const transportService = {
  async getAllRoutes() {
    return apiRequest('/transports')
  },

  async getRouteById(routeId) {
    return apiRequest(`/transports/${routeId}`)
  },

  async createRoute(routeData) {
    return apiRequest('/transports', {
      method: 'POST',
      body: JSON.stringify(routeData)
    })
  },

  async updateRoute(routeId, routeData) {
    return apiRequest(`/transports/${routeId}`, {
      method: 'PUT',
      body: JSON.stringify(routeData)
    })
  },

  async deleteRoute(routeId) {
    return apiRequest(`/transports/${routeId}`, {
      method: 'DELETE'
    })
  }
}

// Applications Service
export const applicationsService = {
  async getPendingApplications() {
    return apiRequest('/applications/pending')
  },

  async getApplicationStatus(userId) {
    return apiRequest(`/applications/${userId}/status`)
  },

  async approveApplication(userId) {
    return apiRequest(`/applications/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ newStatus: 'active' })
    })
  },

  async rejectApplication(userId) {
    return apiRequest(`/applications/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ newStatus: 'rejected' })
    })
  }
}

// Upload Service
export const uploadService = {
  async uploadFile(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload-url', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(errorData.message || 'Upload failed')
    }

    return response.json()
  },

  async uploadDocument(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload-url', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Document upload failed' }))
      throw new Error(errorData.message || 'Document upload failed')
    }

    return response.json()
  }
}

// Password Service
export const passwordService = {
  async changePassword(currentPassword, newPassword) {
    return apiRequest('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    })
  }
}

// Enhanced Booking Creation Service
export const bookingCreationService = {
  async createFlexibleBooking(bookingData) {
    return apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    })
  },

  async processPayment(bookingId, paymentData) {
    return apiRequest(`/bookings/${bookingId}/pay`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    })
  },

  async getUserBookings() {
    return apiRequest('/bookings/my-bookings')
  }
}