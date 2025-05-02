"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { CheckCircle, Clock, Hotel, Search, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { create } from 'zustand'

// Room types available for selection
const roomTypes = ["Standard", "Deluxe", "Suite", "Family Suite", "Presidential Suite"]

// Single store for hotel bookings management
const useHotelBookingsStore = create((set, get) => ({
  bookings: [],
  searchTerm: "",
  isLoading: false,
  selectedRoomType: "",
  roomNumber: "",
  
  setBookings: (bookings) => set({ bookings }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSelectedRoomType: (selectedRoomType) => set({ selectedRoomType }),
  setRoomNumber: (roomNumber) => set({ roomNumber }),

  // Get filtered bookings
  getFilteredBookings: () => {
    const { bookings, searchTerm } = get()
    return bookings.filter(booking => 
      booking.touristName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  },

  // Get pending bookings
  getPendingBookings: () => {
    return get().getFilteredBookings().filter(booking => booking.status === "pending")
  },

  // Get confirmed bookings
  getConfirmedBookings: () => {
    return get().getFilteredBookings().filter(booking => booking.status === "confirmed")
  },

  // Fetch bookings from API
  fetchBookings: async () => {
    try {
      set({ isLoading: true })
      const response = await fetch("/api/hotels/bookings")
      
      if (response.ok) {
        const data = await response.json()
        set({ bookings: data, isLoading: false })
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to fetch bookings")
        set({ isLoading: false })
      }
    } catch (error) {
      console.error("Error fetching bookings:", error)
      toast.error("Failed to fetch bookings")
      set({ isLoading: false })
    }
  },

  // Confirm booking and assign room
  handleConfirmBooking: async (bookingId) => {
    const { selectedRoomType, roomNumber, fetchBookings } = get()
    
    if (!selectedRoomType || !roomNumber) {
      toast.error("Please select a room type and enter a room number")
      return
    }

    try {
      set({ isLoading: true })
      const response = await fetch(`/api/hotels/bookings/${bookingId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          roomType: selectedRoomType,
          roomNumber: roomNumber
        })
      })

      if (response.ok) {
        await fetchBookings() // Refresh bookings after confirmation
        set({ selectedRoomType: "", roomNumber: "" }) // Reset form
        toast.success("Room assigned successfully")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to assign room")
      }
    } catch (error) {
      console.error("Error confirming booking:", error)
      toast.error("Failed to assign room")
    } finally {
      set({ isLoading: false })
    }
  }
}))

export default function HotelManagerBookings() {
  const {
    isLoading,
    searchTerm,
    selectedRoomType,
    roomNumber,
    setSearchTerm,
    setSelectedRoomType,
    setRoomNumber,
    getPendingBookings,
    getConfirmedBookings,
    handleConfirmBooking,
    fetchBookings
  } = useHotelBookingsStore()

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const pendingBookings = getPendingBookings()
  const confirmedBookings = getConfirmedBookings()

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bookings Management</h1>
        <div className="relative w-64">
          <Input
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Pending Bookings
            {pendingBookings.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="flex items-center">
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirmed Bookings
            {confirmedBookings.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {confirmedBookings.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Bookings</CardTitle>
              <CardDescription>Review and process bookings that require room assignment</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingBookings.length === 0 ? (
                <div className="text-center py-6 text-gray-500">No pending bookings found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Tourist</TableHead>
                      <TableHead>Check-in / Check-out</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Room Assignment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.id}</TableCell>
                        <TableCell>{booking.touristName}</TableCell>
                        <TableCell>
                          {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" /> {booking.guests}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={booking.paymentStatus === "paid" ? "success" : "destructive"}>
                            {booking.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div>
                              <Label htmlFor={`roomType-${booking.id}`}>Room Type</Label>
                              <Select
                                value={selectedRoomType}
                                onValueChange={setSelectedRoomType}
                              >
                                <SelectTrigger id={`roomType-${booking.id}`}>
                                  <SelectValue placeholder="Select room type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roomTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`roomNumber-${booking.id}`}>Room Number</Label>
                              <Input
                                id={`roomNumber-${booking.id}`}
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                placeholder="e.g. 101"
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => handleConfirmBooking(booking.id)}
                            disabled={isLoading || booking.paymentStatus !== "paid"}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <Hotel className="mr-2 h-4 w-4" />
                            Assign Room
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confirmed">
          <Card>
            <CardHeader>
              <CardTitle>Confirmed Bookings</CardTitle>
              <CardDescription>View all bookings with assigned rooms</CardDescription>
            </CardHeader>
            <CardContent>
              {confirmedBookings.length === 0 ? (
                <div className="text-center py-6 text-gray-500">No confirmed bookings found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Tourist</TableHead>
                      <TableHead>Check-in / Check-out</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Room Type</TableHead>
                      <TableHead>Room Number</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmedBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.id}</TableCell>
                        <TableCell>{booking.touristName}</TableCell>
                        <TableCell>
                          {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" /> {booking.guests}
                          </div>
                        </TableCell>
                        <TableCell>{booking.roomType}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {booking.roomNumber}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}