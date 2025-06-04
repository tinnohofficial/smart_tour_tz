// src/store/bookingStore.js
import { create } from 'zustand'
import { destinationsService, transportService, activitiesService, apiUtils, bookingCreationService, transportOriginsService } from '@/app/services/api'
import { toast } from 'sonner'

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
  touristFullName: "",
  startDate: "",
  endDate: "",
  selectedOrigin: "", // User's selected origin location
  selectedTransportRoute: "",
  selectedHotel: "",
  selectedActivities: [],
  activitySessions: {}, // Store number of sessions for each activity
  skipOptions: {    // Skip functionality for services
    skipTransport: false,
    skipHotel: false
  },
  errors: {},
  agreedToTerms: false,
  paymentMethod: "",
  isPaymentDialogOpen: false,
  

  
  // API data
  destination: null,
  transportOrigins: [], // New: Available origins
  transportRoutes: [],
  hotels: [],
  activities: [],
  isLoading: {
    destination: false,
    origins: false, // New: Loading state for origins
    transports: false,
    hotels: false,
    activities: false
  },
  error: {
    destination: null,
    origins: null, // New: Error state for origins
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

  fetchTransportOrigins: async () => {
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await transportOriginsService.getAllOrigins()
        set({ transportOrigins: data })
        return data
      },
      {
        setLoading: (loading) => set(state => ({
          isLoading: { ...state.isLoading, origins: loading }
        })),
        setError: (error) => set(state => ({
          error: { ...state.error, origins: error }
        })),
        onError: (error) => {
          console.error('Error fetching transport origins:', error)
        }
      }
    )
  },

  fetchTransportRoutes: async (originId = null, destinationId = null) => {
    return apiUtils.withLoadingAndError(
      async () => {
        const params = {}
        if (originId) params.origin_id = originId
        if (destinationId) params.destination_id = destinationId
        
        const data = await transportService.getAllRoutes(params)
        set({ transportRoutes: data })
        return data
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

  fetchHotels: async (destinationId) => {
    return apiUtils.withLoadingAndError(
      async () => {
        // Use destination_id parameter instead of location string
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/hotels${destinationId ? `?destination_id=${destinationId}` : ''}`)
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



  // Create booking with skip functionality
  createBooking: async () => {
    const state = get();
    const {
      touristFullName,
      startDate,
      endDate,
      selectedTransportRoute,
      selectedHotel,
      selectedActivities,
      activitySessions,
      skipOptions,
      destination
    } = state;

    const bookingData = {
      destinationId: destination?.id,
      touristFullName,
      startDate,
      endDate,
      includeTransport: !skipOptions.skipTransport,
      includeHotel: !skipOptions.skipHotel,
      includeActivities: true,
      transportId: !skipOptions.skipTransport ? selectedTransportRoute : null,
      hotelId: !skipOptions.skipHotel ? selectedHotel : null,
      activityIds: selectedActivities,
      activitySessions: activitySessions
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
  setTouristFullName: (name) => set({ touristFullName: name, errors: {} }),
  setStartDate: (date) => set({ startDate: date, errors: {} }),
  setEndDate: (date) => set({ endDate: date, errors: {} }),
  setSelectedOrigin: (originId) => set({ selectedOrigin: originId, errors: {} }),
  setSelectedTransportRoute: (routeId) => set({ selectedTransportRoute: routeId, errors: {} }),
  setSelectedHotel: (hotelId) => set({ selectedHotel: hotelId, errors: {} }),
  toggleActivity: (activityId) => set((state) => {
    const isCurrentlySelected = state.selectedActivities.includes(activityId);
    
    if (isCurrentlySelected) {
      // Remove activity and its sessions
      const newSessions = { ...state.activitySessions };
      delete newSessions[activityId];
      return {
        selectedActivities: state.selectedActivities.filter((id) => id !== activityId),
        activitySessions: newSessions
      };
    } else {
      // Add activity and set default session count
      return {
        selectedActivities: [...state.selectedActivities, activityId],
        activitySessions: {
          ...state.activitySessions,
          [activityId]: 1 // Set default session count
        }
      };
    }
  }),
  
  // Skip service actions
  setSkipOption: (option, value) => set((state) => ({
    skipOptions: {
      ...state.skipOptions,
      [option]: value
    },
    errors: {}
  })),
  
  // Activity sessions actions
  setActivitySessions: (activityId, sessions) => set((state) => ({
    activitySessions: {
      ...state.activitySessions,
      [activityId]: sessions
    }
  })),
  
  removeActivitySessions: (activityId) => set((state) => {
    const newSessions = { ...state.activitySessions };
    delete newSessions[activityId];
    return { activitySessions: newSessions };
  }),
  
  setErrors: (errors) => set({ errors }),
  setAgreedToTerms: (agreed) => set({ agreedToTerms: agreed, errors: {} }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setIsPaymentDialogOpen: (isOpen) => set({ isPaymentDialogOpen: isOpen }),


  resetBooking: () => set({
    step: 1,
    touristFullName: "",
    startDate: "",
    endDate: "",
    selectedOrigin: "",
    selectedTransportRoute: "",
    selectedHotel: "",
    selectedActivities: [],
    activitySessions: {},
    skipOptions: {
      skipTransport: false,
      skipHotel: false
    },
    errors: {},
    agreedToTerms: false,
    paymentMethod: "",
    isPaymentDialogOpen: false,
    // Keep destination and other API data
  }),

  // Action incorporating validation before proceeding with 5-step flow
  nextStep: () => {
    try {
      const { step, touristFullName, startDate, endDate, selectedOrigin, selectedTransportRoute, selectedHotel, selectedActivities, activitySessions, skipOptions, setErrors } = get();
      const newErrors = {};

    if (step === 1) {
      // Step 1: Validate tourist name, dates and origin (if transport is not skipped)
      if (!touristFullName || touristFullName.trim().length < 2) {
        newErrors.touristFullName = "Please enter your full name (at least 2 characters)";
      }
      if (!startDate) newErrors.startDate = "Start date is required";
      if (!endDate) newErrors.endDate = "End date is required";
      if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        newErrors.endDate = "End date must be after start date";
      }
      // Validate origin selection if transport is not skipped
      if (!skipOptions.skipTransport && !selectedOrigin) {
        newErrors.origin = "Please select a departure location or skip transport";
      }
    } else if (step === 2) {
      // Step 2: Validate transport if not skipped
      if (!skipOptions.skipTransport && !selectedTransportRoute) {
        newErrors.transportRoute = "Please select a transport route or skip transport";
      }
    } else if (step === 3) {
      // Step 3: Validate hotel if not skipped
      if (!skipOptions.skipHotel && !selectedHotel) {
        newErrors.hotel = "Please select a hotel or skip accommodation";
      }
    } else if (step === 4) {
      // Step 4: Validate activity selection and scheduling (activities are mandatory)
      if (selectedActivities.length === 0) {
        newErrors.activities = "Please select at least one activity";
      } else {
        // Validate that all selected activities have sessions specified
        const missingSessions = selectedActivities.filter(activityId => !activitySessions[activityId] || activitySessions[activityId] < 1);
        if (missingSessions.length > 0) {
          newErrors.activitySessions = "Please specify number of sessions for all selected activities";
        }
      }
    } else if (step === 5) {
      // Step 5: Final review and confirmation - no additional validation needed here
    }

      setErrors(newErrors);
      if (Object.keys(newErrors).length === 0 && step < 5) {
        set({ step: step + 1 });
        return true;
      }
      
      // Show validation errors as toast notifications
      if (Object.keys(newErrors).length > 0) {
        const firstError = Object.values(newErrors)[0];
        toast.error("Validation Error", {
          description: firstError
        });
      }
      
      return false;
    } catch (error) {
      console.error('Error in nextStep:', error);
      toast.error("Booking Error", {
        description: "An unexpected error occurred. Please try again."
      });
      return false;
    }
  },

  prevStep: () => {
    const { step } = get();
    set({ step: Math.max(1, step - 1) });
  },
}))

// Selector hooks (optional but can simplify component code)
export const useBookingNights = () => {
  const startDate = useBookingStore((state) => state.startDate)
  const endDate = useBookingStore((state) => state.endDate)
  return calculateNights(startDate, endDate)
}