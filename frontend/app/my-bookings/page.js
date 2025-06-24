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
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge.jsx";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { formatTZS } from "@/app/utils/currency";
import { getUserData, clearAuthData, getAuthToken } from "../utils/auth";

export default function MyBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const loadBookings = useCallback(async () => {
    try {
      const token = getAuthToken();
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
    const token = getAuthToken();
    const userData = getUserData();

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

  const getItemTypeColor = (type) => {
    switch (type) {
      case "hotel":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "transport":
        return "bg-green-50 text-green-700 border-green-200";
      case "tour_guide":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "activity":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const renderBookingItem = (item) => {
    const getItemIcon = (type) => {
      switch (type) {
        case "hotel":
          return <Hotel className="w-4 h-4 text-blue-600" />;
        case "transport":
          return <Car className="w-4 h-4 text-green-600" />;
        case "tour_guide":
          return <User className="w-4 h-4 text-purple-600" />;
        case "activity":
          return <Activity className="w-4 h-4 text-orange-600" />;
        case "placeholder":
          return <Package className="w-4 h-4 text-gray-600" />;
        default:
          return <Package className="w-4 h-4 text-gray-600" />;
      }
    };

    const getItemDetails = (item) => {
      // Handle activity sessions first (doesn't need assignment)
      if (item.sessions && item.sessions > 1) {
        return (
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <span className="font-medium text-gray-700">Sessions:</span>
            <span>{item.sessions}</span>
          </div>
        );
      }

      if (item.item_details) {
        try {
          const details =
            typeof item.item_details === "string"
              ? JSON.parse(item.item_details)
              : item.item_details;

          if (item.item_type === "hotel") {
            if (details.roomNumber && details.roomType) {
              return (
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Room:</span>
                      <span>{details.roomNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Type:</span>
                      <span>{details.roomType}</span>
                    </div>
                  </div>
                  {(item.provider_email || item.provider_phone) && (
                    <div className="flex flex-wrap gap-4 pt-1">
                      {item.provider_email && (
                        <div className="flex items-center gap-2 text-blue-600 font-medium">
                          <span>📧</span>
                          <span>{item.provider_email}</span>
                        </div>
                      )}
                      {item.provider_phone && (
                        <div className="flex items-center gap-2 text-blue-600 font-medium">
                          <span>📞</span>
                          <span>{item.provider_phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <div className="text-sm text-amber-600 italic flex items-center gap-2">
                  <span>⏳</span>
                  <span>Waiting for room assignment</span>
                </div>
              );
            }
          }

          if (item.item_type === "transport") {
            if (details.ticket_pdf_url) {
              return (
                <div className="text-sm text-gray-600 space-y-3">
                  <div className="flex items-center gap-3">
                    <span>🎫</span>
                    <a
                      href={details.ticket_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      Download Ticket PDF
                    </a>
                    {details.assigned_at && (
                      <span className="text-gray-500 text-sm">
                        • Assigned: {formatDate(details.assigned_at)}
                      </span>
                    )}
                  </div>
                  {(item.provider_email || item.provider_phone) && (
                    <div className="flex flex-wrap gap-4">
                      {item.provider_email && (
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                          <span>📧</span>
                          <span>{item.provider_email}</span>
                        </div>
                      )}
                      {item.provider_phone && (
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                          <span>📞</span>
                          <span>{item.provider_phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <div className="text-sm text-amber-600 italic flex items-center gap-2">
                  <span>⏳</span>
                  <span>Waiting for transport assignment</span>
                </div>
              );
            }
          }

          if (item.item_type === "tour_guide") {
            if (details.guide_name) {
              return (
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-700">Guide:</span>
                    <span className="font-medium">{details.guide_name}</span>
                    {details.assigned_at && (
                      <span className="text-gray-500 text-sm">
                        • Assigned: {formatDate(details.assigned_at)}
                      </span>
                    )}
                  </div>
                  {(item.provider_email || item.provider_phone) && (
                    <div className="flex flex-wrap gap-4">
                      {item.provider_email && (
                        <div className="flex items-center gap-2 text-purple-600 font-medium">
                          <span>📧</span>
                          <span>{item.provider_email}</span>
                        </div>
                      )}
                      {item.provider_phone && (
                        <div className="flex items-center gap-2 text-purple-600 font-medium">
                          <span>📞</span>
                          <span>{item.provider_phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <div className="text-sm text-amber-600 italic flex items-center gap-2">
                  <span>⏳</span>
                  <span>Waiting for guide assignment</span>
                </div>
              );
            }
          }

          if (item.item_type === "placeholder" && details.message) {
            return (
              <div className="text-sm text-gray-600">{details.message}</div>
            );
          }
        } catch (e) {
          console.error("Error parsing item details:", e);
        }
      }

      // Show pending status for items without details
      if (item.item_type === "hotel") {
        return (
          <div className="text-sm text-amber-600 italic flex items-center gap-2">
            <span>⏳</span>
            <span>Waiting for room assignment</span>
          </div>
        );
      }

      if (item.item_type === "transport") {
        return (
          <div className="text-sm text-amber-600 italic flex items-center gap-2">
            <span>⏳</span>
            <span>Waiting for transport assignment</span>
          </div>
        );
      }

      if (item.item_type === "tour_guide") {
        return (
          <div className="text-sm text-amber-600 italic flex items-center gap-2">
            <span>⏳</span>
            <span>Waiting for guide assignment</span>
          </div>
        );
      }

      return null;
    };

    return (
      <div
        key={`${item.item_type}-${item.id}`}
        className="p-4 bg-gray-50 rounded-lg border"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            {getItemIcon(item.item_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-medium text-base text-gray-900">
                {item.item_name || item.item_type.replace("_", " ")}
              </h4>
              <Badge
                variant="outline"
                className={`text-xs capitalize ${getItemTypeColor(item.item_type)}`}
              >
                {item.item_type.replace("_", " ")}
              </Badge>
            </div>
            <div className="mt-2">{getItemDetails(item)}</div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 mx-auto" />
          <p className="mt-3 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (isViewingDetails && selectedBooking) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button
          variant="outline"
          onClick={handleBackToList}
          className="mb-4 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bookings
        </Button>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl text-gray-900">
                  Booking Details
                </CardTitle>
                <CardDescription className="text-sm">
                  {selectedBooking.destination?.name ||
                    "Multi-destination trip"}
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="text-lg font-semibold px-3 py-1"
              >
                {formatTZS(selectedBooking.total_cost)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Check-in</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(selectedBooking.start_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Check-out</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(selectedBooking.end_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Duration</p>
                  <p className="text-sm text-gray-600">
                    {calculateNights(
                      selectedBooking.start_date,
                      selectedBooking.end_date,
                    )}{" "}
                    nights
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Booking Items ({selectedBooking.items?.length || 0})
              </h3>

              <div className="space-y-2">
                {selectedBooking.items && selectedBooking.items.length > 0 ? (
                  selectedBooking.items.map(renderBookingItem)
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No booking items found</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-6 rounded-xl mb-6 text-white">
        <h1 className="text-2xl font-bold mb-2">My Bookings</h1>
        <p className="text-amber-100">
          Track and manage your travel reservations
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No bookings yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start exploring amazing destinations and create your first
              booking!
            </p>
            <Button
              onClick={() => router.push("/")}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Explore Destinations
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {booking.destination?.name || "Multi-destination trip"}
                    </h3>
                  </div>
                  <Badge variant="outline" className="font-semibold">
                    {formatTZS(booking.total_cost)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Check-in</p>
                      <p className="text-sm font-medium">
                        {formatDate(booking.start_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Check-out</p>
                      <p className="text-sm font-medium">
                        {formatDate(booking.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="text-sm font-medium">
                        {calculateNights(booking.start_date, booking.end_date)}{" "}
                        nights
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Items</p>
                      <p className="text-sm font-medium">
                        {booking.items?.length || 0} items
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(booking)}
                      className="hover:bg-amber-50 border-amber-200"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
