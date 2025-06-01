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
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

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

    // Load bookings
    loadBookings();
  }, [router]);

  const loadBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/bookings/my-bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      } else {
        console.error("Failed to load bookings");
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setIsLoadingBookings(false);
    }
  };

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

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending_payment":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-0">
            Pending Payment
          </Badge>
        );
      case "confirmed":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-0">
            Confirmed
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 border-0">
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-700 border-0">Cancelled</Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-0">{status}</Badge>
        );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateNights = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-1">
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

        {/* My Bookings */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-amber-700" />
                My Bookings
              </CardTitle>
              <CardDescription>
                View and manage your travel bookings
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {isLoadingBookings ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-amber-700"></div>
                  <span className="ml-2 text-gray-600">
                    Loading bookings...
                  </span>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No bookings yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start exploring destinations to make your first booking!
                  </p>
                  <div className="mt-6">
                    <Button
                      onClick={() => router.push("/")}
                      className="bg-amber-700 hover:bg-amber-800 text-white"
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Browse Destinations
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <Card key={booking.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {booking.destination_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Booking ID: #{booking.id}
                            </p>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              {formatDate(booking.start_date)} -{" "}
                              {formatDate(booking.end_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>
                              {calculateNights(
                                booking.start_date,
                                booking.end_date,
                              )}{" "}
                              nights
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">
                              {formatTZS(booking.total_price)}
                            </span>
                          </div>
                        </div>

                        {booking.status === "pending_payment" && (
                          <Alert className="mt-3 border-yellow-200 bg-yellow-50">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <AlertTitle className="text-yellow-800">
                              Payment Required
                            </AlertTitle>
                            <AlertDescription className="text-yellow-700">
                              Complete your payment to confirm this booking.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
