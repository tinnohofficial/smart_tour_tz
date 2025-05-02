import { create } from 'zustand'

// Mock data for hotels
const mockHotels = {
  profiles: {
    1: {
      hotel_name: "Serengeti Luxury Lodge",
      location: "Serengeti National Park",
      capacity: "50 rooms",
      accommodation_costs: "$200-$500 per night",
      facilities: "Pool, Spa, Restaurant, WiFi, Game drives",
      images: ["hotel1.jpg", "hotel2.jpg"],
      available: true
    },
    2: {
      hotel_name: "Zanzibar Beach Resort",
      location: "Zanzibar",
      capacity: "75 rooms",
      accommodation_costs: "$150-$400 per night",
      facilities: "Beach access, Pool, Restaurant, Bar, Water sports",
      images: ["resort1.jpg", "resort2.jpg"],
      available: true
    }
  }
};

export const useHotelManagerProfileStore = create((set, get) => ({
  hotelName: "",
  hotelLocation: "",
  hotelCapacity: "",
  accommodationCosts: "",
  hotelFacilities: "",
  hotelImages: [],
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

  fetchProfile: async () => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate fetching profile for hotel ID 1
      const profile = mockHotels.profiles[1];
      if (profile) {
        set({ 
          hotelName: profile.hotel_name,
          hotelLocation: profile.location,
          hotelCapacity: profile.capacity,
          accommodationCosts: profile.accommodation_costs,
          hotelFacilities: profile.facilities,
          hotelImages: profile.images
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  },

  submitProfile: async () => {
    set({ isSubmitting: true });
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update mock data
      mockHotels.profiles[1] = {
        hotel_name: get().hotelName,
        location: get().hotelLocation,
        capacity: get().hotelCapacity,
        accommodation_costs: get().accommodationCosts,
        facilities: get().hotelFacilities,
        images: get().hotelImages,
        available: true
      };
      
      set({ isSubmitting: false, isSaved: true });
    } catch (error) {
      set({ isSubmitting: false });
      throw error;
    }
  },

  savePartial: async () => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update mock data with partial information
      const currentProfile = mockHotels.profiles[1] || {};
      mockHotels.profiles[1] = {
        ...currentProfile,
        hotel_name: get().hotelName || currentProfile.hotel_name,
        location: get().hotelLocation || currentProfile.location,
        capacity: get().hotelCapacity || currentProfile.capacity,
        accommodation_costs: get().accommodationCosts || currentProfile.accommodation_costs,
        facilities: get().hotelFacilities || currentProfile.facilities,
        images: get().hotelImages.length ? get().hotelImages : currentProfile.images
      };
    } catch (error) {
      console.error("Failed to save progress:", error);
      throw error;
    }
  },

  resetForm: () => set({ 
    hotelName: "",
    hotelLocation: "",
    hotelCapacity: "",
    accommodationCosts: "",
    hotelFacilities: "",
    hotelImages: [],
    isSubmitting: false,
    isSaved: false,
  })
}));