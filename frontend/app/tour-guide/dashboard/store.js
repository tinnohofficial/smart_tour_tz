import { create } from "zustand"
import { toast } from "sonner"
import { tourGuideService, bookingsService, apiUtils } from '@/app/services/api'
import { ERROR_MESSAGES, USER_STATUS } from '@/app/constants'

export const useDashboardStore = create((set) => ({
  userData: null,
  tours: [],
  earnings: null,
  isLoading: true,
  isAvailable: false,
  profileStatus: null,
  error: null,

  setIsAvailable: (isAvailable) => set({ isAvailable }),
  
  fetchDashboard: async () => {
    return apiUtils.withLoadingAndError(
      async () => {
        // Fetch profile data
        const data = await tourGuideService.getProfile()
        
        set({
          userData: {
            id: data.user_id,
            name: data.full_name,
            email: data.email,
            phone: data.phone_number,
            profileImage: data.profile_image || "/placeholder.svg",
            location: data.location,
            expertise: typeof data.expertise === 'object' 
              ? data.expertise 
              : { general: data.expertise || "", activities: [] },
            reviewCount: data.review_count || 0,
            isAvailable: data.available || false,
            status: data.status
          },
          isAvailable: data.available || false,
          profileStatus: data.status
        })

        // Only fetch tours and earnings if profile is approved
        if (data.status === USER_STATUS.ACTIVE) {
          // Fetch assigned tours
          try {
            const toursData = await bookingsService.getTourGuideAssignedBookings()
            set({ tours: toursData })
          } catch (error) {
            console.error('Error fetching tours:', error)
            // Don't fail the whole operation if tours fail to load
          }

          // For now using mock earnings data
          set({
            earnings: {
              total: "$5,200",
              currentMonth: "$1,200",
              pendingPayouts: "$800"
            }
          })
        }

        return data
      },
      {
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        onError: (error) => {
          console.error('Error fetching dashboard data:', error)
          toast.error(ERROR_MESSAGES.PROFILE_LOAD_ERROR)
        }
      }
    )
  }
}))