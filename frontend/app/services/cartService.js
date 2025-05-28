import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

// Create axios instance with auth token
const api = axios.create({
  baseURL: API_BASE_URL,
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const cartService = {
  // Get active cart
  async getActiveCart() {
    try {
      const response = await api.get('/cart')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cart')
    }
  },

  // Add booking to cart
  async addToCart(bookingData) {
    try {
      const response = await api.post('/cart/add', bookingData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add to cart')
    }
  },

  // Remove booking from cart
  async removeFromCart(bookingId) {
    try {
      const response = await api.delete(`/cart/remove/${bookingId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove from cart')
    }
  },

  // Checkout cart
  async checkoutCart(paymentData) {
    try {
      const response = await api.post('/cart/checkout', paymentData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Checkout failed')
    }
  },

  // Clear cart
  async clearCart() {
    try {
      const response = await api.delete('/cart/clear')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to clear cart')
    }
  }
}
