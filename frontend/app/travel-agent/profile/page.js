"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building,
  MapPin,
  Mail,
  Phone,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
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
import { travelAgentService, apiUtils } from "@/app/services/api";
import { toast } from "sonner";

export default function TravelAgentProfile() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState(null);
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

      const data = await travelAgentService.getProfile();
      setProfileData(data);

      // Check if user is approved to access profile
      if (data.status !== "active") {
        if (data.status === "pending_profile" || !data.status) {
          router.push("/travel-agent/complete-profile");
        } else {
          router.push("/travel-agent/pending-status");
        }
        return;
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (error.response?.status === 404) {
        router.push("/travel-agent/complete-profile");
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
        contact_email: formData.get("contact_email"),
        contact_phone: formData.get("contact_phone"),
        description: formData.get("description"),
      };

      await travelAgentService.updateProfile(updateData);
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

  return (
    <div className="container mx-auto max-w-4xl py-6 px-4">
      {/* Header */}
      <div className="bg-amber-600 text-white p-6 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Travel Agency Profile</h1>
            <p className="text-amber-100">Manage your agency information</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Agency Information
          </CardTitle>
          <CardDescription>Update your travel agency details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Agency Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={profileData.name || ""}
                  placeholder="Enter agency name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="contact_email" className="text-sm font-medium">
                  Contact Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    defaultValue={profileData.contact_email || ""}
                    placeholder="contact@agency.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="contact_phone" className="text-sm font-medium">
                  Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    type="tel"
                    defaultValue={profileData.contact_phone || ""}
                    placeholder="+255 XXX XXX XXX"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Agency Description
              </label>
              <textarea
                id="description"
                name="description"
                defaultValue={profileData.description || ""}
                placeholder="Describe your travel agency services..."
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {profileData.document_url && (
              <div className="space-y-2">
                <label className="text-sm font-medium">License Document</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <a
                    href={
                      Array.isArray(profileData.document_url)
                        ? profileData.document_url[0]
                        : profileData.document_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:underline"
                  >
                    View License Document
                  </a>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
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

      {/* Routes Section */}
      {profileData.routes && profileData.routes.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Transportation Routes</CardTitle>
            <CardDescription>
              Your available transportation services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {profileData.routes.map((route, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{route.transportation_type}</h3>
                    <Badge variant="outline">
                      {route.cost
                        ? `TZS ${parseInt(route.cost).toLocaleString()}`
                        : "Price not set"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Route:</span>{" "}
                    {route.origin_name} → {route.destination_name}
                  </p>
                  {route.description && (
                    <p className="text-sm text-gray-500">{route.description}</p>
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
