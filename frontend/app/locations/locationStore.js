import { create } from "zustand"
import { destinationsService, apiUtils } from '@/app/services/api'

const useLocationStore = create((set) => ({
  locations: [],
  searchTerm: "",
  loading: false,
  error: null,
  setSearchTerm: (term) => set({ searchTerm: term }),
  fetchLocations: async () => {
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await destinationsService.getAllDestinations()
        const formattedData = data.map(loc => ({
          ...loc,
          image: loc.image_url,
        }))
        set({ locations: formattedData })
        return formattedData
      },
      {
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        onError: (error) => console.error('Error fetching locations:', error)
      }
    )
  },
}))

export default useLocationStore