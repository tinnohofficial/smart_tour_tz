import {create} from 'zustand'

export const useRegisterStore = create((set) => ({
  step: 1,
  role: "",
  basicFormData: {
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    role: "tourist", 
  },
  tourGuideFormData: {
    fullName: "",
    location: "",
    expertise: "",
    licenseDocuments: null,
  },
  hotelManagerFormData: {
    hotelName: "",
    hotelLocation: "",
    hotelCapacity: "",
    hotelFacilities: "",
    hotelImages: null,
  },
  travelAgentFormData: {
    companyName: "",
    travelRoutes: "",
    legalDocuments: null,
  },

  setStep: (step) => set({ step }),
  setRole: (role) => set({ role }),

  setBasicFormData: (data) => set(state => ({ basicFormData: { ...state.basicFormData, ...data } })),
  setTourGuideFormData: (data) => set(state => ({ tourGuideFormData: { ...state.tourGuideFormData, ...data } })),
  setHotelManagerFormData: (data) => set(state => ({ hotelManagerFormData: { ...state.hotelManagerFormData, ...data } })),
  setTravelAgentFormData: (data) => set(state => ({ travelAgentFormData: { ...state.travelAgentFormData, ...data } })),

  resetAllForms: () => set({
    basicFormData: { email: "", password: "", confirmPassword: "", phoneNumber: "", role: "tourist" },
    tourGuideFormData: { fullName: "", location: "", expertise: "", licenseDocuments: null },
    hotelManagerFormData: { hotelName: "", hotelLocation: "", hotelCapacity: "", hotelFacilities: "", hotelImages: null },
    travelAgentFormData: { companyName: "", travelRoutes: "", legalDocuments: null }
  })
}));
