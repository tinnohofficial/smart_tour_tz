"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Briefcase,
  Car,
  Plus,
  Trash2,
  Loader2,
  ChevronRight,
  CheckCircle2,
  FileText,
  DollarSign,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileUploader } from "../../components/file-uploader";
import { toast } from "sonner";
import {
  travelAgentService,
  uploadService,
  destinationsService,
  apiUtils,
} from "@/app/services/api";
import { RouteProtection } from "@/components/route-protection";
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner";

export default function TravelAgentCompleteProfile() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [userStatus, setUserStatus] = useState(null);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [destinations, setDestinations] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [routes, setRoutes] = useState([
    {
      origin_name: "",
      destination_id: "",
      transportation_type: "bus",
      cost: "",
      description: "",
    },
  ]);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        try {
          const data = await travelAgentService.getProfile()
          setUserStatus(data.status || 'pending_profile')
          
          // If user is active or pending approval, redirect them away
          if (data.status === 'active') {
            router.push('/travel-agent/dashboard')
            return
          } else if (data.status === 'pending_approval') {
            router.push('/travel-agent/pending-status')
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

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const destinationsData = await destinationsService.getAllDestinations();
        setDestinations(destinationsData);
      } catch (error) {
        console.error("Error fetching origins and destinations:", error);
        toast.error("Failed to load origins and destinations");
      } finally {
        setIsLoadingData(false);
      }
    };

    checkAccess();
    fetchData();
  }, [router]);

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

  const handleRouteChange = (index, field, value) => {
    setRoutes((prev) =>
      prev.map((route, i) =>
        i === index ? { ...route, [field]: value } : route,
      ),
    );
  };

  const addRoute = () => {
    setRoutes((prev) => [
      ...prev,
      {
        origin_name: "",
        destination_id: "",
        transportation_type: "bus",
        cost: "",
        description: "",
      },
    ]);
  };

  const removeRoute = (index) => {
    if (routes.length > 1) {
      setRoutes((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleFileChange = (files) => {
    setDocumentFiles(files);
  };



  const getDestinationName = (destId) => {
    const destination = destinations.find((d) => d.id === parseInt(destId));
    return destination ? destination.name : "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter your agency name");
      return;
    }

    if (!formData.contactEmail.trim()) {
      toast.error("Please enter contact email");
      return;
    }

    if (!formData.contactPhone.trim()) {
      toast.error("Please enter contact phone");
      return;
    }

    if (documentFiles.length === 0) {
      toast.error("Please upload at least one business document");
      return;
    }

    // Validate routes
    const validRoutes = routes.filter(
      (route) =>
        route.origin_name &&
        route.origin_name.trim() &&
        route.destination_id &&
        route.cost &&
        parseFloat(route.cost) > 0,
    );

    if (validRoutes.length === 0) {
      toast.error("Please add at least one complete transport route");
      return;
    }

    // Validate that all routes have valid origin and destination IDs
    for (const route of validRoutes) {
      if (!route.origin_name || !route.origin_name.trim()) {
        toast.error("Please provide valid origin names for all routes");
        return;
      }
      if (!getDestinationName(route.destination_id)) {
        toast.error("Please select valid destinations for all routes");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Upload documents first
      setIsUploading(true);
      const uploadedDocUrls = [];

      for (const docFile of documentFiles) {
        const { url } = await uploadService.uploadDocument(docFile);
        uploadedDocUrls.push(url);
      }
      setIsUploading(false);

      // Create agency profile with routes
      const profileData = {
        name: formData.name.trim(),
        contact_email: formData.contactEmail.trim(),
        contact_phone: formData.contactPhone.trim(),
        document_url:
          uploadedDocUrls.length === 1
            ? uploadedDocUrls[0]
            : JSON.stringify(uploadedDocUrls),
        routes: validRoutes.map((route) => ({
          origin_name: route.origin_name.trim(),
          destination_id: parseInt(route.destination_id),
          transportation_type: route.transportation_type,
          cost: parseFloat(route.cost),
          description:
            route.description.trim() ||
            `Transport from ${route.origin_name.trim()} to ${getDestinationName(route.destination_id)} by ${route.transportation_type}`,
        })),
      };

      // Validate profile data before sending
      if (
        !profileData.name ||
        !profileData.contact_email ||
        !profileData.contact_phone
      ) {
        toast.error("Please fill in all required agency information");
        return;
      }

      if (!profileData.document_url) {
        toast.error("Document upload failed. Please try again.");
        return;
      }

      if (!profileData.routes || profileData.routes.length === 0) {
        toast.error("Please add at least one transport route");
        return;
      }

      console.log("Sending profile data:", profileData);

      await travelAgentService.createProfile(profileData);

      toast.success("Travel agency profile completed successfully!", {
        description: "Your agency is now under review by administrators.",
      });

      // Redirect to pending status page after successful submission
      setTimeout(() => {
        router.push("/travel-agent/pending-status");
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

  if (isLoadingData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <RouteProtection allowedRoles={["travel_agent"]}>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container max-w-5xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {userStatus === 'rejected' ? 'Resubmit Your Travel Agency Profile' : 'Complete Your Travel Agency Profile'}
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {userStatus === 'rejected' 
                ? 'Your previous application was rejected. Please review the feedback and resubmit your agency details and transport routes.'
                : 'Welcome to Smart Tour Tanzania! Please provide your agency details and transport routes to complete your registration. Your agency will be reviewed by our administrators before activation.'
              }
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
            <Briefcase className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800">
              Important Information
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              After completing your agency profile, it will be submitted for
              review. Your transport routes will be available for tourist
              bookings once approved by our administrators. This typically takes
              1-2 business days.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Agency Information */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 text-amber-600 mr-2" />
                  Agency Information
                </CardTitle>
                <CardDescription>
                  Basic information about your travel agency
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Agency Name *
                    </label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Tanzania Safari Tours & Transport"
                      className="border-gray-300 focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="contactEmail"
                      className="text-sm font-medium text-gray-700"
                    >
                      Contact Email *
                    </label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        handleInputChange("contactEmail", e.target.value)
                      }
                      placeholder="info@youragency.com"
                      className="border-gray-300 focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="contactPhone"
                      className="text-sm font-medium text-gray-700"
                    >
                      Contact Phone *
                    </label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        handleInputChange("contactPhone", e.target.value)
                      }
                      placeholder="+255 744 123 456"
                      className="border-gray-300 focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                {/* Business Documents */}
                <div className="space-y-2">
                  <label
                    htmlFor="documents"
                    className="text-sm font-medium text-gray-700"
                  >
                    Business Documents *
                  </label>
                  <FileUploader
                    onChange={handleFileChange}
                    maxFiles={3}
                    acceptedFileTypes="application/pdf,image/*"
                    value={documentFiles}
                    uploadPrompt="Upload business license, registration certificates, etc."
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Required:</strong> Please upload your business
                      license, registration certificates, or other relevant
                      business documents (PDF or image format). Maximum 3 files.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transport Routes */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Car className="h-5 w-5 text-amber-600 mr-2" />
                    Transport Routes
                  </div>
                  <Button
                    type="button"
                    onClick={addRoute}
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-600 hover:bg-amber-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Route
                  </Button>
                </CardTitle>
                <CardDescription>
                  Add the transport routes your agency offers
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {routes.map((route, index) => (
                  <Card key={index} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">
                          Route {index + 1}
                        </h4>
                        {routes.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeRoute(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Origin *
                          </label>
                          <Input
                            type="text"
                            placeholder="Enter origin city/location"
                            value={route.origin_name}
                            onChange={(e) =>
                              handleRouteChange(index, "origin_name", e.target.value)
                            }
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Destination *
                          </label>
                          <Select
                            value={route.destination_id}
                            onValueChange={(value) =>
                              handleRouteChange(index, "destination_id", value)
                            }
                          >
                            <SelectTrigger className="border-gray-300">
                              <SelectValue placeholder="Select destination" />
                            </SelectTrigger>
                            <SelectContent>
                              {destinations.map((dest) => (
                                <SelectItem
                                  key={dest.id}
                                  value={dest.id.toString()}
                                >
                                  {dest.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Transport Type
                          </label>
                          <Select
                            value={route.transportation_type}
                            onValueChange={(value) =>
                              handleRouteChange(
                                index,
                                "transportation_type",
                                value,
                              )
                            }
                          >
                            <SelectTrigger className="border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bus">Bus</SelectItem>
                              <SelectItem value="plane">Plane</SelectItem>
                              <SelectItem value="shuttle">Shuttle</SelectItem>
                              <SelectItem value="car">Car</SelectItem>
                              <SelectItem value="train">Train</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Cost (TZS) *
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              step="1000"
                              value={route.cost}
                              onChange={(e) =>
                                handleRouteChange(index, "cost", e.target.value)
                              }
                              className="pl-10 border-gray-300 focus:border-amber-500"
                              placeholder="50000"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2 lg:col-span-4 space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Description (optional)
                          </label>
                          <Input
                            value={route.description}
                            onChange={(e) =>
                              handleRouteChange(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Additional details about this route..."
                            className="border-gray-300 focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Card className="shadow-lg">
              <CardFooter className="bg-gray-50 border-t">
                <div className="w-full flex flex-col sm:flex-row gap-3 sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/travel-agent/dashboard")}
                    disabled={isSubmitting}
                  >
                    Complete Later
                  </Button>

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
            </Card>
          </form>

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
