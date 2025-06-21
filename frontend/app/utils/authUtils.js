/**
 * Authentication utility functions
 */

/**
 * Clear all authentication data from localStorage
 */
export const clearAuthData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('loginTimestamp');
    localStorage.removeItem('smart-tour-cart'); // Clear cart data too
    console.log('Authentication data cleared');
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');

  return !!(token && userData);
};

/**
 * Get user data from localStorage
 */
export const getUserData = () => {
  if (typeof window === 'undefined') return null;

  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Check if current user has a specific role
 */
export const hasRole = (role) => {
  const userData = getUserData();
  return userData?.role === role;
};

/**
 * Check if current user is a tourist
 */
export const isTourist = () => hasRole('tourist');

/**
 * Handle authentication errors and redirect to login
 */
export const handleAuthError = (error, router = null) => {
  console.error('Authentication error:', error);

  // Check if it's an auth-related error
  const isAuthError =
    error?.response?.status === 401 ||
    error?.response?.status === 403 ||
    error?.response?.data?.requiresReauth ||
    error?.message?.includes('log in again');

  if (isAuthError) {
    clearAuthData();

    if (router) {
      router.push('/login');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }

    return true; // Indicates auth error was handled
  }

  return false; // Not an auth error
};

/**
 * Validate token freshness (optional - for future use)
 */
export const isTokenFresh = () => {
  if (typeof window === 'undefined') return false;

  const loginTimestamp = localStorage.getItem('loginTimestamp');
  if (!loginTimestamp) return false;

  const now = Date.now();
  const tokenAge = now - parseInt(loginTimestamp);
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  return tokenAge < maxAge;
};

/**
 * Force logout user
 */
export const logout = (router = null) => {
  clearAuthData();

  if (router) {
    router.push('/login');
  } else if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

/**
 * Refresh authentication check - useful for checking if user still exists
 */
export const validateAuthStatus = async () => {
  if (!isAuthenticated()) {
    return { valid: false, reason: 'Not authenticated' };
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/refresh-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();

      // Update token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));

      return { valid: true, user: data.user };
    } else if (response.status === 401 || response.status === 403) {
      return { valid: false, reason: 'Token invalid' };
    } else {
      return { valid: false, reason: 'Validation failed' };
    }
  } catch (error) {
    console.error('Auth validation error:', error);
    return { valid: false, reason: 'Network error' };
  }
};
