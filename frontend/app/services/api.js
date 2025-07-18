const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "");
import { getUserData, clearAuthData, getAuthToken } from "../utils/auth";

// Utility function to construct full image URLs
export const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http")) return imageUrl; // Already full URL
  if (imageUrl.startsWith("/uploads/")) {
    return `${BACKEND_BASE_URL}${imageUrl}`;
  }
  return imageUrl;
};

// Utility function to get auth headers
const getAuthHeaders = () => {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    return { "Content-Type": "application/json" };
  }

  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Generic API request handler
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: getAuthHeaders(),
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        const text = await response.text().catch(() => "");
        errorMessage = text || errorMessage;
      }

      // Handle authentication errors gracefully
      if (response.status === 401 || response.status === 403) {
        // Clear invalid tokens
        if (typeof window !== "undefined") {
          clearAuthData();
        }

        const error = new Error(errorMessage);
        error.response = { status: response.status };
        error.isAuthError = true;
        throw error;
      }

      const error = new Error(errorMessage);
      error.response = { status: response.status };
      throw error;
    }

    return response.json();
  } catch (error) {
    if (error.response) {
      throw error; // Re-throw HTTP errors
    }
    throw new Error("Network error occurred");
  }
};

// API Utils for common patterns
export const apiUtils = {
  async withLoadingAndError(
    asyncFn,
    {
      setLoading = () => {},
      setError = () => {},
      onSuccess = () => {},
      onError = () => {},
      onFinally = () => {},
    } = {},
  ) {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFn();
      onSuccess(result);
      return result;
    } catch (error) {
      console.error("API Error:", error);
      setError(error.message);
      onError(error, error.message);
      throw error;
    } finally {
      setLoading(false);
      onFinally();
    }
  },

  handleAuthError(error, router) {
    if (
      error.response?.status === 401 ||
      error.response?.status === 403 ||
      error.isAuthError
    ) {
      if (typeof window !== "undefined") {
        clearAuthData();
      }
      if (router) {
        router.push("/login");
      }
    }
  },
};

// Authentication Service
export const authService = {
  async login(credentials) {
    return apiRequest("/users/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  async register(userData) {
    return apiRequest("/users/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  async refreshToken() {
    return apiRequest("/users/refresh-token", {
      method: "POST",
    });
  },

  // getUserStatus removed - endpoint doesn't exist in backend

  async changePassword(passwordData) {
    return apiRequest("/users/password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
  },
};

// Hotel Manager Service
export const hotelManagerService = {
  async getProfile() {
    return apiRequest("/hotels/manager/profile");
  },

  async createProfile(profileData) {
    return apiRequest("/hotels", {
      method: "POST",
      body: JSON.stringify(profileData),
    });
  },

  async updateProfile(profileData) {
    return apiRequest("/hotels/manager/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },
};

// Travel Agent Service
export const travelAgentService = {
  async getProfile() {
    // Get current user's ID from token payload
    if (typeof window === "undefined") {
      throw new Error("Not in browser environment");
    }

    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.id;
    return apiRequest(`/travel-agents/${userId}`);
  },

  async createProfile(profileData) {
    return apiRequest("/travel-agents", {
      method: "POST",
      body: JSON.stringify(profileData),
    });
  },

  async updateProfile(profileData) {
    // Get current user's ID from token payload
    if (typeof window === "undefined") {
      throw new Error("Not in browser environment");
    }

    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.id;

    return apiRequest(`/travel-agents/${userId}`, {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },
};

// Tour Guide Service
export const tourGuideService = {
  async getProfile() {
    return apiRequest("/tour-guides/manager/profile");
  },

  async createProfile(profileData) {
    return apiRequest("/tour-guides", {
      method: "POST",
      body: JSON.stringify(profileData),
    });
  },

  async updateProfile(profileData) {
    return apiRequest("/tour-guides/manager/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  },

  async updateAvailability(available) {
    return apiRequest("/tour-guides/manager/profile", {
      method: "PUT",
      body: JSON.stringify({ available }),
    });
  },
};

// Destinations Service
export const destinationsService = {
  async getAllDestinations() {
    const destinations = await apiRequest("/destinations");
    return destinations.map((dest) => ({
      ...dest,
      image_url: getFullImageUrl(dest.image_url),
    }));
  },

  async getDestinationById(id) {
    const destination = await apiRequest(`/destinations/${id}`);
    return {
      ...destination,
      image_url: getFullImageUrl(destination.image_url),
    };
  },

  async createDestination(destinationData) {
    const destination = await apiRequest("/destinations", {
      method: "POST",
      body: JSON.stringify(destinationData),
    });
    return {
      ...destination,
      image_url: getFullImageUrl(destination.image_url),
    };
  },

  async updateDestination(id, destinationData) {
    const destination = await apiRequest(`/destinations/${id}`, {
      method: "PUT",
      body: JSON.stringify(destinationData),
    });
    return {
      ...destination,
      image_url: getFullImageUrl(destination.image_url),
    };
  },

  async deleteDestination(id) {
    return apiRequest(`/destinations/${id}`, {
      method: "DELETE",
    });
  },
};

// Activities Service
export const activitiesService = {
  async getAllActivities() {
    const response = await apiRequest("/activities");
    return response.activities || [];
  },

  async getActivitiesByDestination(destinationId) {
    const response = await apiRequest(
      `/activities/destination/${destinationId}`,
    );
    return response.activities || [];
  },

  async getActivityById(id) {
    const response = await apiRequest(`/activities/${id}`);
    return response.activity || null;
  },

  async createActivity(activityData) {
    const response = await apiRequest("/activities", {
      method: "POST",
      body: JSON.stringify(activityData),
    });
    return response.activity || null;
  },

  async updateActivity(id, activityData) {
    const response = await apiRequest(`/activities/${id}`, {
      method: "PUT",
      body: JSON.stringify(activityData),
    });
    return response.activity || null;
  },

  async deleteActivity(id) {
    return apiRequest(`/activities/${id}`, {
      method: "DELETE",
    });
  },
};

// Bookings Service
export const bookingsService = {
  async getUnassignedBookings() {
    return apiRequest("/bookings/unassigned-bookings");
  },

  async getEligibleGuides(bookingId) {
    if (!bookingId) throw new Error("Booking ID is required");
    return apiRequest(`/bookings/${bookingId}/eligible-guides`);
  },

  async assignGuide(bookingId, guideId) {
    if (!bookingId || !guideId)
      throw new Error("Booking ID and Guide ID are required");
    return apiRequest(`/bookings/${bookingId}/assign-guide`, {
      method: "POST",
      body: JSON.stringify({ guideId }),
    });
  },

  async getTourGuideAssignedBookings() {
    return apiRequest("/bookings/tour-guide-assigned");
  },

  async getTourGuideBookingDetails(bookingId) {
    if (!bookingId) throw new Error("Booking ID is required");
    return apiRequest(`/bookings/tour-guide-booking/${bookingId}`);
  },
};

// Enhanced Bookings Service
export const enhancedBookingsService = {
  async getPendingBookings() {
    return apiRequest("/bookings/transport-bookings-pending");
  },

  async getCompletedBookings() {
    return apiRequest("/bookings/transport-bookings-completed");
  },

  async assignTransportTicket(itemId, ticketPdfUrl) {
    return apiRequest(`/bookings/items/${itemId}/assign-ticket`, {
      method: "PATCH",
      body: JSON.stringify({ ticketPdfUrl }),
    });
  },
};

// Hotel Bookings Service
export const hotelBookingsService = {
  async getPendingBookings() {
    return apiRequest("/bookings/hotel-bookings-pending");
  },

  async getCompletedBookings() {
    return apiRequest("/bookings/hotel-bookings-completed");
  },

  async confirmRoom(itemId, roomDetails) {
    return apiRequest(`/bookings/items/${itemId}/confirm-room`, {
      method: "PATCH",
      body: JSON.stringify({ roomDetails }),
    });
  },
};

// Transport Service
export const transportService = {
  async getAllRoutes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/transports${queryString ? `?${queryString}` : ""}`);
  },

  async getRouteById(routeId) {
    return apiRequest(`/transports/${routeId}`);
  },

  async getAgencyRoutes() {
    return apiRequest("/transports/my-routes");
  },

  async createRoute(routeData) {
    return apiRequest("/transports", {
      method: "POST",
      body: JSON.stringify(routeData),
    });
  },

  async updateRoute(routeId, routeData) {
    return apiRequest(`/transports/${routeId}`, {
      method: "PUT",
      body: JSON.stringify(routeData),
    });
  },

  async deleteRoute(routeId) {
    return apiRequest(`/transports/${routeId}`, {
      method: "DELETE",
    });
  },
};

// Transport Origins Service
export const transportOriginsService = {
  async getAllOrigins() {
    return apiRequest("/transports/origins");
  },
};

// Applications Service
export const applicationsService = {
  async getPendingApplications() {
    return apiRequest("/applications/pending");
  },

  async getApplicationStatus(userId) {
    return apiRequest(`/applications/${userId}/status`);
  },

  async approveApplication(userId, comments = "") {
    return apiRequest(`/applications/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ newStatus: "active", comments }),
    });
  },

  async rejectApplication(userId, comments = "") {
    return apiRequest(`/applications/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ newStatus: "rejected", comments }),
    });
  },
};

// Upload Service
export const uploadService = {
  async uploadFile(file) {
    if (typeof window === "undefined") {
      throw new Error("File upload not available in server environment");
    }

    const formData = new FormData();
    formData.append("file", file);

    // Get token for authentication
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required for file upload");
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Upload failed" }));
      throw new Error(errorData.message || "Upload failed");
    }

    return response.json();
  },

  // Alias for backward compatibility
  async uploadImage(file) {
    return this.uploadFile(file);
  },

  async uploadDocument(file) {
    if (typeof window === "undefined") {
      throw new Error("Document upload not available in server environment");
    }

    const formData = new FormData();
    formData.append("file", file);

    // Get token for authentication
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required for document upload");
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Document upload failed" }));
      throw new Error(errorData.message || "Document upload failed");
    }

    return response.json();
  },

  async deleteFile(filename) {
    if (typeof window === "undefined") {
      throw new Error("File deletion not available in server environment");
    }

    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required for file deletion");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/upload/${filename}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Delete failed" }));
      throw new Error(errorData.message || "Delete failed");
    }

    return response.json();
  },
};

// Password Service
export const passwordService = {
  async changePassword(currentPassword, newPassword) {
    return apiRequest("/users/password", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
  },
};

// Enhanced Booking Creation Service
export const bookingCreationService = {
  async createFlexibleBooking(bookingData) {
    return apiRequest("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    });
  },

  async processPayment(bookingId, paymentData) {
    return apiRequest(`/bookings/${bookingId}/pay`, {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  },

  async getUserBookings() {
    return apiRequest("/bookings/my-bookings");
  },
};

// // AI Suggestions Service
// export const aiSuggestionsService = {
//   async getTourSuggestions(preferences) {
//     return apiRequest("/ai-suggestions", {
//       method: "POST",
//       body: JSON.stringify(preferences),
//     });
//   },
// };
