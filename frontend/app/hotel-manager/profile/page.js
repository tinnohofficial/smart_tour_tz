"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Hotel,
  MapPin,
  Users,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
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
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  hotelManagerService,
  destinationsService,
  apiUtils,
} from "@/app/services/api";
import { toast } from "sonner";

export default function HotelManagerProfile() {
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
        hotelManagerService.getProfile(),
        destinationsService.getAllDestinations(),
      ]);

      setProfileData(data);
      setDestinations(destinationsData);

      // Check if user is approved to access profile
      if (data.status !== "active") {
        if (data.status === "pending_profile" || !data.status) {
          router.push("/hotel-manager/complete-profile");
        } else {
          router.push("/hotel-manager/pending-status");
        }
        return;
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (error.response?.status === 404) {
        router.push("/hotel-manager/complete-profile");
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
        name: formData.get("name"),
        location: formData.get("location"),
        description: formData.get("description"),
        capacity: parseInt(formData.get("capacity")),
        base_price_per_night: parseFloat(formData.get("base_price_per_night")),
      };

      await hotelManagerService.updateProfile(updateData);
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

      await hotelManagerService.updateProfile({
        available: newAvailability,
      });

      setProfileData((prev) => ({ ...prev, available: newAvailability }));
      toast.success(
        `Hotel marked as ${newAvailability ? "available" : "unavailable"}`,
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
            <h1 className="text-2xl font-bold">Hotel Profile</h1>
            <p className="text-amber-100">Manage your hotel information</p>
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
          <AlertTitle className="text-amber-800">Hotel Unavailable</AlertTitle>
          <AlertDescription className="text-amber-700">
            Your hotel is currently marked as unavailable. Tourists cannot book
            rooms until you mark it as available.
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Hotel className="h-5 w-5 mr-2" />
            Hotel Information
          </CardTitle>
          <CardDescription>
            Update your hotel details and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Hotel Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={profileData.name || ""}
                  placeholder="Enter hotel name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    name="location"
                    defaultValue={
                      profileData.location ||
                      getDestinationName(profileData.destination_id)
                    }
                    placeholder="Hotel location"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="capacity" className="text-sm font-medium">
                  Room Capacity *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    defaultValue={profileData.capacity || ""}
                    placeholder="Number of rooms"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="base_price_per_night"
                  className="text-sm font-medium"
                >
                  Price per Night (TZS) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="base_price_per_night"
                    name="base_price_per_night"
                    type="number"
                    min="0"
                    step="1000"
                    defaultValue={profileData.base_price_per_night || ""}
                    placeholder="240000"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Hotel Description *
              </label>
              <textarea
                id="description"
                name="description"
                defaultValue={profileData.description || ""}
                placeholder="Describe your hotel, amenities, and unique features..."
                className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
            </div>

            {profileData.images && profileData.images.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Hotel Images</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {profileData.images.map((image, index) => (
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
              </div>
            )}

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

      {/* Hotel Stats */}
      {isApproved && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Hotel Statistics</CardTitle>
            <CardDescription>Overview of your hotel status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">
                  {profileData.capacity || 0}
                </div>
                <div className="text-sm text-amber-600">Total Rooms</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {profileData.base_price_per_night
                    ? `TZS ${parseInt(profileData.base_price_per_night).toLocaleString()}`
                    : "Not set"}
                </div>
                <div className="text-sm text-green-600">Price per Night</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {profileData.available ? "Available" : "Unavailable"}
                </div>
                <div className="text-sm text-purple-600">Current Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
