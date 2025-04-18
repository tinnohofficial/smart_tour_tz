"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle, Clock, Search, Ticket } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { create } from 'zustand';

// Mock data for bookings
const mockBookings = [
  {
    id: "B001",
    touristName: "Mr & Mrs Tinnoh",
    destination: "Serengeti National Park",
    startDate: "2023-07-15",
    endDate: "2023-07-20",
    status: "pending",
    paymentStatus: "paid",
  },
  {
    id: "B002",
    touristName: "Winnie",
    destination: "Zanzibar Beaches",
    startDate: "2023-08-01",
    endDate: "2023-08-07",
    status: "pending",
    paymentStatus: "paid",
  },
  {
    id: "B003",
    touristName: "Eddie Thinker",
    destination: "Mount Kilimanjaro",
    startDate: "2023-09-10",
    endDate: "2023-09-15",
    status: "confirmed",
    paymentStatus: "paid",
    ticketNumber: "T12345",
  },
  {
    id: "B004",
    touristName: "Emily Davis",
    destination: "Ngorongoro Conservation Area",
    startDate: "2023-10-05",
    endDate: "2023-10-10",
    status: "confirmed",
    paymentStatus: "paid",
    ticketNumber: "T12346",
  },
]

// Zustand store
const useBookingStore = create((set, get) => ({
  bookings: mockBookings,
  searchTerm: "",
  isLoading: false,
  setBookings: (updatedBookings) => set({ bookings: updatedBookings }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  handleConfirmBooking: (bookingId) => {
    set({ isLoading: true });
    setTimeout(() => {
      const ticketNumber = `T${Math.floor(10000 + Math.random() * 90000)}`;
      const updatedBookings = get().bookings.map(booking => {
        if (booking.id === bookingId) {
          return {
            ...booking,
            status: "confirmed",
            ticketNumber,
          };
        }
        return booking;
      });
      set({ bookings: updatedBookings, isLoading: false });
      toast.success(`Ticket #${ticketNumber} has been assigned to the tourist.`);
    }, 1000);
  },
}));


export default function TravelAgentBookings() {
  const router = useRouter()

  // Using Zustand store
  const { bookings, searchTerm, isLoading, setBookings, setSearchTerm, handleConfirmBooking: confirmBookingAction } = useBookingStore();

  // Filtering bookings based on search term
  const filteredBookings = bookings.filter(
    (booking) =>
      booking.touristName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Grouping bookings by status
  const pendingBookings = filteredBookings.filter((booking) => booking.status === "pending")
  const confirmedBookings = filteredBookings.filter((booking) => booking.status === "confirmed")


  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <Button className="border border-blue-100 hover:bg-blue-100" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Travel Bookings Management</h1>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search bookings by tourist name, destination, or booking ID..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 ">
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
              <CardDescription>Review and process bookings that require ticket assignment</CardDescription>
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
                      <TableHead>Destination</TableHead>
                      <TableHead>Travel Dates</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-left">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.id}</TableCell>
                        <TableCell>{booking.touristName}</TableCell>
                        <TableCell>{booking.destination}</TableCell>
                        <TableCell>
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={booking.paymentStatus === "paid" ? "success" : "destructive"}>
                            {booking.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left">
                          <Button
                            onClick={() => confirmBookingAction(booking.id)}
                            disabled={isLoading || booking.paymentStatus !== "paid"}
                            className="flex items-center text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <Ticket className="mr-2 h-4 w-4" />
                            Assign Ticket
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
              <CardDescription>View all bookings with assigned tickets</CardDescription>
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
                      <TableHead>Destination</TableHead>
                      <TableHead>Travel Dates</TableHead>
                      <TableHead>Ticket Number</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {confirmedBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.id}</TableCell>
                        <TableCell>{booking.touristName}</TableCell>
                        <TableCell>{booking.destination}</TableCell>
                        <TableCell>
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {booking.ticketNumber}
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