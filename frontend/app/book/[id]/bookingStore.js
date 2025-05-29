// src/store/bookingStore.js
import { create } from 'zustand'
import { destinationsService, transportService, activitiesService, apiUtils, bookingCreationService, transportOriginsService } from '@/app/services/api'

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
  selectedOrigin: "", // User's selected origin location
  selectedTransportRoute: "",
  selectedHotel: "",
  selectedActivities: [],
  activitySchedules: {}, // Store activity scheduling details
  skipOptions: {    // Skip functionality for services
    skipTransport: false,
    skipHotel: false,
    skipActivities: false
  },
  errors: {},
  agreedToTerms: false,
  paymentMethod: "",
  isPaymentDialogOpen: false,
  savingsBalance: 2000, // Mock savings balance
  
  // Enhanced payment state
  isEnhancedPaymentOpen: false,
  
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

  // Create booking with skip functionality
  createBooking: async () => {
    const state = get();
    const {
      startDate,
      endDate,
      selectedTransportRoute,
      selectedHotel,
      selectedActivities,
      activitySchedules,
      skipOptions,
      destination
    } = state;

    const bookingData = {
      destinationId: destination?.id,
      startDate,
      endDate,
      includeTransport: !skipOptions.skipTransport,
      includeHotel: !skipOptions.skipHotel,
      includeActivities: !skipOptions.skipActivities,
      transportId: !skipOptions.skipTransport ? selectedTransportRoute : null,
      hotelId: !skipOptions.skipHotel ? selectedHotel : null,
      activityIds: !skipOptions.skipActivities ? selectedActivities : [],
      activitySchedules: !skipOptions.skipActivities ? activitySchedules : {}
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
  setSelectedOrigin: (originId) => set({ selectedOrigin: originId, errors: {} }),
  setSelectedTransportRoute: (routeId) => set({ selectedTransportRoute: routeId, errors: {} }),
  setSelectedHotel: (hotelId) => set({ selectedHotel: hotelId, errors: {} }),
  toggleActivity: (activityId) => set((state) => ({
    selectedActivities: state.selectedActivities.includes(activityId)
      ? state.selectedActivities.filter((id) => id !== activityId)
      : [...state.selectedActivities, activityId],
  })),
  
  // Skip service actions
  setSkipOption: (option, value) => set((state) => ({
    skipOptions: {
      ...state.skipOptions,
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
  setIsEnhancedPaymentOpen: (isOpen) => set({ isEnhancedPaymentOpen: isOpen }),

  // Enhanced payment processing
  processEnhancedPayment: async (paymentResult) => {
    try {
      const { step, startDate, endDate, selectedTransportRoute, selectedHotel, selectedActivities, activitySchedules, flexibleOptions } = get();
      const state = get();
      
      // Create booking first
      const bookingData = {
        startDate,
        endDate,
        selectedOrigin: state.selectedOrigin,
        selectedTransportRoute: state.selectedTransportRoute,
        selectedHotel: state.selectedHotel,
        selectedActivities: state.selectedActivities,
        activitySchedules: state.activitySchedules,
        skipOptions: state.skipOptions
      };

      const booking = await bookingCreationService.createBooking(
        state.destination?.id,
        bookingData
      );

      if (booking.error) {
        throw new Error(booking.error);
      }

      // Process payment with booking ID
      const endpoint = `/api/bookings/${booking.bookingId}/pay`;
      const token = localStorage.getItem('token');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethod: paymentResult.method,
          ...paymentResult.data
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        return { success: true, ...result };
      } else {
        throw new Error(result.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Enhanced payment error:', error);
      return { success: false, error: error.message };
    }
  },

  resetBooking: () => set({
    step: 1,
    startDate: "",
    endDate: "",
    selectedOrigin: "",
    selectedTransportRoute: "",
    selectedHotel: "",
    selectedActivities: [],
    activitySchedules: {},
    skipOptions: {
      skipTransport: false,
      skipHotel: false,
      skipActivities: false
    },
    errors: {},
    agreedToTerms: false,
    paymentMethod: "",
    isPaymentDialogOpen: false,
    isEnhancedPaymentOpen: false,
    // Keep destination and other API data
  }),

  // Action incorporating validation before proceeding with 5-step flow
  nextStep: () => {
    const { step, startDate, endDate, selectedTransportRoute, selectedHotel, selectedActivities, activitySchedules, skipOptions, setErrors } = get();
    const newErrors = {};

    if (step === 1) {
      // Step 1: Validate dates and origin (if transport is not skipped)
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
      // Step 4: Validate activity selection and scheduling if activities are not skipped
      if (!skipOptions.skipActivities) {
        if (selectedActivities.length === 0) {
          newErrors.activities = "Please select at least one activity or skip activities";
        } else {
          // Validate that all selected activities have schedules
          const missingSchedules = selectedActivities.filter(activityId => !activitySchedules[activityId]);
          if (missingSchedules.length > 0) {
            newErrors.activitySchedules = "Please complete scheduling for all selected activities";
          }
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
    return false;
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