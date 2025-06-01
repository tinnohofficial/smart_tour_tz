// API endpoints constants
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: "/users/login",
  CHANGE_PASSWORD: "/users/password",

  // User profiles
  TRAVEL_AGENT_PROFILE: "/travel-agents/profile",
  HOTEL_MANAGER_PROFILE: "/hotels/manager/profile",
  TOUR_GUIDE_PROFILE: "/tour-guides/profile",

  // Applications
  PENDING_APPLICATIONS: "/applications/pending",
  APPLICATION_STATUS: (userId) => `/applications/${userId}/status`,

  // Destinations and activities
  DESTINATIONS: "/destinations",
  DESTINATION_BY_ID: (id) => `/destinations/${id}`,
  ACTIVITIES: "/activities",
  ACTIVITIES_BY_DESTINATION: (destinationId) =>
    `/activities?destinationId=${destinationId}`,
  ACTIVITY_BY_ID: (id) => `/activities/${id}`,

  // Bookings
  UNASSIGNED_BOOKINGS: "/bookings/unassigned-bookings",
  ELIGIBLE_GUIDES: (bookingId) => `/bookings/${bookingId}/eligible-guides`,
  ASSIGN_GUIDE: (bookingId) => `/bookings/${bookingId}/assign-guide`,
  TRANSPORT_BOOKINGS_PENDING: "/bookings/transport-bookings-pending",
  TRANSPORT_BOOKINGS_COMPLETED: "/bookings/transport-bookings-completed",
  HOTEL_BOOKINGS_PENDING: "/bookings/hotel-bookings-pending",
  HOTEL_BOOKINGS_COMPLETED: "/bookings/hotel-bookings-completed",
  ASSIGN_TICKET: (itemId) => `/bookings/items/${itemId}/assign-ticket`,

  // Transport routes
  TRANSPORTS: "/transports",
  TRANSPORT_BY_ID: (routeId) => `/transports/${routeId}`,
};

// User status constants
export const USER_STATUS = {
  PENDING_PROFILE: "pending_profile",
  PENDING_APPROVAL: "pending_approval",
  ACTIVE: "active",
  REJECTED: "rejected",
  INACTIVE: "inactive",
};

// Booking status constants
export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  IN_PROGRESS: "in_progress",
};

// Application status constants
export const APPLICATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  ACTIVE: "active",
};

// Common form validation constants
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PHONE_REGEX: /^\+255\d{9}$/,
  REQUIRED_FIELD_MESSAGE: "This field is required",
  INVALID_EMAIL_MESSAGE: "Please enter a valid email address",
  PASSWORD_MIN_LENGTH_MESSAGE: "Password must be at least 8 characters long",
  INVALID_PHONE_MESSAGE:
    "Please enter a valid Tanzanian phone number (+255XXXXXXXXX)",
};

// Common UI constants
export const UI_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 10,
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  LOADING_SPINNER_DELAY: 200,
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN:
    "Access denied. Please contact support if you believe this is an error.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "An unexpected error occurred. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
  TOKEN_EXPIRED: "Your session has expired. Please log in again.",
  GENERIC_ERROR: "An error occurred. Please try again.",
  PROFILE_LOAD_ERROR: "Failed to load profile data",
  PROFILE_LOAD_FAILED: "Failed to load profile data",
  PROFILE_UPDATE_ERROR: "Failed to update profile",
  PROFILE_SAVE_FAILED: "Failed to save profile",
  BOOKINGS_LOAD_ERROR: "Failed to load bookings",
  ROOM_CONFIRM_ERROR: "Failed to confirm room",
};

// Validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELDS:
    "Required fields missing: name, location, description, capacity, and base_price_per_night are required",
  REQUIRED_FIELDS_PARTIAL: "Please fill in at least one field to save progress",
};

// Success messages
export const SUCCESS_MESSAGES = {
  PASSWORD_CHANGED: "Password changed successfully",
  PROFILE_UPDATED: "Profile updated successfully",
  PROFILE_CREATED: "Profile created successfully",
  PROFILE_SAVED: "Profile saved successfully!",
  PROFILE_UPDATE_SUCCESS: "Hotel profile updated successfully",
  PROGRESS_SAVED: "Progress saved locally",
  BOOKING_ASSIGNED: "Booking assigned successfully",
  TICKET_ASSIGNED: "Ticket assigned successfully",
  ROOM_CONFIRM_SUCCESS: "Room confirmed successfully",
  ROUTE_CREATED: "Transport route created successfully",
  ROUTE_UPDATED: "Transport route updated successfully",
  ROUTE_DELETED: "Transport route deleted successfully",
  DESTINATION_DELETED: "Destination deleted successfully",
  APPLICATION_APPROVED: "Application approved successfully",
  APPLICATION_REJECTED: "Application rejected successfully",
};

// Routes for navigation
export const ROUTES = {
  LOGIN: "/login",
  HOME: "/",

  // Hotel manager routes
  HOTEL_MANAGER: {
    DASHBOARD: "/hotel-manager/dashboard",
    PROFILE: "/hotel-manager/profile",
    BOOKINGS: "/hotel-manager/bookings",
    PASSWORD: "/hotel-manager/password",
  },

  // Tour guide routes
  TOUR_GUIDE: {
    DASHBOARD: "/tour-guide/dashboard",
    PROFILE: "/tour-guide/profile",
    BOOKINGS: "/tour-guide/bookings",
    PASSWORD: "/tour-guide/password",
  },

  // Travel agent routes
  TRAVEL_AGENT: {
    DASHBOARD: "/travel-agent/dashboard",
    PROFILE: "/travel-agent/profile",
    BOOKINGS: "/travel-agent/bookings",
    ROUTES: "/travel-agent/routes",
    PASSWORD: "/travel-agent/password",
  },

  // Admin routes
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    DESTINATIONS: "/admin/destinations",
    ACTIVITIES: "/admin/activities",
    APPLICATIONS: "/admin/applications",
  },
};
