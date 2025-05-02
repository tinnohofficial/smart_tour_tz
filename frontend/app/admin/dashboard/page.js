"use client"

import { useEffect } from "react" // Removed useState
import { create } from 'zustand' // Import zustand
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, MapPin, Activity, Calendar, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { applicationsService, destinationsService, activitiesService, bookingsService } from "@/app/services/api"

const useAdminDashboardStore = create((set) => ({
  // Initial State
  isLoading: true,
  stats: {
    pendingApplications: 0,
    destinations: 0,
    activities: 0,
    unassignedBookings: 0,
  },
  error: null,

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setStats: (newStats) => set((state) => ({ stats: { ...state.stats, ...newStats } })),
  setError: (errorMessage) => set({ error: errorMessage }),

  // Action to fetch all data and update state
  fetchDashboardData: async () => {
    set({ isLoading: true, error: null }); 
    try {
      // Fetch data in parallel
      const [pendingApplications, destinations, activities, unassignedBookings] = await Promise.all([
        applicationsService.getPendingApplications(),
        destinationsService.getAllDestinations(),
        activitiesService.getAllActivities(),
        bookingsService.getUnassignedBookings(),
      ])

      set({
        stats: {
          pendingApplications: pendingApplications.length,
          destinations: destinations.length,
          activities: activities.length,
          unassignedBookings: unassignedBookings.length,
        }
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      set({ error: "Failed to load dashboard data. Please try again later." });
    } finally {
      set({ isLoading: false });
    }
  }
}));


export default function AdminDashboard() {
  const isLoading = useAdminDashboardStore((state) => state.isLoading)
  const stats = useAdminDashboardStore((state) => state.stats)
  const error = useAdminDashboardStore((state) => state.error)
  const fetchDashboardData = useAdminDashboardStore((state) => state.fetchDashboardData)

  // Fetch data when the component mounts
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]) 

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-500">Overview of your Smart Tour system.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.pendingApplications}</div>
                <p className="text-xs text-gray-500">
                  {stats.pendingApplications > 0 ? "Waiting for approval" : "No pending applications"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Destinations</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.destinations}</div>
                <p className="text-xs text-gray-500">Total destinations in system</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.activities}</div>
                <p className="text-xs text-gray-500">Total activities available</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.unassignedBookings}</div>
                <p className="text-xs text-gray-500">
                  {stats.unassignedBookings > 0 ? "Waiting for guide assignment" : "No unassigned bookings"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Actions and Overview */}
      <Tabs defaultValue="actions">
        <TabsList>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
        </TabsList>
        <TabsContent value="actions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Account Approvals</CardTitle>
                <CardDescription>Review and approve pending account applications</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <Button asChild className="text-white bg-blue-600 hover:bg-blue-700">
                  <Link href="/admin/applications">Manage Applications</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Destinations</CardTitle>
                <CardDescription>Manage tourist destinations in the system</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <Button asChild className="text-white bg-blue-600 hover:bg-blue-700">
                  <Link href="/admin/destinations">Manage Destinations</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Activities</CardTitle>
                <CardDescription>Manage activities available at destinations</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <Button asChild className="text-white bg-blue-600 hover:bg-blue-700">
                  <Link href="/admin/activities">Manage Activities</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tour Guide Assignments</CardTitle>
                <CardDescription>Assign tour guides to bookings</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <Button asChild className="text-white bg-blue-600 hover:bg-blue-700">
                  <Link href="/admin/assignments">Manage Assignments</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current status of the Smart Tour system</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium">Pending Applications</h3>
                      <p className="text-sm text-gray-500">{stats.pendingApplications}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Total Destinations</h3>
                      <p className="text-sm text-gray-500">{stats.destinations}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Total Activities</h3>
                      <p className="text-sm text-gray-500">{stats.activities}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Unassigned Bookings</h3>
                      <p className="text-sm text-gray-500">{stats.unassignedBookings}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}