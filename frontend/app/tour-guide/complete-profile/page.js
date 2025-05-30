"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Award,
  FileText,
  Loader2,
  ChevronRight,
  CheckCircle2,
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileUploader } from "../../components/file-uploader";
import { toast } from "sonner";
import { tourGuideService, uploadService, apiUtils } from "@/app/services/api";
import { RouteProtection } from "@/components/route-protection";
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner";

export default function TourGuideCompleteProfile() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [licenseFile, setLicenseFile] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    location: "",
    expertise: "",
  });

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
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

    if (!formData.location.trim()) {
      toast.error("Please enter your location");
      return;
    }

    if (!formData.expertise.trim()) {
      toast.error("Please describe your expertise");
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
        location: formData.location.trim(),
        expertise: formData.expertise.trim(),
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {userStatus === "rejected"
                ? "Resubmit Your Tour Guide Profile"
                : "Complete Your Tour Guide Profile"}
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {userStatus === "rejected"
                ? "Your previous application was rejected. Please review the feedback and resubmit your professional details."
                : "Welcome to Smart Tour Tanzania! Please provide your professional details to complete your registration. Your profile will be reviewed by our administrators before activation."}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">
                  Account Created
                </span>
              </div>
              <div className="w-8 h-1 bg-amber-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">2</span>
                </div>
                <span className="ml-2 text-sm font-medium text-amber-600">
                  Complete Profile
                </span>
              </div>
              <div className="w-8 h-1 bg-gray-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 text-sm font-medium">3</span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-500">
                  Admin Approval
                </span>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <FileText className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800">
              Important Information
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              After completing your profile, it will be submitted for review.
              You'll receive access to full tour guide features once approved by
              our administrators. This typically takes 1-2 business days.
            </AlertDescription>
          </Alert>

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
                      htmlFor="location"
                      className="text-sm font-medium text-gray-700"
                    >
                      Location *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          handleInputChange("location", e.target.value)
                        }
                        className="pl-10 border-gray-300 focus:border-amber-500"
                        placeholder="City, Region, Tanzania"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Expertise */}
                <div className="space-y-2">
                  <label
                    htmlFor="expertise"
                    className="text-sm font-medium text-gray-700"
                  >
                    Areas of Expertise *
                  </label>
                  <Textarea
                    id="expertise"
                    value={formData.expertise}
                    onChange={(e) =>
                      handleInputChange("expertise", e.target.value)
                    }
                    placeholder="Describe your tour guiding experience, specialties, languages spoken, types of tours you lead, certifications, etc."
                    className="min-h-[120px] border-gray-300 focus:border-amber-500"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Include details about your experience, certifications,
                    specialties, and languages you speak
                  </p>
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
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Required:</strong> Please upload a clear copy of
                      your tour guide license, certification, or relevant
                      qualification document (PDF or image format).
                    </p>
                  </div>
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

          {/* Next Steps Info */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              After submission, you'll be redirected to your dashboard where you
              can monitor your application status.
            </p>
          </div>
        </div>
      </div>
    </RouteProtection>
  );
}
