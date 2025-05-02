import { create } from 'zustand'

export const useHotelManagerStore = create((set) => ({
  hotelName: "",
  hotelLocation: "",
  hotelCapacity: "",
  accommodationCosts: "",
  hotelFacilities: "",
  hotelImages: [], // Initialize as array for FileUploader
  isSubmitting: false,
  isSaved: false,

  setHotelName: (hotelName) => set({ hotelName }),
  setHotelLocation: (hotelLocation) => set({ hotelLocation }),
  setHotelCapacity: (hotelCapacity) => set({ hotelCapacity }),
  setAccommodationCosts: (accommodationCosts) => set({ accommodationCosts }),
  setHotelFacilities: (hotelFacilities) => set({ hotelFacilities }),
  setHotelImages: (hotelImages) => set({ hotelImages }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setIsSaved: (isSaved) => set({ isSaved }),

  resetForm: () => set({ 
    hotelName: "",
    hotelLocation: "",
    hotelCapacity: "",
    accommodationCosts: "",
    hotelFacilities: "",
    hotelImages: [],
    isSubmitting: false,
    isSaved: false,
  }),
}))