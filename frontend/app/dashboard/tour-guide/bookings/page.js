"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Calendar, MapPin, Search, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { create } from 'zustand'

// Mock data for tour guide bookings
const mockBookings = [
  {
    id: "TB001",
    touristName: "John Smith",
    destination: "Serengeti National Park",
    date: "2023-07-15",
    time: "09:00 AM",
    duration: "3 hours",
    tourists: 2,
  },
  {
    id: "TB002",
    touristName: "Sarah Johnson",
    destination: "Zanzibar Beaches",
    date: "2023-08-01",
    time: "10:30 AM",
    duration: "4 hours",
    tourists: 3,
  },
  {
    id: "TB003",
    touristName: "Michael Brown",
    destination: "Mount Kilimanjaro",
    date: "2023-09-10",
    time: "08:00 AM",
    duration: "Full day",
    tourists: 1,
  },
  {
    id: "TB004",
    touristName: "Emily Davis",
    destination: "Ngorongoro Conservation Area",
    date: "2023-10-05",
    time: "07:30 AM",
    duration: "6 hours",
    tourists: 4,
  },
]

// Zustand store for TourGuideBookings
const useTourGuideBookingsStore = create((set, get) => ({
  bookings: mockBookings,
  searchTerm: "",
  setBookings: (bookings) => set({ bookings }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),

  // Derived state for filtered bookings
  getFilteredBookings: () => {
    const searchTerm = get().searchTerm;
    const bookings = get().bookings;
    return bookings.filter(
      (booking) =>
        booking.touristName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },

  // Derived state for sorted bookings
  getSortedBookings: () => {
    const filteredBookings = get().getFilteredBookings();
    return [...filteredBookings].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  },
}));


export default function TourGuideBookings() {
  const router = useRouter()
  const {
    searchTerm,
    setSearchTerm,
    getSortedBookings
  } = useTourGuideBookingsStore(); 

  const sortedBookings = getSortedBookings();


  const formatDate = (dateString) => {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isUpcoming = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(dateString);
    return bookingDate >= today;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">My Tour Schedule</h1>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search bookings by tourist name, destination, or booking ID..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tours</CardTitle>
          <CardDescription>View all the tours you are scheduled to guide</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedBookings.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No bookings found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Tourist</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Group Size</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.id}</TableCell>
                    <TableCell>{booking.touristName}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-primary" />
                        {booking.destination}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatDate(booking.date)}</span>
                        <span className="text-sm text-muted-foreground">{booking.time}</span>
                      </div>
                    </TableCell>
                    <TableCell>{booking.duration}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {booking.tourists}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isUpcoming(booking.date) ? "outline" : "secondary"}>
                        {isUpcoming(booking.date) ? "Upcoming" : "Past"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button variant="outline" className="flex items-center" onClick={() => window.print()}>
          <Calendar className="mr-2 h-4 w-4" />
          Print Schedule
        </Button>
      </div>
    </div>
  )
}