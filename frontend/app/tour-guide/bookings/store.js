import { create } from "zustand"

// Mock tours data
const mockTours = [
    {
      id: "t1001",
      destination: "Serengeti National Park",
      startDate: "2023-08-15",
      endDate: "2023-08-18",
      status: "upcoming",
      touristCount: 4,
      touristNames: ["John Smith", "Sarah Johnson", "Michael Brown", "Emily Davis"],
      image: "/placeholder.svg?height=80&width=120",
      paymentStatus: "paid",
      amount: 1200,
    },
    {
      id: "t1002",
      destination: "Mount Kilimanjaro",
      startDate: "2023-09-05",
      endDate: "2023-09-12",
      status: "upcoming",
      touristCount: 2,
      touristNames: ["Robert Wilson", "Jennifer Lee"],
      image: "/placeholder.svg?height=80&width=120",
      paymentStatus: "pending",
      amount: 1800,
    },
    {
      id: "t1003",
      destination: "Ngorongoro Conservation Area",
      startDate: "2023-07-10",
      endDate: "2023-07-15",
      status: "completed",
      touristCount: 3,
      touristNames: ["David Johnson", "Lisa Brown", "Mark Davis"],
      image: "/placeholder.svg?height=80&width=120",
      paymentStatus: "paid",
      amount: 1500,
      rating: 4.8,
    },
    {
      id: "t1004",
      destination: "Zanzibar Beach Tour",
      startDate: "2023-06-20",
      endDate: "2023-06-25",
      status: "completed",
      touristCount: 2,
      touristNames: ["Thomas Wilson", "Amanda Lee"],
      image: "/placeholder.svg?height=80&width=120",
      paymentStatus: "paid",
      amount: 1100,
      rating: 5.0,
    },
  ]
  

export const useBookingsStore = create((set) => ({
  tours: mockTours,
  isLoading: true,
  searchQuery: "",
  statusFilter: "all",
  setTours: (tours) => set({ tours }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  fetchTours: async () => {
    set({ isLoading: true })
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    set({ tours: mockTours, isLoading: false })
  },
}))