"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import { useBookingsStore } from "./store";
import { formatDateWithFormat } from "@/app/utils/dateUtils";
import { formatTZS } from "@/app/utils/currency";
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner";

export default function HotelManagerBookings() {
  const {
    bookings,
    isLoading,
    isRoomDialogOpen,
    selectedBooking,
    roomDetails,
    fetchBookings,
    setSelectedBooking,
    setIsRoomDialogOpen,
    updateRoomDetails,

    confirmRoom,
  } = useBookingsStore();

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleOpenRoomDialog = (booking) => {
    setSelectedBooking(booking);
    setIsRoomDialogOpen(true);
  };

  const formatDate = (dateString) =>
    formatDateWithFormat(dateString, "MMM dd, yyyy", dateString);

  if (isLoading) {
    return <LoadingSpinner message="Loading bookings..." />;
  }

  return (
    <div className="container px-1">
      {/* Page Header */}
      <div className="bg-amber-700 p-4 rounded-lg mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Bookings Management</h1>
          <p className="text-amber-100 text-sm">
            Manage guest bookings and assign rooms
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">
            No pending bookings
          </h2>
          <p className="text-gray-500 mt-2">
            All guest bookings have been processed
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {(bookings || []).map((booking, index) => (
            <Card
              key={`booking-${booking.id}-${booking.booking_id}-${index}`}
              className="overflow-hidden"
            >
              <CardHeader className="pb-3 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-medium">
                      {booking.tourist_name || "Guest"}
                    </CardTitle>
                    <div className="text-sm text-gray-600 space-y-1 mt-1">
                      <div className="flex items-center gap-1">
                        <span>📧</span>
                        <span>{booking.tourist_email}</span>
                      </div>
                      {booking.tourist_phone && (
                        <div className="flex items-center gap-1">
                          <span>📞</span>
                          <span>{booking.tourist_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleOpenRoomDialog(booking)}
                    className="bg-amber-700 hover:bg-amber-800 text-white"
                  >
                    Assign Room
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Check-in/out</p>
                      <p className="text-sm text-gray-500">
                        {booking.start_date
                          ? formatDate(booking.start_date)
                          : "Not specified"}{" "}
                        -{" "}
                        {booking.end_date
                          ? formatDate(booking.end_date)
                          : "Not specified"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm text-gray-500">
                        {booking.provider_status === "pending"
                          ? "Pending Room Assignment"
                          : booking.provider_status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Booking Cost</p>{" "}
                      <p className="text-sm text-gray-500">
                        {formatTZS(Number(booking.cost))}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Room Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Assign Room for Booking #{selectedBooking?.booking_id}
            </DialogTitle>
          </DialogHeader>

          {/* Form to assign a room */}
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  type="text"
                  placeholder="e.g., 101"
                  value={roomDetails.roomNumber}
                  onChange={(e) =>
                    updateRoomDetails("roomNumber", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomType">Room Type</Label>
                <select
                  id="roomType"
                  value={roomDetails.roomType}
                  onChange={(e) =>
                    updateRoomDetails("roomType", e.target.value)
                  }
                  required
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-700"
                >
                  <option value="">Select a room type</option>
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Twin">Twin</option>
                  <option value="Suite">Suite</option>
                  <option value="Deluxe">Deluxe</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                type="text"
                placeholder="Any additional notes or description"
                value={roomDetails.description}
                onChange={(e) =>
                  updateRoomDetails("description", e.target.value)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRoomDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-700 hover:bg-amber-800 text-white"
              onClick={() => selectedBooking && confirmRoom(selectedBooking.id)}
            >
              Confirm Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
