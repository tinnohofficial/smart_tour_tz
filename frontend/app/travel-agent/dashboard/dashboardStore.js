import { create } from "zustand";
import {
  travelAgentService,
  enhancedBookingsService,
  apiUtils,
} from "@/app/services/api";
import { getUserData, clearAuthData, getAuthToken } from "../../utils/auth";

export const useDashboardStore = create((set) => ({
  stats: {
    pendingBookings: 0,
    completedBookings: 0,
    totalRoutes: 0,
  },
  isLoading: true,
  userStatus: "pending_profile",

  // Actions
  setStats: (stats) => set({ stats }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setUserStatus: (userStatus) => set({ userStatus }),

  // Fetch dashboard data
  fetchDashboardData: async (router) => {
    return apiUtils.withLoadingAndError(
      async () => {
        try {
          // Get agency profile to check status
          const profileData = await travelAgentService.getProfile();
          set({ userStatus: profileData.status || "pending_profile" });

          // Only fetch stats if user is active
          if (profileData.status === "active") {
            // Fetch pending and completed bookings
            const [pendingBookings, completedBookings] =
              await Promise.allSettled([
                enhancedBookingsService.getPendingBookings(),
                enhancedBookingsService.getCompletedBookings(),
              ]);

            set({
              stats: {
                pendingBookings:
                  pendingBookings.status === "fulfilled"
                    ? pendingBookings.value?.length || 0
                    : 0,
                completedBookings:
                  completedBookings.status === "fulfilled"
                    ? completedBookings.value?.length || 0
                    : 0,
                totalRoutes: profileData.routes ? profileData.routes.length : 0,
              },
            });
          }
        } catch (error) {
          if (error.message?.includes("404")) {
            set({ userStatus: "pending_profile" });
          } else if (error.message?.includes("401")) {
            clearAuthData();
            router.push("/login");
            return;
          }
          throw error;
        }
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: () => {}, // Error handling done in try-catch
        onError: (error) => {
          console.error("Error fetching dashboard data:", error);
        },
      },
    );
  },
}));
