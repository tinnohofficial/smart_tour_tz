"use client"

import { useEffect } from "react"
import { BarChart3, BedDouble, CalendarCheck, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { create } from "zustand"
import { toast } from "sonner"
import Link from "next/link"

// Mock data - replace with API calls later
const mockStats = {
  totalBookings: 25,
  availableRooms: 12,
  occupancyRate: "75%",
  pendingAssignments: 3,
  recentBookings: [
    {
      id: "B001",
      guestName: "John Smith",
      checkIn: "2025-05-01",
      checkOut: "2025-05-05",
      roomType: "Deluxe",
      guests: 2
    },
    {
      id: "B002",
      guestName: "Sarah Johnson",
      checkIn: "2025-05-03",
      checkOut: "2025-05-07",
      roomType: "Standard",
      guests: 1
    }
  ]
}

const useHotelDashboardStore = create((set) => ({
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
      set({ stats: mockStats, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
      toast.error("Failed to load dashboard data")
    }
  }
}))

export default function HotelManagerDashboard() {
  const { stats, isLoading, fetchDashboardData } = useHotelDashboardStore()

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  if (isLoading || !stats) {
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
        <h1 className="text-3xl font-bold">Hotel Dashboard</h1>
        <Button asChild>
          <Link href="/profile/hotelManager">Update Hotel Profile</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <CalendarCheck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Available Rooms</p>
                <p className="text-2xl font-bold">{stats.availableRooms}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <BedDouble className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
                <p className="text-2xl font-bold">{stats.occupancyRate}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Assignments</p>
                <p className="text-2xl font-bold">{stats.pendingAssignments}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Latest hotel bookings that require your attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{booking.guestName}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <p>{formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}</p>
                    <span>•</span>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {booking.guests}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{booking.roomType}</Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/hotel-manager/bookings">View Details</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}