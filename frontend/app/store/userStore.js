import { create } from "zustand";
import { toast } from "sonner";
import { authService, apiUtils } from "../services/api";
import { getUserData, clearAuthData, getAuthToken } from "../utils/auth";

export const useUserStore = create((set) => ({
  isApproved: false,
  hasCompletedProfile: false,
  userRole: null,

  setIsApproved: (status) => set({ isApproved: status }),
  setHasCompletedProfile: (status) => set({ hasCompletedProfile: status }),
  setUserRole: (role) => set({ userRole: role }),

  // Fetch user status from API
  fetchUserStatus: async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const data = await apiUtils.withLoadingAndError(
        () => authService.getUserStatus(),
        {
          setError: (error) => {
            console.error("Error fetching user status:", error);
            toast.error("Failed to fetch user status");
          },
          onSuccess: (data) => {
            set({
              isApproved: data.isApproved,
              hasCompletedProfile: data.hasCompletedProfile,
              userRole: data.role,
            });
          },
        },
      );
    } catch (error) {
      // Error already handled by apiUtils.withLoadingAndError
    }
  },
}));
