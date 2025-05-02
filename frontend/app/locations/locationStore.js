import { create } from "zustand"
const API_URL = process.env.NEXT_PUBLIC_API_URL

const useLocationStore = create((set) => ({
  locations: [],
  searchTerm: "",
  loading: false,
  error: null,
  setSearchTerm: (term) => set({ searchTerm: term }),
  fetchLocations: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${API_URL}/destinations`)
      if (!res.ok) throw new Error("Failed to fetch destinations")
      const data = await res.json()
      set({
        locations: data.map(loc => ({
          ...loc,
          image: loc.image_url,
        })),
        loading: false,
      })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },
}))

export default useLocationStore