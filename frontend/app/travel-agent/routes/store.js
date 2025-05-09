"use client"

import { create } from "zustand"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const useRoutesStore = create((set, get) => ({
  routes: [],
  isLoading: false,
  error: null,

  fetchRoutes: async () => {
    try {
      set({ isLoading: true })
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // First get the agency profile to get routes
      const response = await fetch(`${API_URL}/travel-agents/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch agency profile')
      }

      const data = await response.json()
      
      set({ 
        routes: data.routes || [],
        isLoading: false 
      })
    } catch (error) {
      console.error('Error fetching routes:', error)
      toast.error('Failed to load transport routes')
      set({ isLoading: false, error: error.message })
    }
  },

  createRoute: async (routeData) => {
    try {
      set({ isLoading: true })
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_URL}/transports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(routeData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to create transport route')
      }

      // After successful creation, refresh the routes list
      await get().fetchRoutes()
      
      set({ isLoading: false })
      return true
    } catch (error) {
      console.error('Error creating transport route:', error)
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  updateRoute: async (routeId, routeData) => {
    try {
      set({ isLoading: true })
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_URL}/transports/${routeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(routeData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to update transport route')
      }

      // After successful update, refresh the routes list
      await get().fetchRoutes()
      
      set({ isLoading: false })
      return true
    } catch (error) {
      console.error('Error updating transport route:', error)
      set({ isLoading: false, error: error.message })
      throw error
    }
  },

  deleteRoute: async (routeId) => {
    try {
      set({ isLoading: true })
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`${API_URL}/transports/${routeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to delete transport route')
      }

      // After successful deletion, refresh the routes list
      await get().fetchRoutes()
      
      set({ isLoading: false })
      return true
    } catch (error) {
      console.error('Error deleting transport route:', error)
      set({ isLoading: false, error: error.message })
      throw error
    }
  }
}))