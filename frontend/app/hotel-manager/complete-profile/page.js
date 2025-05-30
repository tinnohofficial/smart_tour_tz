"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Hotel,
  Building,
  Loader2,
  ChevronRight,
  CheckCircle2,
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
import { hotelManagerService, uploadService, apiUtils } from "@/app/services/api";
import { RouteProtection } from "@/components/route-protection";
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner";

export default function HotelManagerCompleteProfile() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hotelImages, setHotelImages] = useState([]);
  const [userStatus, setUserStatus] = useState(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    capacity: "",
    base_price_per_night: "",
  });

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        try {
          const data = await hotelManagerService.getProfile()
          setUserStatus(data.status || 'pending_profile')
          
          // If user is active or pending approval, redirect them away
          if (data.status === 'active') {
            router.push('/hotel-manager/dashboard')
            return
          } else if (data.status === 'pending_approval') {
            router.push('/hotel-manager/pending-status')
            return
          } else if (data.status === 'rejected') {
            // Allow rejected users to resubmit
            setUserStatus('rejected')
          }
        } catch (error) {
          if (error.response?.status === 404) {
            // No profile exists - this is expected for new users
            setUserStatus('pending_profile')
          } else {
            console.error('Error fetching profile:', error)
            apiUtils.handleAuthError(error, router)
            return
          }
        }
      } catch (error) {
        console.error("Error checking access:", error)
        router.push('/login')
      } finally {
        setIsCheckingAccess(false)
      }
    }

    checkAccess()
  }, [router])

  // Show loading while checking access
  if (isCheckingAccess) {
    return <LoadingSpinner message="Checking access..." />
  }

  // Don't render if user shouldn't have access
  if (userStatus !== 'pending_profile' && userStatus !== 'rejected') {
    return null
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (files) => {
    setHotelImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter your hotel name");
      return;
    }

    if (!formData.location.trim()) {
      toast.error("Please enter your hotel location");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please provide a hotel description");
      return;
    }

    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      toast.error("Please enter a valid room capacity");
      return;
    }

    if (
      !formData.base_price_per_night ||
      parseFloat(formData.base_price_per_night) <= 0
    ) {
      toast.error("Please enter a valid price per night");
      return;
    }

    if (hotelImages.length === 0) {
      toast.error("Please upload at least one hotel image");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload hotel images first
      setIsUploading(true);
      const uploadedImageUrls = [];

      for (const imageFile of hotelImages) {
        const { url } = await uploadService.uploadImage(imageFile);
        uploadedImageUrls.push(url);
      }
      setIsUploading(false);

      // Create hotel profile
      const profileData = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        description: formData.description.trim(),
        capacity: parseInt(formData.capacity),
        base_price_per_night: parseFloat(formData.base_price_per_night),
        images: uploadedImageUrls,
      };

      await hotelManagerService.createProfile(profileData);

      toast.success("Hotel profile completed successfully!", {
        description: "Your hotel is now under review by administrators.",
      });

      // Redirect to pending status page after successful submission
      setTimeout(() => {
        router.push("/hotel-manager/pending-status");
      }, 1500);
    } catch (error) {
      console.error("Profile submission error:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
      });

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to complete profile. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <RouteProtection allowedRoles={["hotel_manager"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="container max-w-3xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="bg-amber-700 p-6 rounded-lg mb-6 text-center">
            <Hotel className="h-12 w-12 text-white mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              {userStatus === 'rejected' ? 'Resubmit Your Hotel Profile' : 'Complete Your Hotel Profile'}
            </h1>
            <p className="text-amber-100">
              {userStatus === 'rejected' 
                ? 'Your previous application was rejected. Please review the feedback and resubmit your hotel details.'
                : 'Provide your hotel details to submit your application to offer services on our platform.'
              }
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Hotel Name *
                    </label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
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
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="capacity"
                      className="text-sm font-medium text-gray-700"
                    >
                      Capacity (number of rooms) *
                    </label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) =>
                        handleInputChange("capacity", e.target.value)
                      }
                      className="border-gray-300 focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="base_price_per_night"
                      className="text-sm font-medium text-gray-700"
                    >
                      Price Per Night (TZS) *
                    </label>
                    <Input
                      id="base_price_per_night"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.base_price_per_night}
                      onChange={(e) =>
                        handleInputChange(
                          "base_price_per_night",
                          e.target.value,
                        )
                      }
                      className="border-gray-300 focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="description"
                    className="text-sm font-medium text-gray-700"
                  >
                    Hotel Description *
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Any extra information about your hotel..."
                    className="min-h-[80px] border-gray-300 focus:border-amber-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="images"
                    className="text-sm font-medium text-gray-700"
                  >
                    Hotel Images *
                  </label>
                  <FileUploader
                    onChange={handleFileChange}
                    maxFiles={5}
                    acceptedFileTypes="image/*"
                    value={hotelImages}
                    uploadPrompt="Upload hotel images"
                  />
                  <p className="text-sm text-gray-500">Maximum 5 images.</p>
                </div>
              </CardContent>

              <CardFooter className="bg-gray-50 border-t">
                <div className="w-full flex justify-between">
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
