"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Hotel, Bed, BarChart3, Clock, Calendar, Loader2, 
  DollarSign, Percent, User, ArrowRight, CheckCircle, CalendarClock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDashboardStore } from "./store"
import { format } from "date-fns"
import { formatDateWithFormat } from "@/app/utils/dateUtils"
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner"

export default function HotelManagerDashboard() {
  const { stats, recentBookings, isLoading, error, fetchDashboardData } = useDashboardStore()
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const formatDate = (dateString) => formatDateWithFormat(dateString, "MMM dd, yyyy", "Invalid date")

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard data..." />
  }

  return (
    <div className="container px-1">
      {/* Page Header */}
      <div className="bg-blue-600 p-4 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <p className="text-blue-100 text-sm">Welcome to your hotel management dashboard</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Pending Bookings Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-yellow-100 p-2">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.pendingBookings}</div>
                <div className="text-xs text-gray-500">Awaiting room assignment</div>
              </div>
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 h-full w-1.5 bg-yellow-500" />
        </Card>

        {/* Occupancy Rate Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Current Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-emerald-100 p-2">
                <Percent className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
                <div className="text-xs text-gray-500">{stats.currentOccupancy} of {stats.currentOccupancy + (stats.occupancyRate > 0 ? Math.round(stats.currentOccupancy * (100 / stats.occupancyRate) - stats.currentOccupancy) : 0)} rooms</div>
              </div>
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 h-full w-1.5 bg-emerald-500" />
        </Card>

        {/* Total Bookings Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-blue-100 p-2">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalBookings}</div>
                <div className="text-xs text-gray-500">{stats.confirmedBookings} confirmed</div>
              </div>
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 h-full w-1.5 bg-blue-500" />
        </Card>

        {/* Monthly Revenue Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-purple-100 p-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">${stats.revenueThisMonth}</div>
                <div className="text-xs text-gray-500">This month</div>
              </div>
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 h-full w-1.5 bg-purple-500" />
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        {/* Recent Bookings Card */}
        <Card className="md:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Bookings</CardTitle>
              <CardDescription>
                Latest guest reservations
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              className="hidden sm:flex"
              onClick={() => router.push('/hotel-manager/bookings')}
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room Type</TableHead>
                  <TableHead>Check-In</TableHead>
                  <TableHead>Check-Out</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">{booking.guestName}</div>
                      <div className="text-sm text-gray-500">{booking.email}</div>
                    </TableCell>
                    <TableCell>{booking.roomType}</TableCell>
                    <TableCell>{formatDate(booking.checkIn)}</TableCell>
                    <TableCell>{formatDate(booking.checkOut)}</TableCell>
                    <TableCell className="text-right">${booking.amount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-xs text-gray-500">
              Showing {recentBookings.length} most recent bookings
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="sm:hidden"
              onClick={() => router.push('/hotel-manager/bookings')}
            >
              View All
              <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
          </CardFooter>
        </Card>

        {/* Quick Actions Card */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Manage your hotel operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => router.push('/hotel-manager/bookings')}
            >
              <CalendarClock className="mr-2 h-4 w-4 text-blue-600" />
              <span>Manage Bookings</span>
              {stats.pendingBookings > 0 && (
                <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {stats.pendingBookings}
                </div>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => router.push('/hotel-manager/profile')}
            >
              <Hotel className="mr-2 h-4 w-4 text-emerald-600" />
              <span>Update Hotel Profile</span>
            </Button>

            <Button variant="outline" className="w-full justify-start">
              <User className="mr-2 h-4 w-4 text-amber-600" />
              <span>Manage Staff</span>
            </Button>

            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4 text-violet-600" />
              <span>View Reports</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Content Can Be Added Here */}
    </div>
  )
}