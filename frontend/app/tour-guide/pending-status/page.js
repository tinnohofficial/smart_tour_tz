"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Star,
  Mail,
  Phone,
  Globe,
  Image as ImageIcon,
  ArrowLeft,
  RefreshCw,
  Briefcase,
  Award,
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
import { tourGuideService, apiUtils } from "@/app/services/api";
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner";

export default function TourGuidePendingStatusPage() {
  const router = useRouter();
  const [userStatus, setUserStatus] = useState(null);
  const [guideData, setGuideData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkStatusAndFetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        try {
          const data = await tourGuideService.getProfile();
          setUserStatus(data.status || "pending_approval");
          setGuideData(data);

          // If user is active, redirect to dashboard
          if (data.status === "active") {
            router.push("/tour-guide/dashboard");
            return;
          }

          // If user hasn't completed profile, redirect to complete profile
          if (data.status === "pending_profile" || !data.status) {
            router.push("/tour-guide/complete-profile");
            return;
          }
        } catch (error) {
          if (error.response?.status === 404) {
            // No profile exists, redirect to complete profile
            router.push("/tour-guide/complete-profile");
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

  const getStatusDisplay = () => {
    switch (userStatus) {
      case "pending_approval":
        return {
          icon: <Clock className="h-8 w-8 text-amber-500" />,
          title: "Application Under Review",
          message:
            "Your tour guide profile has been submitted successfully and is currently being reviewed by our administrators.",
          color: "amber",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
        };
      case "rejected":
        return {
          icon: <XCircle className="h-8 w-8 text-red-500" />,
          title: "Application Rejected",
          message:
            "We regret to inform you that your tour guide profile application has been rejected. Please check you email inbox for more details",
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
            <p className="text-gray-700 mb-3">{statusDisplay.message}</p>
          </div>
        </CardContent>
      </Card>

      {/* Profile Preview */}
      {guideData && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Guide Information
              </CardTitle>
              <CardDescription>
                Basic details about your tour guide profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Full Name
                </label>
                <p className="text-lg font-semibold">{guideData.full_name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Location
                </label>
                <div className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                  <p>
                    {guideData.destination_name
                      ? guideData.destination_name
                      : "Not specified"}
                  </p>
                </div>
              </div>

              {guideData.license_document_url && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    License Document
                  </label>
                  <div className="flex items-center mt-1">
                    <Globe className="h-4 w-4 text-gray-400 mr-1" />
                    <a
                      href={guideData.license_document_url}
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

          {/* Activities Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-purple-600" />
                Activities
              </CardTitle>
              <CardDescription>Activities you can supervise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Description
                </label>
                <p className="text-gray-700 mt-1">
                  {guideData.description || "No description provided"}
                </p>
              </div>

              {guideData.activity_details &&
              Array.isArray(guideData.activity_details) &&
              guideData.activity_details.length > 0 ? (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Selected Activities
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {guideData.activity_details.map((activity, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-purple-50"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        {activity.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Selected Activities
                  </label>
                  <p className="text-gray-500 text-sm mt-1">
                    No activities selected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
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
    </div>
  );
}
