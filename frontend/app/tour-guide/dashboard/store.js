import { create } from "zustand"

const mockUserData = {
  id: "tg123456",
  name: "Michael Safari",
  email: "michael.safari@example.com",
  phone: "+255 987 654 321",
  profileImage: "/placeholder.svg?height=100&width=100",
  joinedDate: "March 2022",
  location: "Arusha, Tanzania",
  expertise: ["Wildlife", "Photography", "Hiking", "Cultural Tours"],
  rating: 4.8,
  reviewCount: 124,
  isAvailable: true,
}

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
  },
]

const mockEarnings = {
  currentMonth: 1250,
  lastMonth: 1800,
  pending: 750,
  total: 12500,
}

export const useDashboardStore = create((set) => ({
  userData: null,
  tours: [],
  earnings: null,
  isLoading: true,
  isAvailable: false,
  setUserData: (userData) => set({ userData }),
  setTours: (tours) => set({ tours }),
  setEarnings: (earnings) => set({ earnings }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsAvailable: (isAvailable) => set({ isAvailable }),
  fetchDashboard: async () => {
    set({ isLoading: true })
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    set({
      userData: mockUserData,
      tours: mockTours,
      earnings: mockEarnings,
      isAvailable: mockUserData.isAvailable,
      isLoading: false,
    })
  },
}))