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
  Car,
  Package,
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
import { travelAgentService, apiUtils, authService } from "@/app/services/api";
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner";
import { formatTZS } from "@/app/utils/currency";
import { getUserData, clearAuthData, getAuthToken } from "../../utils/auth";

export default function TravelAgentPendingStatusPage() {
  const router = useRouter();
  const [userStatus, setUserStatus] = useState(null);
  const [agencyData, setAgencyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const checkStatusAndFetchData = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        try {
          const data = await travelAgentService.getProfile();
          setUserStatus(data.status || "pending_approval");
          setAgencyData(data);

          // If user is active, show congratulations instead of redirecting
          if (data.status === "active") {
            // Don't redirect automatically, let user click button
          }

          // If user hasn't completed profile, redirect to complete profile
          if (data.status === "pending_profile" || !data.status) {
            router.push("/travel-agent/complete-profile");
            return;
          }
        } catch (error) {
          if (error.response?.status === 404) {
            // No profile exists, redirect to complete profile
            router.push("/travel-agent/complete-profile");
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

  const handleGoToDashboard = async () => {
    setIsLoggingIn(true);
    try {
      // Refresh the token to get updated user status
      const refreshResponse = await authService.refreshToken();

      // Update local storage with new token and user data
      localStorage.setItem("token", refreshResponse.token);
      localStorage.setItem("userData", JSON.stringify(refreshResponse.user));

      // Navigate to dashboard
      router.push("/travel-agent/dashboard");
    } catch (error) {
      console.error("Error refreshing token:", error);
      // If refresh fails, try to go to dashboard anyway
      router.push("/travel-agent/dashboard");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const getStatusDisplay = () => {
    switch (userStatus) {
      case "active":
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: "Congratulations! Application Approved",
          message:
            "Your travel agency profile has been approved! You can now access your dashboard and start managing transport bookings.",
          color: "green",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "pending_approval":
        return {
          icon: <Clock className="h-8 w-8 text-amber-500" />,
          title: "Application Under Review",
          message:
            "Your travel agency profile has been submitted successfully and is currently being reviewed by our administrators.",
          color: "amber",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
        };
      case "rejected":
        return {
          icon: <XCircle className="h-8 w-8 text-red-500" />,
          title: "Application Rejected",
          message:
            "We regret to inform you that your travel agency profile application has been rejected. Please check your email for further details",
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
      {agencyData && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Agency Information
              </CardTitle>
              <CardDescription>
                Basic details about your travel agency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Agency Name
                </label>
                <p className="text-lg font-semibold">{agencyData.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Contact Email
                </label>
                <div className="flex items-center mt-1">
                  <Mail className="h-4 w-4 text-gray-400 mr-1" />
                  <p>{agencyData.contact_email}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Contact Phone
                </label>
                <div className="flex items-center mt-1">
                  <Phone className="h-4 w-4 text-gray-400 mr-1" />
                  <p>{agencyData.contact_phone}</p>
                </div>
              </div>

              {agencyData.document_url && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    License Document
                  </label>
                  <div className="flex items-center mt-1">
                    <Globe className="h-4 w-4 text-gray-400 mr-1" />
                    <a
                      href={agencyData.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Document
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Routes Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Car className="h-5 w-5 mr-2 text-green-600" />
                Transport Routes
              </CardTitle>
              <CardDescription>
                Available transportation services
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agencyData.routes && agencyData.routes.length > 0 ? (
                <div className="space-y-3">
                  {agencyData.routes.slice(0, 3).map((route, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="font-medium">
                            {route.transportation_type}
                          </span>
                        </div>
                        <Badge variant="outline">{formatTZS(route.cost)}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Origin: {route.origin_name || "Unknown"} → Destination:{" "}
                        {route.destination_name || "Unknown"}
                      </p>
                      {route.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {route.description}
                        </p>
                      )}
                    </div>
                  ))}
                  {agencyData.routes.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      And {agencyData.routes.length - 3} more routes...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No routes submitted
                </p>
              )}
            </CardContent>
          </Card>
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
