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
import { Checkbox } from "@/components/ui/checkbox";
import {
  tourGuideService,
  destinationsService,
  activitiesService,
  apiUtils,
} from "@/app/services/api";
import { toast } from "sonner";

export default function TourGuideProfile() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState([]);
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

      // Load activities for the destination first
      if (data.destination_id) {
        await loadActivities(data.destination_id);
      }

      // Set selected activities from profile data after loading available activities
      if (data.activities) {
        const activities = Array.isArray(data.activities)
          ? data.activities
          : JSON.parse(data.activities || "[]");
        setSelectedActivities(activities);
      }

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

  const loadActivities = async (destinationId) => {
    if (!destinationId) {
      setActivities([]);
      return;
    }

    setIsLoadingActivities(true);
    try {
      const activitiesData =
        await activitiesService.getActivitiesByDestination(destinationId);
      const activitiesList = Array.isArray(activitiesData)
        ? activitiesData
        : [];
      setActivities(activitiesList);
    } catch (error) {
      console.error("Error loading activities:", error);
      setActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const toggleActivity = (activityId) => {
    const id = parseInt(activityId);
    setSelectedActivities((prev) => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        // Don't allow removing the last activity (minimum 1 required)
        if (prev.length <= 1) {
          toast.error("At least one activity must be selected");
          return prev;
        }
        return prev.filter((existingId) => existingId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleDestinationChange = async (e) => {
    const destinationId = e.target.value;
    // Clear selected activities when destination changes
    setSelectedActivities([]);
    await loadActivities(destinationId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const formData = new FormData(e.target);
      const updateData = {
        full_name: formData.get("full_name"),
        destination_id: parseInt(formData.get("destination_id")),
        description: formData.get("description"),
        activities: selectedActivities,
      };

      // Validate minimum activities
      if (!selectedActivities || selectedActivities.length === 0) {
        toast.error("Please select at least one activity");
        return;
      }

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
                    onChange={handleDestinationChange}
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

              {/* Activities Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Activities *</label>
                <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                  {isLoadingActivities ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Loading activities...
                      </p>
                    </div>
                  ) : activities.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No activities available for this destination
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((activity) => {
                        const isSelected = selectedActivities.includes(
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
                                toggleActivity(activity.id)
                              }
                              className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                            />
                            <label
                              className="text-sm font-medium text-gray-700 cursor-pointer"
                              onClick={() => toggleActivity(activity.id)}
                            >
                              {activity.name}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {selectedActivities.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {selectedActivities.length} activity(ies) selected
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
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
    </div>
  );
}
