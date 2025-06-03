"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  Package,
  Eye,
  Loader2,
  Save,
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { formatTZS } from "@/app/utils/currency";

export default function TouristProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Form fields
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check authentication and load user data
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("userData");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "tourist") {
      router.push("/forbidden");
      return;
    }

    setUser(parsedUser);
    setEmail(parsedUser.email || "");
    setPhoneNumber(parsedUser.phone_number || "");
    setIsLoading(false);
  }, [router]);



  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      // Update email if changed
      if (email !== user.email) {
        const emailResponse = await fetch(`${API_URL}/users/email`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          throw new Error(errorData.message || "Failed to update email");
        }
      }

      // Update phone if changed
      if (phoneNumber !== user.phone_number) {
        const phoneResponse = await fetch(`${API_URL}/users/phone`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ phone_number: phoneNumber }),
        });

        if (!phoneResponse.ok) {
          const errorData = await phoneResponse.json();
          throw new Error(errorData.message || "Failed to update phone number");
        }
      }

      // Update local storage
      const updatedUser = { ...user, email, phone_number: phoneNumber };
      localStorage.setItem("userData", JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };




  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="bg-amber-700 p-6 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-amber-100">
              Manage your account information and view your bookings
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Profile Information */}
        <div>
          <Card className="shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-amber-700" />
                </div>
                <div>
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-amber-600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-700"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-amber-600"
                      placeholder="+255123456789"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Account Status
                  </label>
                  <Badge className="bg-green-100 text-green-700 border-0">
                    Active Tourist Account
                  </Badge>
                </div>

                <Separator />

                <Button
                  type="submit"
                  className="w-full bg-amber-700 hover:bg-amber-800 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-sm mt-6">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-700" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-amber-200 hover:bg-amber-50"
                onClick={() => router.push("/savings")}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Savings
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-amber-200 hover:bg-amber-50"
                onClick={() => router.push("/my-bookings")}
              >
                <Package className="mr-2 h-4 w-4" />
                My Bookings
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-amber-200 hover:bg-amber-50"
                onClick={() => router.push("/cart")}
              >
                <Package className="mr-2 h-4 w-4" />
                View Cart
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-amber-200 hover:bg-amber-50"
                onClick={() => router.push("/")}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Browse Destinations
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
