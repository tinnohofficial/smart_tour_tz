"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Package,
  Hotel,
  Car,
  User,
  Activity,
  Eye,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatTZS } from "@/app/utils/currency";

export default function MyBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const loadBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/bookings/my-bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data || []);
      } else {
        toast.error("Failed to load bookings");
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast.error("Error loading bookings");
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

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

    loadBookings();
  }, [router, loadBookings]);



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

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setIsViewingDetails(true);
  };

  const handleBackToList = () => {
    setSelectedBooking(null);
    setIsViewingDetails(false);
  };

  const renderBookingItem = (item) => {
    const getItemIcon = (type) => {
      switch (type) {
        case "hotel":
          return <Hotel className="w-4 h-4" />;
        case "transport":
          return <Car className="w-4 h-4" />;
        case "tour_guide":
          return <User className="w-4 h-4" />;
        case "activity":
          return <Activity className="w-4 h-4" />;
        case "placeholder":
          return <Package className="w-4 h-4" />;
        default:
          return <Package className="w-4 h-4" />;
      }
    };

    const getItemDetails = (item) => {
      if (item.item_details) {
        try {
          const details =
            typeof item.item_details === "string"
              ? JSON.parse(item.item_details)
              : item.item_details;

          if (item.item_type === "hotel" && details.room_type) {
            return (
              <div className="text-xs text-gray-600 mt-1">
                <p>Room: {details.room_type}</p>
                {details.check_in && (
                  <p>Check-in: {formatDate(details.check_in)}</p>
                )}
                {details.check_out && (
                  <p>Check-out: {formatDate(details.check_out)}</p>
                )}
              </div>
            );
          }

          if (item.item_type === "transport" && details.ticket_number) {
            return (
              <div className="text-xs text-gray-600 mt-1">
                <p>Ticket: {details.ticket_number}</p>
                {details.departure_date && (
                  <p>Departure: {formatDate(details.departure_date)}</p>
                )}
                {details.seat && <p>Seat: {details.seat}</p>}
              </div>
            );
          }

          if (item.item_type === "tour_guide" && details.guide_name) {
            return (
              <div className="text-xs text-gray-600 mt-1">
                <p>Guide: {details.guide_name}</p>
                {details.assigned_at && (
                  <p>Assigned: {formatDate(details.assigned_at)}</p>
                )}
              </div>
            );
          }

          if (item.item_type === "placeholder" && details.message) {
            return (
              <div className="text-xs text-gray-600 mt-1">
                <p>{details.message}</p>
              </div>
            );
          }
        } catch (e) {
          console.error("Error parsing item details:", e);
        }
      }

      if (item.sessions && item.sessions > 1) {
        return (
          <div className="text-xs text-gray-600 mt-1">
            <p>{item.sessions} sessions</p>
          </div>
        );
      }

      return null;
    };

    return (
      <div
        key={`${item.item_type}-${item.id}`}
        className="flex items-start justify-between p-3 border border-gray-200 rounded-lg"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-100 rounded-full">
            {getItemIcon(item.item_type)}
          </div>
          <div>
            <h4 className="font-medium text-sm capitalize">
              {item.item_name || item.item_type.replace("_", " ")}
            </h4>
            <p className="text-xs text-gray-500 capitalize">
              {item.item_type.replace("_", " ")}
            </p>
            {getItemDetails(item)}
          </div>
        </div>
        <div className="text-right">
          <p className="font-medium text-sm">{formatTZS(item.cost)}</p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-700 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (isViewingDetails && selectedBooking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="border-amber-200 hover:bg-amber-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bookings
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Booking Details</CardTitle>
                    <CardDescription>
                      Booking ID: #{selectedBooking.id}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Destination</p>
                      <p className="text-xs text-gray-600">
                        {selectedBooking.destination?.name ||
                          "Multi-destination"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-xs text-gray-600">
                        {calculateNights(
                          selectedBooking.start_date,
                          selectedBooking.end_date,
                        )}{" "}
                        nights
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Total Cost</p>
                      <p className="text-xs text-gray-600">
                        {formatTZS(selectedBooking.total_cost)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-4">Booking Items</h3>
                  <div className="space-y-3">
                    {selectedBooking.items &&
                    selectedBooking.items.length > 0 ? (
                      selectedBooking.items.map(renderBookingItem)
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No booking items found
                      </p>
                    )}
                  </div>
                </div>


              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/contact")}
                  className="w-full border-amber-200 hover:bg-amber-50"
                >
                  Contact Support
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="w-full border-amber-200 hover:bg-amber-50"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Browse More Destinations
                </Button>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-amber-700 p-6 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">My Bookings</h1>
            <p className="text-amber-100">
              View and manage all your travel bookings
            </p>
          </div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No bookings yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start exploring amazing destinations and create your first
              booking!
            </p>
            <Button
              onClick={() => router.push("/")}
              className="bg-amber-700 hover:bg-amber-800 text-white"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Explore Destinations
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <Card key={booking.id} className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Booking #{booking.id}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {booking.destination?.name
                        ? `Destination: ${booking.destination.name}`
                        : "Multi-destination booking"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="text-sm font-medium">
                        {formatDate(booking.start_date)} to{" "}
                        {formatDate(booking.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Nights</p>
                      <p className="text-sm font-medium">
                        {calculateNights(booking.start_date, booking.end_date)}{" "}
                        nights
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Total Cost</p>
                      <p className="text-sm font-medium">
                        {formatTZS(booking.total_cost)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Services</p>
                      <p className="text-sm font-medium">
                        {booking.items ? booking.items.length : 0} items
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(booking)}
                    className="border-amber-200 hover:bg-amber-50"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
