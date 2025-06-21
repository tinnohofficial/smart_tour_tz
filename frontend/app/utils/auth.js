// Auth utility functions for token and session management

/**
 * Get authentication token from either localStorage (persistent) or sessionStorage (session-only)
 * @returns {string|null} The authentication token or null if not found
 */
export const getAuthToken = () => {
  // Check localStorage first (persistent login)
  const persistentToken = localStorage.getItem("token");
  if (persistentToken) {
    return persistentToken;
  }

  // Check sessionStorage (session-only login)
  const sessionToken = sessionStorage.getItem("token");
  if (sessionToken) {
    return sessionToken;
  }

  return null;
};

/**
 * Get user data from either localStorage (persistent) or sessionStorage (session-only)
 * @returns {object|null} The user data object or null if not found
 */
export const getUserData = () => {
  // Check localStorage first (persistent login)
  const persistentUserData = localStorage.getItem("userData");
  if (persistentUserData) {
    try {
      return JSON.parse(persistentUserData);
    } catch (error) {
      console.error("Error parsing persistent user data:", error);
    }
  }

  // Check sessionStorage (session-only login)
  const sessionUserData = sessionStorage.getItem("userData");
  if (sessionUserData) {
    try {
      return JSON.parse(sessionUserData);
    } catch (error) {
      console.error("Error parsing session user data:", error);
    }
  }

  return null;
};

/**
 * Get login timestamp from either localStorage or sessionStorage
 * @returns {string|null} The login timestamp or null if not found
 */
export const getLoginTimestamp = () => {
  // Check localStorage first (persistent login)
  const persistentTimestamp = localStorage.getItem("loginTimestamp");
  if (persistentTimestamp) {
    return persistentTimestamp;
  }

  // Check sessionStorage (session-only login)
  const sessionTimestamp = sessionStorage.getItem("loginTimestamp");
  if (sessionTimestamp) {
    return sessionTimestamp;
  }

  return null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token and data, false otherwise
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  const userData = getUserData();

  return !!(token && userData);
};

/**
 * Check if the current login is set to be remembered
 * @returns {boolean} True if remember me is enabled, false otherwise
 */
export const isRemembered = () => {
  return localStorage.getItem("rememberMe") === "true";
};

/**
 * Clear all authentication data from both localStorage and sessionStorage
 */
export const clearAuthData = () => {
  // Clear from localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("userData");
  localStorage.removeItem("loginTimestamp");
  localStorage.removeItem("rememberMe");

  // Clear from sessionStorage
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("userData");
  sessionStorage.removeItem("loginTimestamp");
};

/**
 * Store authentication data based on remember me preference
 * @param {string} token - The authentication token
 * @param {object} userData - The user data object
 * @param {boolean} rememberMe - Whether to persist the login
 */
export const storeAuthData = (token, userData, rememberMe = false) => {
  const timestamp = new Date().getTime().toString();

  if (rememberMe) {
    // Store in localStorage for persistent login
    localStorage.setItem("token", token);
    localStorage.setItem("userData", JSON.stringify(userData));
    localStorage.setItem("loginTimestamp", timestamp);
    localStorage.setItem("rememberMe", "true");

    // Clear any session data
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userData");
    sessionStorage.removeItem("loginTimestamp");
  } else {
    // Store in sessionStorage for session-only login
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("userData", JSON.stringify(userData));
    sessionStorage.setItem("loginTimestamp", timestamp);

    // Clear any persistent data
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    localStorage.removeItem("loginTimestamp");
    localStorage.removeItem("rememberMe");
  }
};
