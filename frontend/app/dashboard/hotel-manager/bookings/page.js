"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle, Clock, Search, Hotel, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { create } from 'zustand'

// Mock data for bookings
const mockBookings = [
  {
    id: "HB001",
    touristName: "Mr & Mrs Tinnoh",
    checkIn: "2025-07-15",
    checkOut: "2025-07-20",
    guests: 2,
    status: "pending",
    paymentStatus: "paid",
  },
  {
    id: "HB002",
    touristName: "Eddie Thinker",
    checkIn: "2025-08-01",
    checkOut: "2025-08-07",
    guests: 3,
    status: "pending",
    paymentStatus: "paid",
  },
  {
    id: "HB003",
    touristName: "Michael Brown",
    checkIn: "2025-09-10",
    checkOut: "2025-09-15",
    guests: 1,
    status: "confirmed",
    paymentStatus: "paid",
    roomNumber: "201",
    roomType: "Deluxe",
  },
  {
    id: "HB004",
    touristName: "Emily Davis",
    checkIn: "2025-10-05",
    checkOut: "2025-10-10",
    guests: 4,
    status: "confirmed",
    paymentStatus: "paid",
    roomNumber: "305",
    roomType: "Family Suite",
  },
]

// Mock data for room types
const roomTypes = ["Standard", "Deluxe", "Suite", "Family Suite", "Presidential Suite"]

// Zustand store for HotelManagerBookings
const useHotelBookingsStore = create((set, get) => ({
  bookings: mockBookings,
  searchTerm: "",
  isLoading: false,
  selectedRoomType: "",
  roomNumber: "",

  setBookings: (bookings) => set({ bookings }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setSelectedRoomType: (selectedRoomType) => set({ selectedRoomType }),
  setRoomNumber: (roomNumber) => set({ roomNumber }),

  // Derived state for filtered bookings
  getFilteredBookings: () => {
    const searchTerm = get().searchTerm;
    const bookings = get().bookings;
    return bookings.filter(
      (booking) =>
        booking.touristName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },

  // Derived state for pending bookings
  getPendingBookings: () => {
    return get().getFilteredBookings().filter((booking) => booking.status === "pending");
  },

  // Derived state for confirmed bookings
  getConfirmedBookings: () => {
    return get().getFilteredBookings().filter((booking) => booking.status === "confirmed");
  },

  handleConfirmBooking: async (bookingId) => {
    const { selectedRoomType, roomNumber, bookings, setBookings, setIsLoading, setSelectedRoomType, setRoomNumber } = get();

    if (!selectedRoomType || !roomNumber) {
      toast.error("Please select a room type and enter a room number.");
      return;
    }

    setIsLoading(true);

    // i need to remove this after i complete my testing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Updating the booking status
    const updatedBookings = bookings.map((booking) => {
      if (booking.id === bookingId) {
        return {
          ...booking,
          status: "confirmed",
          roomNumber,
          roomType: selectedRoomType,
        };
      }
      return booking;
    });

    setBookings(updatedBookings);
    setIsLoading(false);
    setSelectedRoomType("");
    setRoomNumber("");

    toast.success( `Room #${roomNumber} (${selectedRoomType}) has been assigned to the tourist.`);
  },
}));


export default function HotelManagerBookings() {
  const router = useRouter()
  const {
    bookings,
    searchTerm,
    isLoading,
    selectedRoomType,
    roomNumber,
    setSearchTerm,
    setSelectedRoomType,
    setRoomNumber,
    getFilteredBookings,
    getPendingBookings,
    getConfirmedBookings,
    handleConfirmBooking,
  } = useHotelBookingsStore(); 

  const pendingBookings = getPendingBookings();
  const confirmedBookings = getConfirmedBookings();


  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <Button className="border border-blue-100 hover:bg-blue-100" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold ">Hotel Bookings Management</h1>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search bookings by tourist name or booking ID..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
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
              <CardDescription className="text-gray-500">Review and process bookings that require room assignment</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingBookings.length === 0 ? (
                <div className="text-center py-6 text-gray-500">No pending bookings found</div>
              ) : (
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Tourist</TableHead>
                      <TableHead>Check-in / Check-out</TableHead>
                      <TableHead>Guests</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Room Assignment</TableHead>
                      <TableHead>Actions</TableHead>
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
                          <div className="flex flex-col gap-2">
                            <div>
                              <Label htmlFor={`roomType-${booking.id}`} className="text-xs">
                                Room Type
                              </Label>
                              <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                                <SelectTrigger id={`roomType-${booking.id}`} className="w-full">
                                  <SelectValue placeholder="Select room type" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  {roomTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`roomNumber-${booking.id}`} className="text-xs">
                                Room Number
                              </Label>
                              <Input
                                id={`roomNumber-${booking.id}`}
                                placeholder="e.g. 101"
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => handleConfirmBooking(booking.id)}
                            disabled={isLoading || booking.paymentStatus !== "paid"}
                            className="flex items-center text-white bg-blue-600 hover:bg-blue-700"
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