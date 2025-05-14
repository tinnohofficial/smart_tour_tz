// src/store/bookingStore.js
import { create } from 'zustand'

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

// API base URL - can be configured from environment variables if needed
const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
    
    set(state => ({
      isLoading: { ...state.isLoading, destination: true },
      error: { ...state.error, destination: null }
    }));
    
    try {
      const response = await fetch(`${API_URL}/destinations/${destinationId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch destination: ${response.statusText}`);
      }
      
      const data = await response.json();
      set({ 
        destination: data,
        isLoading: { ...get().isLoading, destination: false }
      });
    } catch (error) {
      console.error('Error fetching destination:', error);
      set({ 
        error: { ...get().error, destination: error.message },
        isLoading: { ...get().isLoading, destination: false }
      });
    }
  },

  fetchTransportRoutes: async (originOrDestination) => {
    set(state => ({
      isLoading: { ...state.isLoading, transports: true },
      error: { ...state.error, transports: null }
    }));
    
    try {
      // If we have origin or destination info, we can filter by it
      let url = `${API_URL}/transports`;
      if (originOrDestination) {
        url += `?filter=${encodeURIComponent(originOrDestination)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transport routes: ${response.statusText}`);
      }
      
      const data = await response.json();
      set({ 
        transportRoutes: data,
        isLoading: { ...get().isLoading, transports: false }
      });
    } catch (error) {
      console.error('Error fetching transport routes:', error);
      set({ 
        error: { ...get().error, transports: error.message },
        isLoading: { ...get().isLoading, transports: false }
      });
    }
  },

  fetchHotels: async (location) => {
    set(state => ({
      isLoading: { ...state.isLoading, hotels: true },
      error: { ...state.error, hotels: null }
    }));
    
    try {
      // Update query parameter to match backend implementation
      let url = `${API_URL}/hotels`;
      if (location) {
        url += `?location=${encodeURIComponent(location)}`;
      }
      
      console.log("Fetching hotels from URL:", url); // Add logging for debugging
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch hotels: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Hotels fetched:", data); // Log fetched data
      
      set({ 
        hotels: data,
        isLoading: { ...get().isLoading, hotels: false }
      });
    } catch (error) {
      console.error('Error fetching hotels:', error);
      set({ 
        error: { ...get().error, hotels: error.message },
        isLoading: { ...get().isLoading, hotels: false }
      });
    }
  },

  fetchActivities: async (destinationId) => {
    if (!destinationId) return;
    
    set(state => ({
      isLoading: { ...state.isLoading, activities: true },
      error: { ...state.error, activities: null }
    }));
    
    try {
      const response = await fetch(`${API_URL}/activities?destination=${destinationId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
      }
      
      const data = await response.json();
      set({ 
        activities: data,
        isLoading: { ...get().isLoading, activities: false }
      });
    } catch (error) {
      console.error('Error fetching activities:', error);
      set({ 
        error: { ...get().error, activities: error.message },
        isLoading: { ...get().isLoading, activities: false }
      });
    }
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