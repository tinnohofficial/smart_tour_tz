import { create } from 'zustand';

const useBookingStore = create((set, get) => ({
  step: 1,
  startDate: "",
  endDate: "",
  selectedTourGuide: "",
  selectedTravelAgent: "",
  selectedHotel: "",
  selectedActivities: [],
  errors: {},
  agreedToTerms: false,

  setStep: (step) => set({ step }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setSelectedTourGuide: (guide) => set({ selectedTourGuide: guide }),
  setSelectedTravelAgent: (agent) => set({ selectedTravelAgent: agent }),
  setSelectedHotel: (hotel) => set({ selectedHotel: hotel }),
  setSelectedActivities: (activities) => set((state) => ({
    selectedActivities: Array.isArray(activities) 
      ? activities 
      : typeof activities === 'function'
      ? activities(Array.isArray(state.selectedActivities) ? state.selectedActivities : [])
      : []
  })),
  setErrors: (errors) => set({ errors }),
  setAgreedToTerms: (agreed) => set({ agreedToTerms: agreed }),

  validateStep: (currentStep) => {
    const state = get();
    const errors = {};

    if (!Array.isArray(state.selectedActivities)) {
      set({ selectedActivities: [] });
    }

    switch (currentStep) {
      case 1:
        if (!state.startDate) errors.startDate = "Start date is required";
        if (!state.endDate) errors.endDate = "End date is required";
        if (state.startDate && state.endDate && new Date(state.startDate) > new Date(state.endDate)) {
          errors.endDate = "End date must be after start date";
        }
        break;
      case 2:
        if (!state.selectedTourGuide) errors.tourGuide = "Please select a tour guide";
        if (!state.selectedTravelAgent) errors.travelAgent = "Please select a travel agent";
        break;
      case 3:
        if (!state.selectedHotel) errors.hotel = "Please select a hotel";
        break;
    }

    set({ errors });
    return Object.keys(errors).length === 0;
  },

  nextStep: () => {
    const state = get();
    if (state.validateStep(state.step)) {
      set({ step: Math.min(state.step + 1, 4) });
      return true;
    }
    return false;
  },

  prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),

  resetBookingStore: () => set({
    step: 1,
    startDate: "",
    endDate: "",
    selectedTourGuide: "",
    selectedTravelAgent: "",
    selectedHotel: "",
    selectedActivities: [],
    errors: {},
    agreedToTerms: false,
  }),
}));

export default useBookingStore;