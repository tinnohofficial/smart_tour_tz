"use client"

import { useEffect, useState } from "react"
import { Search, Calendar, Clock, FileText, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { useBookingsStore } from "./store"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { formatDateWithFormat } from "@/app/utils/dateUtils"
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner"

export default function HotelManagerBookings() {
  const {
    filteredBookings,
    isLoading,
    searchTerm,
    isRoomDialogOpen,
    selectedBooking,
    roomDetails,
    setSearchTerm,
    fetchBookings,
    setSelectedBooking,
    setIsRoomDialogOpen,
    updateRoomDetails,
    toggleAmenity,
    confirmRoom
  } = useBookingsStore()

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleOpenRoomDialog = (booking) => {
    setSelectedBooking(booking)
    setIsRoomDialogOpen(true)
  }

  const amenities = [
    { id: "wifi", label: "Free WiFi" },
    { id: "breakfast", label: "Breakfast Included" },
    { id: "ac", label: "Air Conditioning" },
    { id: "tv", label: "Flat-screen TV" },
    { id: "minibar", label: "Mini Bar" },
    { id: "safe", label: "Safe" },
    { id: "balcony", label: "Balcony/Terrace" }
  ]

  const formatDate = (dateString) => formatDateWithFormat(dateString, "MMM dd, yyyy", dateString)

  if (isLoading) {
    return <LoadingSpinner message="Loading bookings..." />
  }

  return (
    <div className="container px-1">
      {/* Page Header */}
      <div className="bg-amber-700 p-4 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Bookings Management</h1>
            <p className="text-amber-100 text-sm">Manage guest bookings and assign rooms</p>
          </div>
          
          {/* Search */}
          <div className="w-full md:w-1/3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/70" />
              <Input
                type="search"
                placeholder="Search by guest email or booking ID"
                className="bg-amber-700/40 border-amber-500/50 pl-9 text-white placeholder:text-white/70"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">No pending bookings</h2>
          <p className="text-gray-500 mt-2">All guest bookings have been processed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardHeader className="pb-3 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <Badge className="mb-1">#{booking.booking_id}</Badge>
                    <CardTitle className="text-base font-medium">{booking.tourist_email}</CardTitle>
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
                      <p className="text-sm font-medium">Booking Date</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(booking.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="text-sm text-gray-500">
                        {booking.provider_status === 'pending' ? 'Pending Room Assignment' : booking.provider_status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Booking Cost</p>
                      <p className="text-sm text-gray-500">
                        ${Number(booking.cost).toFixed(2)}
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
            <DialogTitle>Assign Room for Booking #{selectedBooking?.booking_id}</DialogTitle>
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
                  onChange={(e) => updateRoomDetails('roomNumber', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roomType">Room Type</Label>
                <Input
                  id="roomType"
                  type="text"
                  placeholder="e.g., Deluxe Double"
                  value={roomDetails.roomType}
                  onChange={(e) => updateRoomDetails('roomType', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkIn">Check-In Date</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={roomDetails.checkIn}
                  onChange={(e) => updateRoomDetails('checkIn', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOut">Check-Out Date</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={roomDetails.checkOut}
                  onChange={(e) => updateRoomDetails('checkOut', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequests">Special Requests/Notes</Label>
              <Input
                id="specialRequests"
                type="text"
                placeholder="Any special requests from the guest"
                value={roomDetails.specialRequests}
                onChange={(e) => updateRoomDetails('specialRequests', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Room Amenities</Label>
              <div className="grid grid-cols-2 gap-2">
                {amenities.map((amenity) => (
                  <div key={amenity.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={amenity.id} 
                      checked={(roomDetails.amenities || []).includes(amenity.id)}
                      onCheckedChange={() => toggleAmenity(amenity.id)}
                    />
                    <label
                      htmlFor={amenity.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {amenity.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
            <AlertTitle className="text-yellow-800">Important</AlertTitle>
            <AlertDescription className="text-yellow-700">
              Make sure the room is actually available for the specified dates before confirming.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRoomDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-amber-700 hover:bg-amber-800"
              onClick={() => selectedBooking && confirmRoom(selectedBooking.id)}
            >
              Confirm Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}