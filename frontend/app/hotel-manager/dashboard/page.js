"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Hotel,
  Bed,
  BarChart3,
  Clock,
  Calendar,
  Loader2,
  Percent,
  User,
  ArrowRight,
  CheckCircle,
  CalendarClock,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDashboardStore } from "./store";
import { format } from "date-fns";
import { formatDateWithFormat } from "@/app/utils/dateUtils";
import { formatTZS } from "@/app/utils/currency";
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner";
import { hotelManagerService, apiUtils } from "@/app/services/api";

export default function HotelManagerDashboard() {
  const { stats, recentBookings, isLoading, error, fetchDashboardData } =
    useDashboardStore();
  const router = useRouter();
  const [userStatus, setUserStatus] = useState(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        try {
          const data = await hotelManagerService.getProfile();
          setUserStatus(data.status || "pending_profile");

          // Only allow access if user is active
          if (data.status !== "active") {
            if (data.status === "pending_profile" || !data.status) {
              router.push("/hotel-manager/complete-profile");
            } else {
              // For pending_approval status, redirect to pending-status page
              router.push("/hotel-manager/pending-status");
            }
            return;
          }

          // User is active, fetch dashboard data
          fetchDashboardData();
        } catch (error) {
          if (error.response?.status === 404) {
            // No profile exists, redirect to complete profile
            router.push("/hotel-manager/complete-profile");
            return;
          } else {
            console.error("Error fetching profile:", error);
            apiUtils.handleAuthError(error, router);
            return;
          }
        }
      } catch (error) {
        console.error("Error checking access:", error);
        router.push("/login");
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [fetchDashboardData, router]);

  // Show loading while checking access
  if (isCheckingAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if user is not active
  if (userStatus !== "active") {
    return null;
  }

  const formatDate = (dateString) =>
    formatDateWithFormat(dateString, "MMM dd, yyyy", "Invalid date");

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard data..." />;
  }

  return (
    <div className="container px-2 sm:px-4 mx-auto max-w-7xl">
      {/* Page Header */}
      <div className="bg-amber-700 p-4 sm:p-6 rounded-lg mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">
              Dashboard
            </h1>
            <p className="text-amber-100 text-sm">
              Welcome to your hotel management dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6">
        {/* Pending Bookings Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Pending Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-3 sm:mr-4 rounded-full bg-yellow-100 p-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold">
                  {stats.pendingBookings}
                </div>
                <div className="text-xs text-gray-500">
                  Awaiting room assignment
                </div>
              </div>
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 h-full w-1.5 bg-yellow-500" />
        </Card>

        {/* Occupancy Rate Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Current Occupancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-3 sm:mr-4 rounded-full bg-emerald-100 p-2">
                <Percent className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold">
                  {stats.occupancyRate}%
                </div>
                <div className="text-xs text-gray-500">
                  {stats.currentOccupancy} of{" "}
                  {stats.currentOccupancy +
                    (stats.occupancyRate > 0
                      ? Math.round(
                          stats.currentOccupancy * (100 / stats.occupancyRate) -
                            stats.currentOccupancy,
                        )
                      : 0)}{" "}
                  rooms
                </div>
              </div>
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 h-full w-1.5 bg-emerald-500" />
        </Card>

        {/* Total Bookings Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-3 sm:mr-4 rounded-full bg-amber-100 p-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-amber-700" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold">
                  {stats.totalBookings}
                </div>
                <div className="text-xs text-gray-500">
                  {stats.confirmedBookings} confirmed
                </div>
              </div>
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 h-full w-1.5 bg-amber-700" />
        </Card>

        {/* Monthly Revenue Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="mr-3 sm:mr-4 rounded-full bg-blue-100 p-2"></div>
              <div>
                <div className="text-xl sm:text-2xl font-bold">
                  {formatTZS(stats.revenueThisMonth)}
                </div>
                <div className="text-xs text-gray-500">This month</div>
              </div>
            </div>
          </CardContent>
          <div className="absolute right-0 top-0 h-full w-1.5 bg-blue-500" />
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        {/* Recent Bookings Card */}
        <Card className="md:col-span-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Bookings</CardTitle>
              <CardDescription>Latest guest reservations</CardDescription>
            </div>
            <Button
              variant="outline"
              className="hidden sm:flex"
              onClick={() => router.push("/hotel-manager/bookings")}
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
                      <div className="text-sm text-gray-500">
                        {booking.email}
                      </div>
                    </TableCell>
                    <TableCell>{booking.roomType}</TableCell>
                    <TableCell>{formatDate(booking.checkIn)}</TableCell>
                    <TableCell>{formatDate(booking.checkOut)}</TableCell>
                    <TableCell className="text-right">
                      {formatTZS(booking.amount)}
                    </TableCell>
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
              onClick={() => router.push("/hotel-manager/bookings")}
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
            <CardDescription>Manage your hotel operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push("/hotel-manager/bookings")}
            >
              <CalendarClock className="mr-2 h-4 w-4 text-amber-700" />
              <span>Manage Bookings</span>
              {stats.pendingBookings > 0 && (
                <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-xs font-bold text-white">
                  {stats.pendingBookings}
                </div>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push("/hotel-manager/profile")}
            >
              <Hotel className="mr-2 h-4 w-4 text-emerald-600" />
              <span>Update Hotel Profile</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Content Can Be Added Here */}
    </div>
  );
}
