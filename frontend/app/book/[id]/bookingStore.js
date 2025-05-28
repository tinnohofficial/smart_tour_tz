// src/store/bookingStore.js
import { create } from 'zustand'
import { destinationsService, transportService, activitiesService, apiUtils, bookingCreationService } from '@/app/services/api'

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
  activitySchedules: {}, // New: Store activity scheduling details
  flexibleOptions: {    // New: Flexible service selection
    includeTransport: true,
    includeHotel: true,
    includeActivities: true
  },
  errors: {},
  agreedToTerms: false,
  paymentMethod: "",
  isPaymentDialogOpen: false,
  savingsBalance: 2000, // Mock savings balance
  
  // Crypto payment state
  walletAddress: null,
  isWalletConnected: false,
  isConnectingWallet: false,
  
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
        const data = await activitiesService.getActivitiesWithScheduling(destinationId)
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

  // New: Check activity availability
  checkActivityAvailability: async (activityId, date, timeSlot) => {
    try {
      const availability = await activitiesService.getActivityAvailability(activityId, date, timeSlot)
      return availability
    } catch (error) {
      console.error('Error checking activity availability:', error)
      throw error
    }
  },

  // New: Create flexible booking
  createBooking: async () => {
    const state = get();
    const {
      startDate,
      endDate,
      selectedTransportRoute,
      selectedHotel,
      selectedActivities,
      activitySchedules,
      flexibleOptions,
      destination
    } = state;

    const bookingData = {
      destinationId: destination?.id,
      startDate,
      endDate,
      includeTransport: flexibleOptions.includeTransport,
      includeHotel: flexibleOptions.includeHotel,
      includeActivities: flexibleOptions.includeActivities,
      transportId: flexibleOptions.includeTransport ? selectedTransportRoute : null,
      hotelId: flexibleOptions.includeHotel ? selectedHotel : null,
      activityIds: flexibleOptions.includeActivities ? selectedActivities : [],
      activitySchedules: flexibleOptions.includeActivities ? activitySchedules : {}
    };

    try {
      const result = await bookingCreationService.createFlexibleBooking(bookingData);
      return result;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
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
  
  // New: Flexible service selection actions
  setFlexibleOption: (option, value) => set((state) => ({
    flexibleOptions: {
      ...state.flexibleOptions,
      [option]: value
    },
    errors: {}
  })),
  
  // New: Activity scheduling actions
  setActivitySchedule: (activityId, schedule) => set((state) => ({
    activitySchedules: {
      ...state.activitySchedules,
      [activityId]: schedule
    }
  })),
  
  removeActivitySchedule: (activityId) => set((state) => {
    const newSchedules = { ...state.activitySchedules };
    delete newSchedules[activityId];
    return { activitySchedules: newSchedules };
  }),
  
  setErrors: (errors) => set({ errors }),
  setAgreedToTerms: (agreed) => set({ agreedToTerms: agreed, errors: {} }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setIsPaymentDialogOpen: (isOpen) => set({ isPaymentDialogOpen: isOpen }),

  // Crypto wallet actions
  connectWallet: async () => {
    set({ isConnectingWallet: true });
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        if (accounts.length > 0) {
          set({ 
            walletAddress: accounts[0], 
            isWalletConnected: true,
            isConnectingWallet: false 
          });
          return { success: true, address: accounts[0] };
        }
      } else {
        throw new Error('MetaMask not found');
      }
    } catch (error) {
      set({ isConnectingWallet: false });
      return { success: false, error: error.message };
    }
  },

  disconnectWallet: () => set({ 
    walletAddress: null, 
    isWalletConnected: false 
  }),

  resetBooking: () => set({
    step: 1,
    startDate: "",
    endDate: "",
    selectedTransportRoute: "",
    selectedHotel: "",
    selectedActivities: [],
    activitySchedules: {},
    flexibleOptions: {
      includeTransport: true,
      includeHotel: true,
      includeActivities: true
    },
    errors: {},
    agreedToTerms: false,
    paymentMethod: "",
    isPaymentDialogOpen: false,
    // Keep destination and other API data
  }),

  // Action incorporating validation before proceeding with smart step skipping (6-step flow)
  nextStep: () => {
    const { step, startDate, endDate, selectedTransportRoute, selectedHotel, selectedActivities, activitySchedules, flexibleOptions, setErrors } = get();
    const newErrors = {};

    if (step === 1) {
      // Step 1: Validate that at least one service is selected
      if (!flexibleOptions.includeTransport && !flexibleOptions.includeHotel && !flexibleOptions.includeActivities) {
        newErrors.services = "Please select at least one service to continue";
      }
    } else if (step === 2) {
      // Step 2: Validate dates
      if (!startDate) newErrors.startDate = "Start date is required";
      if (!endDate) newErrors.endDate = "End date is required";
      if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        newErrors.endDate = "End date must be after start date";
      }
    } else if (step === 3) {
      // Step 3: Validate transport if included
      if (flexibleOptions.includeTransport && !selectedTransportRoute) {
        newErrors.transportRoute = "Please select a transport route or disable transport";
      }
    } else if (step === 4) {
      // Step 4: Validate hotel if included
      if (flexibleOptions.includeHotel && !selectedHotel) {
        newErrors.hotel = "Please select a hotel or disable accommodation";
      }
    } else if (step === 5) {
      // Step 5: Validate activity selection and scheduling if activities are included
      if (flexibleOptions.includeActivities) {
        if (selectedActivities.length === 0) {
          newErrors.activities = "Please select at least one activity or disable activities";
        } else {
          // Validate that all selected activities have schedules
          const missingSchedules = selectedActivities.filter(activityId => !activitySchedules[activityId]);
          if (missingSchedules.length > 0) {
            newErrors.activitySchedules = "Please complete scheduling for all selected activities";
          }
        }
      }
    } else if (step === 6) {
      // Step 6: Final review and confirmation - no additional validation needed here
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0 && step < 6) {
      // Smart step navigation: skip steps based on service selection
      let nextStepNumber = step + 1;
      
      // Skip transport step if transport is not included
      if (nextStepNumber === 3 && !flexibleOptions.includeTransport) {
        nextStepNumber = 4;
      }
      
      // Skip hotel step if hotel is not included
      if (nextStepNumber === 4 && !flexibleOptions.includeHotel) {
        nextStepNumber = 5;
      }
      
      // Skip activities step if activities are not included
      if (nextStepNumber === 5 && !flexibleOptions.includeActivities) {
        nextStepNumber = 6; // Go directly to review/confirmation
      }
      
      set({ step: Math.min(nextStepNumber, 6) }); // Allow up to step 6 (review)
      return true;
    }
    return false;
  },

  prevStep: () => {
    const { step, flexibleOptions } = get();
    let prevStepNumber = step - 1;
    
    // Smart navigation backwards: skip disabled services
    if (prevStepNumber === 5 && !flexibleOptions.includeActivities) {
      prevStepNumber = 4;
    }
    
    if (prevStepNumber === 4 && !flexibleOptions.includeHotel) {
      prevStepNumber = 3;
    }
    
    if (prevStepNumber === 3 && !flexibleOptions.includeTransport) {
      prevStepNumber = 2;
    }
    
    set({ step: Math.max(1, prevStepNumber) });
  },
}))

// Selector hooks (optional but can simplify component code)
export const useBookingNights = () => {
  const startDate = useBookingStore((state) => state.startDate)
  const endDate = useBookingStore((state) => state.endDate)
  return calculateNights(startDate, endDate)
}