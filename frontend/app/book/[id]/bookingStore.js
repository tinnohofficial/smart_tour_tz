// src/store/bookingStore.js
import { create } from 'zustand'
import { destinationsService, transportService, activitiesService, apiUtils } from '@/app/services/api'

// Helper function to calculate nights
const calculateNights = (startDate, endDate) => {
  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = end.getTime() - start.getTime()
    if (diffTime < 0) return 0 // Avoid negative nights
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(1, diffDays) // Minimum 1 night
  }
  return 0
}

export const useBookingStore = create((set, get) => ({
  // State
  step: 1,
  startDate: "",
  endDate: "",
  selectedTransportRoute: "",
  selectedHotel: "",
  selectedActivities: [],
  errors: {},
  agreedToTerms: false,
  paymentMethod: "",
  isPaymentDialogOpen: false,
  savingsBalance: 2000, // Mock savings balance
  
  // API data
  destination: null,
  transportRoutes: [],
  hotels: [],
  activities: [],
  isLoading: {
    destination: false,
    transports: false,
    hotels: false,
    activities: false
  },
  error: {
    destination: null,
    transports: null,
    hotels: null,
    activities: null
  },

  // Data fetching actions
  fetchDestination: async (destinationId) => {
    if (!destinationId) return;
    
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await destinationsService.getDestinationById(destinationId)
        set({ destination: data })
        return data
      },
      {
        setLoading: (loading) => set(state => ({
          isLoading: { ...state.isLoading, destination: loading }
        })),
        setError: (error) => set(state => ({
          error: { ...state.error, destination: error }
        })),
        onError: (error) => {
          console.error('Error fetching destination:', error)
        }
      }
    )
  },

  fetchTransportRoutes: async (originOrDestination) => {
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await transportService.getAllRoutes()
        // Filter routes by origin or destination if provided
        let filteredData = data
        if (originOrDestination) {
          filteredData = data.filter(route => 
            route.origin?.toLowerCase().includes(originOrDestination.toLowerCase()) ||
            route.destination?.toLowerCase().includes(originOrDestination.toLowerCase())
          )
        }
        set({ transportRoutes: filteredData })
        return filteredData
      },
      {
        setLoading: (loading) => set(state => ({
          isLoading: { ...state.isLoading, transports: loading }
        })),
        setError: (error) => set(state => ({
          error: { ...state.error, transports: error }
        })),
        onError: (error) => {
          console.error('Error fetching transport routes:', error)
        }
      }
    )
  },

  fetchHotels: async (location) => {
    return apiUtils.withLoadingAndError(
      async () => {
        // For now, we'll use a mock API call since hotels service isn't in the shared API yet
        // This would be replaced with a proper hotels service call
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hotels${location ? `?location=${encodeURIComponent(location)}` : ''}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch hotels: ${response.statusText}`)
        }
        const data = await response.json()
        set({ hotels: data })
        return data
      },
      {
        setLoading: (loading) => set(state => ({
          isLoading: { ...state.isLoading, hotels: loading }
        })),
        setError: (error) => set(state => ({
          error: { ...state.error, hotels: error }
        })),
        onError: (error) => {
          console.error('Error fetching hotels:', error)
        }
      }
    )
  },

  fetchActivities: async (destinationId) => {
    if (!destinationId) return;
    
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await activitiesService.getActivitiesByDestination(destinationId)
        set({ activities: data })
        return data
      },
      {
        setLoading: (loading) => set(state => ({
          isLoading: { ...state.isLoading, activities: loading }
        })),
        setError: (error) => set(state => ({
          error: { ...state.error, activities: error }
        })),
        onError: (error) => {
          console.error('Error fetching activities:', error)
        }
      }
    )
  },

  // Actions
  setStep: (step) => set({ step }),
  setStartDate: (date) => set({ startDate: date, errors: {} }),
  setEndDate: (date) => set({ endDate: date, errors: {} }),
  setSelectedTransportRoute: (routeId) => set({ selectedTransportRoute: routeId, errors: {} }),
  setSelectedHotel: (hotelId) => set({ selectedHotel: hotelId, errors: {} }),
  toggleActivity: (activityId) => set((state) => ({
    selectedActivities: state.selectedActivities.includes(activityId)
      ? state.selectedActivities.filter((id) => id !== activityId)
      : [...state.selectedActivities, activityId],
  })),
  setErrors: (errors) => set({ errors }),
  setAgreedToTerms: (agreed) => set({ agreedToTerms: agreed, errors: {} }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setIsPaymentDialogOpen: (isOpen) => set({ isPaymentDialogOpen: isOpen }),

  resetBooking: () => set({
    step: 1,
    startDate: "",
    endDate: "",
    selectedTransportRoute: "",
    selectedHotel: "",
    selectedActivities: [],
    errors: {},
    agreedToTerms: false,
    paymentMethod: "",
    isPaymentDialogOpen: false,
    // Keep destination and other API data
  }),

  // Action incorporating validation before proceeding
  nextStep: () => {
    const { step, startDate, endDate, selectedTransportRoute, selectedHotel, agreedToTerms, setErrors } = get();
    const newErrors = {};

    if (step === 1) {
      if (!startDate) newErrors.startDate = "Start date is required";
      if (!endDate) newErrors.endDate = "End date is required";
      if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        newErrors.endDate = "End date must be after start date";
      }
    } else if (step === 2) {
      if (!selectedTransportRoute) newErrors.transportRoute = "Please select a transport route";
    } else if (step === 3) {
      if (!selectedHotel) newErrors.hotel = "Please select a hotel";
    } else if (step === 4) {
       // Activities are optional, so no validation needed
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0 && step < 5) {
      set({ step: step + 1 });
      return true;
    }
    return false;
  },

  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
}))

// Selector hooks (optional but can simplify component code)
export const useBookingNights = () => {
  const startDate = useBookingStore((state) => state.startDate)
  const endDate = useBookingStore((state) => state.endDate)
  return calculateNights(startDate, endDate)
}