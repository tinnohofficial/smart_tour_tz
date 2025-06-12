"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar, Users, ChevronRight, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { useDashboardStore } from "./store";
import { ProfileCompletionBanner } from "../../components/profile-completion-status/ProfileCompletionBanner";
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner";
import { tourGuideService, apiUtils } from "@/app/services/api";

export default function TourGuideDashboard() {
  const router = useRouter();
  const [userStatus, setUserStatus] = useState(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const {
    userData,
    tours,
    isLoading,
    isAvailable,
    profileStatus,
    setIsAvailable,
    fetchDashboard,
  } = useDashboardStore();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        try {
          const data = await tourGuideService.getProfile();
          setUserStatus(data.status || "pending_profile");

          // Only allow access if user is active
          if (data.status !== "active") {
            if (data.status === "pending_profile" || !data.status) {
              router.push("/tour-guide/complete-profile");
            } else {
              // For pending_approval status, redirect to pending-status page
              router.push("/tour-guide/pending-status");
            }
            return;
          }

          // User is active, fetch dashboard data
          fetchDashboard();
        } catch (error) {
          if (error.response?.status === 404) {
            // No profile exists, redirect to complete profile
            router.push("/tour-guide/complete-profile");
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
  }, [fetchDashboard, router]);

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

  const handleAvailabilityChange = async (checked) => {
    if (profileStatus !== "active") {
      toast.error("You need to be approved to change availability");
      return;
    }

    try {
      await setIsAvailable(checked);
      if (checked) {
        toast.success("You are now available", {
          description: "You will be considered for new tour assignments.",
        });
      } else {
        toast.info("You are now unavailable", {
          description: "You will not receive new tour assignments.",
        });
      }
    } catch (error) {
      console.error("Availability update failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Smart Tour Tanzania...</p>
        </div>
      </div>
    );
  }

  const upcomingTours = tours.filter((t) => t.status === "upcoming");

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
      {/* Profile Completion Status */}
      <ProfileCompletionBanner
        userRole="tour_guide"
        profileStatus={profileStatus}
        hasProfile={!!userData}
      />

      {/* Header Section */}
      <div className="bg-amber-700 p-4 sm:p-6 mb-4 sm:mb-6 rounded-lg">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="w-full lg:w-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Tour Guide Dashboard
            </h1>
            <p className="text-amber-100 text-sm sm:text-base">
              Welcome back, {userData?.name || "Tour Guide"}
            </p>
          </div>

          {profileStatus === "active" && (
            <div className="w-full lg:w-auto bg-amber-800/40 rounded-lg px-3 sm:px-4 py-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <div className="flex-1">
                  <span className="text-sm text-white font-medium">
                    Availability Status
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isAvailable}
                    onCheckedChange={handleAvailabilityChange}
                    className="data-[state=checked]:bg-yellow-400"
                  />
                  <span className="text-xs text-white whitespace-nowrap">
                    {isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Content */}
      {profileStatus === "active" ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Upcoming Tours Card */}
            <Card className="bg-amber-50/50">
              <CardContent className="p-0">
                <div className="flex justify-between items-center">
                  <div className="p-4 sm:p-5">
                    <p className="text-sm font-medium text-gray-500">
                      Upcoming Tours
                    </p>
                    <div className="flex items-end gap-1 mt-2">
                      <p className="text-xl sm:text-2xl font-bold">
                        {upcomingTours.length}
                      </p>
                      <p className="text-xs text-gray-500 mb-1 ml-1">
                        scheduled
                      </p>
                    </div>
                    <Link
                      href="/tour-guide/bookings"
                      className="text-xs text-amber-700 mt-3 font-medium flex items-center hover:text-amber-800 transition-colors"
                    >
                      View Schedule
                      <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Link>
                  </div>
                  <div className="h-full flex items-center pr-4 sm:pr-5">
                    <div className="bg-amber-100 p-2 sm:p-3 rounded-full">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Tours Card */}
            <Card className="bg-blue-50/50">
              <CardContent className="p-0">
                <div className="flex justify-between items-center">
                  <div className="p-4 sm:p-5">
                    <p className="text-sm font-medium text-gray-500">
                      Total Assignments
                    </p>
                    <div className="flex items-end gap-1 mt-2">
                      <p className="text-xl sm:text-2xl font-bold">
                        {tours.length}
                      </p>
                      <p className="text-xs text-gray-500 mb-1 ml-1">
                        all time
                      </p>
                    </div>
                    <Link
                      href="/tour-guide/bookings"
                      className="text-xs text-blue-600 mt-3 font-medium flex items-center hover:text-blue-700 transition-colors"
                    >
                      View All
                      <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Link>
                  </div>
                  <div className="h-full flex items-center pr-4 sm:pr-5">
                    <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Profile Overview */}
            <div className="lg:col-span-4">
              <Card>
                <CardHeader className="flex flex-row justify-between items-center pb-2 pt-4 sm:pt-5 px-4 sm:px-6">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                    Profile Overview
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-amber-700 hover:text-amber-800 p-0"
                    asChild
                  >
                    <Link href="/tour-guide/profile">
                      Edit
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center px-4 sm:px-6">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 bg-amber-700 mb-4">
                    <AvatarImage
                      src={userData?.profileImage}
                      alt={userData?.name}
                    />
                    <AvatarFallback>
                      {userData?.name?.charAt(0) || "T"}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900">
                    {userData?.name || "Tour Guide"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {userData?.location || "Tanzania"}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3 justify-center">
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                      Tour Guide
                    </Badge>
                  </div>

                  {userData?.description && (
                    <div className="w-full mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700 text-left">
                        {userData.description}
                      </p>
                    </div>
                  )}

                  <Button
                    className="w-full text-white bg-amber-700 hover:bg-amber-800 mt-4"
                    size="sm"
                    asChild
                  >
                    <Link href="/tour-guide/profile">Edit Profile</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Tours Section */}
            <div className="lg:col-span-8">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 pt-4 sm:pt-5 px-4 sm:px-6 gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                      Upcoming Tours
                    </h3>
                    <p className="text-sm text-gray-500">
                      Your scheduled tour assignments
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-full sm:w-auto"
                    asChild
                  >
                    <Link href="/tour-guide/bookings">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-5">
                  {upcomingTours.length > 0 ? (
                    upcomingTours.slice(0, 3).map((tour) => (
                      <div
                        key={tour.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 py-4 border-b last:border-0"
                      >
                        <div className="flex-shrink-0 relative h-16 w-20 sm:w-20 rounded-md overflow-hidden bg-gray-200">
                          <Image
                            src={tour.image || "/placeholder.svg"}
                            alt={tour.destination}
                            className="h-full w-full object-cover"
                            fill
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                {tour.destination}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {new Date(tour.startDate).toLocaleDateString()}{" "}
                                - {new Date(tour.endDate).toLocaleDateString()}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs sm:text-sm text-gray-500">
                                  Tourist: {tour.touristEmail}
                                </span>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-xs whitespace-nowrap"
                            >
                              {new Date(tour.startDate) > new Date()
                                ? "Upcoming"
                                : "Active"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center">
                      <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-300" />
                      <p className="mt-3 text-gray-500 font-medium text-sm sm:text-base">
                        No upcoming tours scheduled
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-md mx-auto px-4">
                        When you&apos;re assigned to guide a tour, it will
                        appear here. Make sure your availability is turned on.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-amber-500 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            {profileStatus === "pending_profile"
              ? "Complete Your Profile"
              : profileStatus === "pending_approval"
                ? "Profile Under Review"
                : "Getting Started"}
          </h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {profileStatus === "pending_profile"
              ? "Please complete your tour guide profile to start receiving tour assignments and access all dashboard features."
              : profileStatus === "pending_approval"
                ? "Your profile is currently being reviewed by our administrators. You'll receive full access once approved."
                : "Set up your tour guide profile to get started."}
          </p>
          {profileStatus === "pending_profile" && (
            <Button asChild className="bg-amber-600 hover:bg-amber-700">
              <Link href="/tour-guide/complete-profile">
                Complete Profile Now
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
