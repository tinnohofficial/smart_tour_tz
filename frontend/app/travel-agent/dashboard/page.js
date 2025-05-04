"use client"

import { useEffect } from "react"
import { Ticket, CreditCard, Briefcase, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { create } from "zustand"
import { toast } from "sonner"
import Link from "next/link"
import { useUserStore } from "@/app/store/userStore"
import { PendingApprovalAlert } from "@/components/pending-approval-alert"

// Store for travel agent dashboard data
const useTravelAgentDashboardStore = create((set) => ({
  stats: null,
  isLoading: true,
  error: null,
  setStats: (stats) => set({ stats }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  fetchDashboardData: async () => {
    set({ isLoading: true })
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      set({ 
        stats: {
          totalBookings: 0,
          pendingBookings: 0,
          monthlyRevenue: "$0",
          activeRoutes: 0,
          recentBookings: []
        }, 
        isLoading: false 
      })
    } catch (error) {
      set({ error: error.message, isLoading: false })
      toast.error("Failed to load dashboard data")
    }
  }
}))

export default function TravelAgentDashboard() {
  const { stats, isLoading, fetchDashboardData } = useTravelAgentDashboardStore()
  const { isApproved, hasCompletedProfile, userRole, fetchUserStatus } = useUserStore()

  useEffect(() => {
    fetchUserStatus()
    fetchDashboardData()
  }, [fetchDashboardData, fetchUserStatus])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Travel Agency Dashboard</h1>
        <Button asChild variant="outline">
          <Link href="/profile/travelAgent">Update Agency Profile</Link>
        </Button>
      </div>

      {/* Show pending approval alert if needed */}
      {(!isApproved || !hasCompletedProfile) && (
        <PendingApprovalAlert userRole={userRole} hasCompletedProfile={hasCompletedProfile} />
      )}

      {/* Limited dashboard for unapproved users */}
      {!isApproved ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Profile Status</p>
                  <p className="text-2xl font-bold text-yellow-600">Pending</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Full dashboard for approved users
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                    <p className="text-2xl font-bold">{stats.totalBookings}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Ticket className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending Bookings</p>
                    <p className="text-2xl font-bold">{stats.pendingBookings}</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Users className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                    <p className="text-2xl font-bold">{stats.monthlyRevenue}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-full">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Routes</p>
                    <p className="text-2xl font-bold">{stats.activeRoutes}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Briefcase className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest travel bookings that require your attention</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentBookings.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No recent bookings found
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{booking.touristName}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <p>{booking.startDate} - {booking.endDate}</p>
                          <span>•</span>
                          <p>{booking.destination}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={booking.status === "pending" ? "outline" : "secondary"}>
                          {booking.status}
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/dashboard/travel-agent/bookings">View Details</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}