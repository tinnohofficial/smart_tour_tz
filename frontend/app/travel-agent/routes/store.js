"use client"

import { create } from "zustand"
import { toast } from "sonner"
import { travelAgentService, transportService, apiUtils } from "@/app/services/api"
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/app/constants"

export const useRoutesStore = create((set, get) => ({
  routes: [],
  isLoading: false,
  error: null,

  fetchRoutes: async () => {
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await travelAgentService.getProfile()
        set({ routes: data.routes || [] })
        return data.routes || []
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: () => toast.error('Failed to load transport routes')
      }
    )
  },

  createRoute: async (routeData) => {
    return apiUtils.withLoadingAndError(
      async () => {
        await transportService.createRoute(routeData)
        await get().fetchRoutes() // Refresh the routes list
        toast.success(SUCCESS_MESSAGES.ROUTE_CREATED)
        return true
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: (error, message) => {
          console.error('Error creating transport route:', error)
          toast.error(message)
        }
      }
    )
  },

  updateRoute: async (routeId, routeData) => {
    return apiUtils.withLoadingAndError(
      async () => {
        await transportService.updateRoute(routeId, routeData)
        await get().fetchRoutes() // Refresh the routes list
        toast.success(SUCCESS_MESSAGES.ROUTE_UPDATED)
        return true
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: (error, message) => {
          console.error('Error updating transport route:', error)
          toast.error(message)
        }
      }
    )
  },

  deleteRoute: async (routeId) => {
    return apiUtils.withLoadingAndError(
      async () => {
        await transportService.deleteRoute(routeId)
        await get().fetchRoutes() // Refresh the routes list
        toast.success(SUCCESS_MESSAGES.ROUTE_DELETED)
        return true
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: (error, message) => {
          console.error('Error deleting transport route:', error)
          toast.error(message)
        }
      }
    )
  }
}))