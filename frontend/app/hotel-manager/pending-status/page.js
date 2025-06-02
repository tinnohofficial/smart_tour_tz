"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle,
  XCircle,
  Building,
  MapPin,
  Users,
  Mail,
  Phone,
  Globe,
  Image as ImageIcon,
  ArrowLeft,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { hotelManagerService, apiUtils } from "@/app/services/api";
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner";
import { formatTZS } from "@/app/utils/currency";

export default function PendingStatusPage() {
  const router = useRouter();
  const [userStatus, setUserStatus] = useState(null);
  const [hotelData, setHotelData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const checkStatusAndFetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        try {
          const data = await hotelManagerService.getProfile();
          setUserStatus(data.status || "pending_approval");
          setHotelData(data);

          // If user is active, show congratulations instead of redirecting
          if (data.status === "active") {
            // Don't redirect automatically, let user click button
          }

          // If user hasn't completed profile, redirect to complete profile
          if (data.status === "pending_profile" || !data.status) {
            router.push("/hotel-manager/complete-profile");
            return;
          }
        } catch (error) {
          if (error.response?.status === 404) {
            // No profile exists, redirect to complete profile
            router.push("/hotel-manager/complete-profile");
            return;
          } else {
            console.error("Error fetching profile:", error);
            setError("Failed to load profile data");
            apiUtils.handleAuthError(error, router);
          }
        }
      } catch (error) {
        console.error("Error checking status:", error);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    checkStatusAndFetchData();
  }, [router]);

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    window.location.reload();
  };

  const handleGoToDashboard = () => {
    setIsLoggingIn(true);
    router.push("/hotel-manager/dashboard");
  };

  const getStatusDisplay = () => {
    switch (userStatus) {
      case "active":
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: "Congratulations! Application Approved",
          message:
            "Your hotel profile has been approved! You can now access your dashboard and start managing your hotel bookings.",
          color: "green",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "pending_approval":
        return {
          icon: <Clock className="h-8 w-8 text-amber-500" />,
          title: "Application Under Review",
          message:
            "Your hotel profile has been submitted successfully and is currently being reviewed by our administrators.",
          color: "amber",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
        };
      case "rejected":
        return {
          icon: <XCircle className="h-8 w-8 text-red-500" />,
          title: "Application Rejected",
          message:
            "We regret to inform you that your hotel profile application has been rejected. Check your email for further details.",
          color: "red",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      default:
        return {
          icon: <Clock className="h-8 w-8 text-gray-500" />,
          title: "Status Unknown",
          message:
            "Unable to determine your current application status. Please contact support for assistance.",
          color: "gray",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading application status..." />;
  }

  if (error) {
    return (
      <div className="container px-4 mx-auto max-w-4xl py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-700 mb-2">
                Error Loading Data
              </h2>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay();

  return (
    <div className="container px-4 mx-auto max-w-6xl py-6">
      {/* Status Header */}
      <Card
        className={`${statusDisplay.bgColor} ${statusDisplay.borderColor} border-2 mb-6`}
      >
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mb-4">{statusDisplay.icon}</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {statusDisplay.title}
            </h1>
            <p className="text-gray-700 mb-4">{statusDisplay.message}</p>
            
            {userStatus === "active" && (
              <Button
                onClick={handleGoToDashboard}
                disabled={isLoggingIn}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Preview */}
      {hotelData && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Hotel Name
                </label>
                <p className="text-lg font-semibold">{hotelData.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Location
                </label>
                <div className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                  <p>{hotelData.location}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Description
                </label>
                <p className="text-gray-700 mt-1">{hotelData.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Capacity and Pricing */}
          <Card>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Room Capacity
                </label>
                <div className="flex items-center mt-1">
                  <Users className="h-4 w-4 text-gray-400 mr-1" />
                  <p className="text-lg font-semibold">
                    {hotelData.capacity} rooms
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Base Price per Night
                </label>
                <div className="flex items-center mt-1">
                  <p className="text-lg font-semibold text-green-600">
                    {formatTZS(hotelData.base_price_per_night)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          {hotelData.images && hotelData.images.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Hotel Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {hotelData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Hotel image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          e.target.src = "/placeholder-image.png";
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {userStatus !== "active" && (
        <div className="mt-8 text-center space-y-4">
          <Separator />
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
