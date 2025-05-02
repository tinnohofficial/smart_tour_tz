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

  // Actions
  setStep: (step) => set({ step }),
  setStartDate: (date) => set({ startDate: date, errors: {} }), // Clear errors on change
  setEndDate: (date) => set({ endDate: date, errors: {} }),     // Clear errors on change
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
    // savingsBalance: 2000, // Keep existing balance or reset if needed
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
       // Validation for step 4 is handled within the handleBooking function now
       // But we still check terms agreement for the button state later
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0 && step < 4) {
      set({ step: step + 1 });
    }
  },

  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),

  // Computed values (can also be calculated in the component)
  // Note: Zustand selectors are generally preferred over putting computed values directly in the store
  // unless the calculation is complex and reused heavily across different components.
  // We will calculate these in the component using useMemo for simplicity here.
}))

// Selector hooks (optional but can simplify component code)
export const useBookingNights = () => {
  const startDate = useBookingStore((state) => state.startDate)
  const endDate = useBookingStore((state) => state.endDate)
  return calculateNights(startDate, endDate)
}