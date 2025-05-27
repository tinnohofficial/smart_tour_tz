"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Briefcase, Map, BarChart, Users, Calendar, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDashboardStore } from "./dashboardStore"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function TravelAgentDashboard() {
  const router = useRouter()
  const { stats, isLoading, userStatus, fetchDashboardData } = useDashboardStore()

  useEffect(() => {
    fetchDashboardData(router)
  }, [router, fetchDashboardData])

  // Content for when user needs to complete profile
  if (userStatus === "pending_profile") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Briefcase className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Welcome to Smart Tour Tanzania! Please complete your travel agency profile to get started.
              </p>
            </div>
          </div>
        </div>

        <Card className="text-center py-10">
          <CardContent>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              <Briefcase className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-gray-800">Set Up Your Travel Agency</h2>
            <p className="mt-2 text-gray-600 max-w-md mx-auto">
              To start managing bookings and transport routes, please complete your agency profile.
            </p>
            <Button className="mt-6 text-white bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/travel-agent/profile')}>
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Content for when user is pending approval
  if (userStatus === "pending_approval") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-10">
          <CardContent>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
              <Calendar className="h-10 w-10 text-yellow-600" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-gray-800">Application Under Review</h2>
            <p className="mt-2 text-gray-600 max-w-md mx-auto">
              Your travel agency profile has been submitted and is currently under review. You&apos;ll be notified once the approval process is complete.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button 
          onClick={() => router.push('/travel-agent/routes')}
          className="text-white bg-blue-600 hover:bg-blue-700">
          Manage Routes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
            <div className="bg-orange-100 p-2 rounded-md">
              <Calendar className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.pendingBookings}</div>
            <p className="text-xs text-gray-500 mt-1">Need your attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Completed Bookings</CardTitle>
            <div className="bg-green-100 p-2 rounded-md">
              <Users className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.completedBookings}</div>
            <p className="text-xs text-gray-500 mt-1">Successfully processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Routes</CardTitle>
            <div className="bg-blue-100 p-2 rounded-md">
              <Car className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "..." : stats.totalRoutes}</div>
            <p className="text-xs text-gray-500 mt-1">Active transport routes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <div className="bg-purple-100 p-2 rounded-md">
              <BarChart className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${isLoading ? "..." : stats.monthlyRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">From confirmed bookings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-2">
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest transport bookings to process</CardDescription>
            </div>
            <Link href="/travel-agent/bookings">
              <Button variant="outline" className="h-8">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : stats.pendingBookings > 0 ? (
              <div className="space-y-4">
                {Array(Math.min(stats.pendingBookings, 3)).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center">
                      <div className="bg-gray-100 rounded-full p-2 mr-3">
                        <Car className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">Booking #{10001 + i}</div>
                        <div className="text-xs text-gray-500">Dar es Salaam to Zanzibar</div>
                      </div>
                    </div>
                    <Link href="/travel-agent/bookings">
                      <Button variant="ghost" size="sm">Process</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No pending bookings to process
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}