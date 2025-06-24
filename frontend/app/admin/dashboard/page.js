"use client";

import { useEffect } from "react"; // Removed useState
import { create } from "zustand"; // Import zustand
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  MapPin,
  Activity,
  Calendar,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import {
  applicationsService,
  destinationsService,
  activitiesService,
  bookingsService,
} from "@/app/services/api";
import blockchainService from "@/app/services/blockchainService";

const useAdminDashboardStore = create((set) => ({
  // Initial State
  isLoading: true,
  stats: {
    pendingApplications: 0,
    destinations: 0,
    activities: 0,
    unassignedBookings: 0,
    vaultBalance: 0,
  },
  error: null,

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setStats: (newStats) =>
    set((state) => ({ stats: { ...state.stats, ...newStats } })),
  setError: (errorMessage) => set({ error: errorMessage }),

  // Action to fetch all data and update state
  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Initialize blockchain service and get vault balance
      let vaultBalance = 0;
      try {
        await blockchainService.initialize();
        const adminInit = await blockchainService.initializeAdmin();
        if (adminInit) {
          const balance = await blockchainService.getVaultTotalBalance();
          vaultBalance = parseFloat(balance) || 0;
        } else {
          console.warn("Admin not initialized, skipping vault balance");
        }
      } catch (vaultError) {
        console.warn("Could not fetch vault balance:", vaultError);
        vaultBalance = 0;
      }

      // Fetch data in parallel
      const [
        pendingApplications,
        destinations,
        activities,
        unassignedBookings,
      ] = await Promise.all([
        applicationsService.getPendingApplications(),
        destinationsService.getAllDestinations(),
        activitiesService.getAllActivities(),
        bookingsService.getUnassignedBookings(),
      ]);

      set({
        stats: {
          pendingApplications: pendingApplications.length,
          destinations: destinations.length,
          activities: activities.length,
          unassignedBookings: unassignedBookings.length,
          vaultBalance: vaultBalance,
        },
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      set({ error: "Failed to load dashboard data. Please try again later." });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default function AdminDashboard() {
  const isLoading = useAdminDashboardStore((state) => state.isLoading);
  const stats = useAdminDashboardStore((state) => state.stats);
  const error = useAdminDashboardStore((state) => state.error);
  const fetchDashboardData = useAdminDashboardStore(
    (state) => state.fetchDashboardData,
  );

  // Fetch data when the component mounts
  useEffect(() => {
    console.log("here in the admin dashboard useEffect");
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-gray-500 text-sm sm:text-base">
          Overview of your Smart Tour system.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Applications
            </CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-amber-700" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold">
                  {stats.pendingApplications}
                </div>
                <p className="text-xs text-gray-500">
                  {stats.pendingApplications > 0
                    ? "Waiting for approval"
                    : "No pending applications"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Destinations</CardTitle>
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-amber-700" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold">
                  {stats.destinations}
                </div>
                <p className="text-xs text-gray-500">
                  Total destinations in system
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities</CardTitle>
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-amber-700" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold">
                  {stats.activities}
                </div>
                <p className="text-xs text-gray-500">
                  Total activities available
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unassigned Bookings
            </CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-amber-700" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold">
                  {stats.unassignedBookings}
                </div>
                <p className="text-xs text-gray-500">
                  {stats.unassignedBookings > 0
                    ? "Waiting for guide assignment"
                    : "No unassigned bookings"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vault Balance</CardTitle>
            <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-amber-700" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold">
                  {stats.vaultBalance.toLocaleString()} TZC
                </div>
                <p className="text-xs text-gray-500">
                  Available for withdrawal
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Actions and Overview */}
      <h3 value="actions">Quick Actions</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Account Approvals
            </CardTitle>
            <CardDescription className="text-sm">
              Review and approve pending account applications
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button
              asChild
              className="text-white bg-amber-700 hover:bg-amber-800 w-full sm:w-auto text-sm"
            >
              <Link href="/admin/applications">Manage Applications</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Destinations</CardTitle>
            <CardDescription className="text-sm">
              Manage tourist destinations in the system
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button
              asChild
              className="text-white bg-amber-700 hover:bg-amber-800 w-full sm:w-auto text-sm"
            >
              <Link href="/admin/destinations">Manage Destinations</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Activities</CardTitle>
            <CardDescription className="text-sm">
              Manage activities available at destinations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button
              asChild
              className="text-white bg-amber-700 hover:bg-amber-800 w-full sm:w-auto text-sm"
            >
              <Link href="/admin/activities">Manage Activities</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Tour Guide Assignments
            </CardTitle>
            <CardDescription className="text-sm">
              Assign tour guides to bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button
              asChild
              className="text-white bg-amber-700 hover:bg-amber-800 w-full sm:w-auto text-sm"
            >
              <Link href="/admin/assignments">Manage Assignments</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Withdraw Funds
            </CardTitle>
            <CardDescription className="text-sm">
              Withdraw TZC tokens from the Smart Tour vault
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button
              asChild
              className="text-white bg-amber-700 hover:bg-amber-800 w-full sm:w-auto text-sm"
            >
              <Link href="/admin/withdraw">Withdraw Funds</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
