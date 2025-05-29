// hotel-manager/profile/store.js
import { create } from "zustand";
import { toast } from "sonner";
import {
  hotelManagerService,
  uploadService,
  apiUtils,
} from "@/app/services/api";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/app/constants";

export const useProfileStore = create((set, get) => ({
  // Profile data
  profileData: null,
  isLoading: true,
  isSubmitting: false,
  isUploading: false,
  error: null,

  // Form data
  hotelName: "",
  hotelLocation: "",
  hotelDescription: "",
  hotelCapacity: "",
  accommodationCosts: "",
  hotelImages: [],
  isApproved: false,
  isAvailable: true,

  // Actions
  fetchProfile: async () => {
    return apiUtils.withLoadingAndError(
      async () => {
        const data = await hotelManagerService.getProfile();
        set({
          profileData: data,
          hotelName: data.name || "",
          hotelLocation: data.location || "",
          hotelDescription: data.description || "",
          hotelCapacity: data.capacity || "",
          // Format price to maintain decimal precision
          accommodationCosts: data.base_price_per_night
            ? parseFloat(data.base_price_per_night).toFixed(2)
            : "",
          hotelImages: data.images || [],
          isApproved: data.status === "active",
          isAvailable:
            data.is_available !== undefined ? data.is_available : true,
        });
        return data;
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: (error) => {
          if (error.response?.status === 404) {
            // New profile, initialize empty state
            set({ profileData: null });
          } else {
            console.error("Error fetching profile:", error);
            toast.error(ERROR_MESSAGES.PROFILE_LOAD_ERROR);
          }
        },
      },
    );
  },

  setHotelImages: (images) => {
    set({ hotelImages: images });
  },

  updateProfile: async (formData, options = {}) => {
    return apiUtils.withLoadingAndError(
      async () => {
        // Get hotel images with null check to prevent filter error
        const currentImages = get().hotelImages || [];

        // Handle file uploads if there are new hotel images
        const newImages = currentImages.filter((img) => img instanceof File);
        const existingImages = currentImages.filter(
          (img) => !(img instanceof File),
        );

        let uploadedImageUrls = [...existingImages];

        if (newImages.length > 0) {
          set({ isUploading: true });

          for (const imageFile of newImages) {
            const { url } = await uploadService.uploadFile(imageFile);
            uploadedImageUrls.push(url);
          }
        }

        // Ensure price has proper decimal format before sending
        const price = parseFloat(formData.accommodationCosts).toFixed(2);

        // Prepare hotel data for submission
        const profileData = {
          name: formData.hotelName,
          location: formData.hotelLocation,
          description: formData.hotelDescription,
          capacity: formData.hotelCapacity,
          base_price_per_night: price,
          images: uploadedImageUrls,
        };

        // Include availability if specified in options
        if (options.is_available !== undefined) {
          profileData.is_available = options.is_available;
        }

        // Determine if this is a create or update operation
        const isUpdate = get().profileData;
        const updatedData = isUpdate
          ? await hotelManagerService.updateProfile(profileData)
          : await hotelManagerService.createProfile(profileData);

        set({
          profileData: updatedData,
          hotelName: updatedData.name || profileData.name,
          hotelLocation: updatedData.location || profileData.location,
          hotelDescription: updatedData.description || profileData.description,
          hotelCapacity: updatedData.capacity || profileData.capacity,
          // Format price to maintain decimal precision
          accommodationCosts: updatedData.base_price_per_night
            ? parseFloat(updatedData.base_price_per_night).toFixed(2)
            : price,
          hotelImages: updatedData.images || uploadedImageUrls,
          // Update availability if it was included
          isAvailable:
            updatedData.is_available !== undefined
              ? updatedData.is_available
              : get().isAvailable,
        });

        toast.success(SUCCESS_MESSAGES.PROFILE_UPDATE_SUCCESS);
        return updatedData;
      },
      {
        setLoading: (loading) => set({ isSubmitting: loading }),
        setError: (error) => set({ error }),
        onError: (error) => {
          console.error("Error updating profile:", error);
          toast.error(ERROR_MESSAGES.PROFILE_UPDATE_ERROR);
        },
        onFinally: () => set({ isUploading: false }),
      },
    );
  },

  toggleAvailability: async () => {
    const currentState = get();
    const newAvailability = !currentState.isAvailable;

    // Use the regular update function with only availability change
    return get().updateProfile(
      {
        hotelName: currentState.hotelName,
        hotelLocation: currentState.hotelLocation,
        hotelDescription: currentState.hotelDescription,
        hotelCapacity: currentState.hotelCapacity,
        accommodationCosts: currentState.accommodationCosts,
      },
      { is_available: newAvailability },
    );
  },
}));
