"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Award,
  FileText,
  Loader2,
  ChevronRight,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploader } from "../../components/file-uploader";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  tourGuideService,
  uploadService,
  destinationsService,
  activitiesService,
  apiUtils,
} from "@/app/services/api";
import { RouteProtection } from "@/components/route-protection";
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner";

export default function TourGuideCompleteProfile() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [licenseFile, setLicenseFile] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [destinations, setDestinations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    destination_id: "",
    description: "",
    activities: [],
  });

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const destinationsData = await destinationsService.getAllDestinations();
        setDestinations(destinationsData);
      } catch (error) {
        console.error("Error loading destinations:", error);
        toast.error("Failed to load destinations");
      } finally {
        setIsLoadingDestinations(false);
      }
    };

    loadDestinations();
  }, []);

  // Load activities when destination changes
  useEffect(() => {
    const loadActivities = async () => {
      if (!formData.destination_id) {
        setActivities([]);
        return;
      }

      setIsLoadingActivities(true);
      try {
        const activitiesData =
          await activitiesService.getActivitiesByDestination(
            formData.destination_id,
          );
        // Backend returns { message, activities } - extract the activities array
        const activities = Array.isArray(activitiesData.activities) ? activitiesData.activities : 
                          Array.isArray(activitiesData) ? activitiesData : []
        setActivities(activities);
      } catch (error) {
        console.error("Error loading activities:", error);
        toast.error("Failed to load activities");
        setActivities([]);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    loadActivities();
  }, [formData.destination_id]);

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

          // If user is active or pending approval, redirect them away
          if (data.status === "active") {
            router.push("/tour-guide/dashboard");
            return;
          } else if (data.status === "pending_approval") {
            router.push("/tour-guide/pending-status");
            return;
          } else if (data.status === "rejected") {
            // Allow rejected users to resubmit
            setUserStatus("rejected");
          }
        } catch (error) {
          if (error.response?.status === 404) {
            // No profile exists - this is expected for new users
            setUserStatus("pending_profile");
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
  }, [router]);

  // Show loading while checking access
  if (isCheckingAccess) {
    return <LoadingSpinner message="Checking access..." />;
  }

  // Don't render if user shouldn't have access
  if (userStatus !== "pending_profile" && userStatus !== "rejected") {
    return null;
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value,
      };

      // Clear activities when destination changes
      if (field === "destination_id") {
        newData.activities = [];
      }

      return newData;
    });
  };

  const toggleActivity = (activityId) => {
    setFormData((prev) => {
      const currentActivities = prev.activities || [];
      const isSelected = currentActivities.includes(parseInt(activityId));

      return {
        ...prev,
        activities: isSelected
          ? currentActivities.filter((id) => id !== parseInt(activityId))
          : [...currentActivities, parseInt(activityId)],
      };
    });
  };

  const handleFileChange = (files) => {
    if (files.length > 0) {
      setLicenseFile(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!formData.destination_id) {
      toast.error("Please select your destination");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    if (!licenseFile) {
      toast.error("Please upload your tour guide license");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload license document first
      setIsUploading(true);
      const { url: licenseUrl } =
        await uploadService.uploadDocument(licenseFile);
      setIsUploading(false);

      // Create profile with uploaded document URL
      const profileData = {
        full_name: formData.fullName.trim(),
        destination_id: parseInt(formData.destination_id),
        description: formData.description.trim(),
        activities: formData.activities,
        license_document_url: licenseUrl,
      };

      await tourGuideService.createProfile(profileData);

      toast.success("Tour guide profile completed successfully!", {
        description: "Your profile is now under review by administrators.",
      });

      // Redirect to pending status page after successful submission
      setTimeout(() => {
        router.push("/tour-guide/pending-status");
      }, 1500);
    } catch (error) {
      console.error("Profile submission error:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
      });

      // Show more specific error messages
      if (error.response?.status === 404) {
        toast.error(
          "Profile creation endpoint not found. Please contact support.",
        );
      } else if (error.response?.status === 403) {
        toast.error(
          "You don't have permission to create a profile. Please check your account status.",
        );
      } else if (error.response?.status === 400) {
        toast.error(
          error.response?.data?.message ||
            "Invalid data provided. Please check your inputs.",
        );
      } else {
        toast.error(
          error.message || "Failed to complete profile. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <RouteProtection allowedRoles={["tour_guide"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="bg-amber-700 p-6 rounded-lg mb-6 text-center">
            <User className="h-12 w-12 text-white mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              {userStatus === "rejected"
                ? "Resubmit Your Tour Guide Profile"
                : "Complete Your Tour Guide Profile"}
            </h1>
            <p className="text-amber-100">
              {userStatus === "rejected"
                ? "Your previous application was rejected. Please review the feedback and resubmit your professional details."
                : "Provide your professional details to submit your application to offer tour guide services on our platform."}
            </p>
          </div>

          {/* Profile Completion Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 text-amber-600 mr-2" />
                Tour Guide Information
              </CardTitle>
              <CardDescription>
                Please provide accurate information as this will be used for
                verification purposes
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="fullName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Full Name *
                    </label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      placeholder="Enter your full legal name"
                      className="border-gray-300 focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="destination"
                      className="text-sm font-medium text-gray-700"
                    >
                      Destination *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10" />
                      <Select
                        value={formData.destination_id}
                        onValueChange={(value) =>
                          handleInputChange("destination_id", value)
                        }
                        disabled={isLoadingDestinations}
                      >
                        <SelectTrigger className="pl-10 border-gray-300 focus:border-amber-500">
                          <SelectValue
                            placeholder={
                              isLoadingDestinations
                                ? "Loading destinations..."
                                : "Select your destination"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {(destinations || []).map((destination) => (
                            <SelectItem
                              key={destination.id}
                              value={destination.id.toString()}
                            >
                              {destination.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Activities */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Activities *
                  </label>
                  <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                    {!formData.destination_id ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Please select a destination first to see available
                        activities
                      </p>
                    ) : isLoadingActivities ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Loading activities...
                      </p>
                    ) : activities.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No activities available for this destination
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {(activities || []).map((activity) => {
                          const isSelected = formData.activities.includes(
                            activity.id,
                          );
                          return (
                            <div
                              key={activity.id}
                              className="flex items-center space-x-3"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  toggleActivity(activity.id.toString())
                                }
                                className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                              />
                              <label className="text-sm font-medium text-gray-700 cursor-pointer">
                                {activity.name}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="text-sm font-medium text-gray-700"
                  >
                    Description *
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe your background, experience, and what makes you a great tour guide."
                    className="min-h-[100px] border-gray-300 focus:border-amber-500"
                    required
                  />
                </div>

                {/* License Upload */}
                <div className="space-y-2">
                  <label
                    htmlFor="license"
                    className="text-sm font-medium text-gray-700"
                  >
                    Tour Guide License/Certification *
                  </label>
                  <FileUploader
                    onChange={handleFileChange}
                    maxFiles={1}
                    acceptedFileTypes="application/pdf,image/*"
                    value={licenseFile ? [licenseFile] : []}
                    uploadPrompt="Upload your tour guide license or certification"
                  />
                </div>
              </CardContent>

              <CardFooter className="bg-gray-50 border-t">
                <div className="w-full flex flex-col sm:flex-row gap-3 sm:justify-between">
                  <div></div>

                  <Button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={isSubmitting || isUploading}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isUploading ? "Uploading..." : "Submitting..."}
                      </>
                    ) : (
                      <>
                        Complete Profile
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </RouteProtection>
  );
}
