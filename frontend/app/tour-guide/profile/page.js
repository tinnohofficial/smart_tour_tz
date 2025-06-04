"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  MapPin,
  Award,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  tourGuideService,
  destinationsService,
  apiUtils,
} from "@/app/services/api";
import { toast } from "sonner";

export default function TourGuideProfile() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const [data, destinationsData] = await Promise.all([
        tourGuideService.getProfile(),
        destinationsService.getAllDestinations(),
      ]);

      setProfileData(data);
      setDestinations(destinationsData);

      // Check if user is approved to access profile
      if (data.status !== "active") {
        if (data.status === "pending_profile" || !data.status) {
          router.push("/tour-guide/complete-profile");
        } else {
          router.push("/tour-guide/pending-status");
        }
        return;
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (error.response?.status === 404) {
        router.push("/tour-guide/complete-profile");
      } else if (error.response?.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
      } else {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const formData = new FormData(e.target);
      const updateData = {
        full_name: formData.get("full_name"),
        destination_id: parseInt(formData.get("destination_id")),
        description: formData.get("description"),
      };

      await tourGuideService.updateProfile(updateData);
      toast.success("Profile updated successfully!");

      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    try {
      setIsSubmitting(true);
      const newAvailability = !profileData.available;

      await tourGuideService.updateAvailability(newAvailability);

      setProfileData((prev) => ({ ...prev, available: newAvailability }));
      toast.success(
        `Availability updated to ${newAvailability ? "available" : "unavailable"}`,
      );
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error("Failed to update availability");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  const isApproved = profileData.status === "active";
  const getDestinationName = (destinationId) => {
    const destination = destinations.find((d) => d.id === destinationId);
    return destination ? destination.name : "Unknown Location";
  };

  return (
    <div className="container mx-auto max-w-4xl py-6 px-4">
      {/* Header */}
      <div className="bg-amber-600 text-white p-6 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tour Guide Profile</h1>
            <p className="text-amber-100">Manage your guide information</p>
          </div>
          <div className="flex items-center gap-4">
            {isApproved && (
              <Badge className="bg-green-100 text-green-800 border-0">
                <CheckCircle className="h-4 w-4 mr-1" />
                Verified
              </Badge>
            )}
            {isApproved && (
              <div className="flex items-center gap-2">
                <span className="text-sm">Available:</span>
                <Switch
                  checked={profileData.available || false}
                  onCheckedChange={handleAvailabilityToggle}
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Availability Alert */}
      {isApproved && !profileData.available && (
        <Alert className="border-amber-200 bg-amber-50 mb-6">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">
            Currently Unavailable
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            You are currently marked as unavailable. Admin can not assign you
            activity supervision unless mark yourself as available.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-24 h-24 bg-amber-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                {profileData.full_name ? (
                  <span className="text-2xl font-bold text-amber-600">
                    {profileData.full_name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="h-12 w-12 text-amber-600" />
                )}
              </div>

              <h2 className="text-xl font-semibold mb-2">
                {profileData.full_name || "Your Name"}
              </h2>

              {profileData.destination_id && (
                <div className="flex items-center justify-center text-gray-600 mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{getDestinationName(profileData.destination_id)}</span>
                </div>
              )}

              <div className="flex justify-center gap-2">
                <Badge className="bg-amber-100 text-amber-700 border-0">
                  Tour Guide
                </Badge>
                {isApproved && (
                  <Badge className="bg-green-100 text-green-700 border-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              {profileData.license_document_url && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <FileText className="h-4 w-4 mr-1" />
                    <a
                      href={profileData.license_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline"
                    >
                      View License
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Professional Information
            </CardTitle>
            <CardDescription>
              Update your guide details and expertise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="full_name" className="text-sm font-medium">
                    Full Name *
                  </label>
                  <Input
                    id="full_name"
                    name="full_name"
                    defaultValue={profileData.full_name || ""}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="destination_id"
                    className="text-sm font-medium"
                  >
                    Primary Destination *
                  </label>
                  <select
                    id="destination_id"
                    name="destination_id"
                    defaultValue={profileData.destination_id || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select destination</option>
                    {destinations.map((destination) => (
                      <option key={destination.id} value={destination.id}>
                        {destination.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={profileData.description || ""}
                  placeholder="Describe your experience, expertise, and what makes you a great tour guide..."
                  className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Activities Section */}
      {profileData.activity_details &&
        profileData.activity_details.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Supervised Activities</CardTitle>
              <CardDescription>
                Activities you can guide tourists through
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profileData.activity_details.map((activity, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <h3 className="font-medium mb-2">{activity.name}</h3>
                    {activity.description && (
                      <p className="text-sm text-gray-600">
                        {activity.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
