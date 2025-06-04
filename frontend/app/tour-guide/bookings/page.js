"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { CalendarDays, Users, MapPin, Phone, Mail, Clock, Building2, Car, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useBookingsStore } from "./store"
import { format } from "date-fns"

export default function TourGuideBookings() {
  const {
    tours,
    selectedTour,
    isLoading,
    statusFilter,
    setStatusFilter,
    fetchTours,
    fetchTourDetails,
  } = useBookingsStore()

  const [selectedTourId, setSelectedTourId] = useState(null)

  useEffect(() => {
    fetchTours()
  }, [fetchTours])

  // Filter tours based on status filter
  const filteredTours = tours.filter((tour) => {
    const matchesStatus = statusFilter === "all" || tour.booking_status === statusFilter || tour.status === statusFilter
    return matchesStatus
  })

  const handleViewDetails = async (tourId) => {
    setSelectedTourId(tourId)
    await fetchTourDetails(tourId)
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your tours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Tours</h1>
        <p className="text-muted-foreground">Manage your upcoming and past tours</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Search and Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-sm">Total Tours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-full">
                  <CalendarDays className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tours.length}</p>
                  <p className="text-sm text-muted-foreground">All time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-sm">Total Tourists</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-full">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {tours.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Total tourists</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tours List Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <CardTitle>Tour Assignments</CardTitle>
                <CardDescription>View and manage your tour assignments</CardDescription>
              </div>
              <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setStatusFilter}>
                <TabsList className="grid w-full md:w-auto grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredTours.length === 0 ? (
                <div className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <CalendarDays className="h-8 w-8 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">No tours found</h3>
                    <p className="text-muted-foreground">
                      "You don't have any assigned tours yet"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {filteredTours.map((tour) => (
                    <div
                      key={tour.id}
                      className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 rounded-lg border bg-card text-card-foreground shadow-sm"
                    >
                      {/* Tour Image */}
                      <div className="w-full lg:w-48 h-48 lg:h-full relative rounded-md overflow-hidden flex-shrink-0">
                        <Image
                          src={tour.image}
                          alt={tour.destination}
                          className="absolute inset-0 w-full h-full object-cover"
                          fill
                        />
                      </div>

                      {/* Tour Details */}
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex flex-col xl:flex-row justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
                              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
                              <h3 className="font-semibold text-base sm:text-lg truncate">{tour.destination}</h3>
                              <Badge variant={tour.booking_status === 'upcoming' ? 'default' : tour.booking_status === 'ongoing' ? 'destructive' : 'secondary'} className="text-xs whitespace-nowrap">
                                {tour.booking_status === 'upcoming' ? 'Upcoming' : tour.booking_status === 'ongoing' ? 'Ongoing' : 'Completed'}
                              </Badge>
                            </div>
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">
                                  {format(new Date(tour.startDate), 'PPP')} -{' '}
                                  {format(new Date(tour.endDate), 'PPP')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 flex-shrink-0" />
                                <span>{tour.duration} day{tour.duration !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-row xl:flex-col items-start xl:items-end gap-2 xl:gap-2">
                            <Badge variant="outline" className="text-xs">
                              Paid
                            </Badge>
                            <p className="text-lg font-bold">TZS {(tour.amount * 2835).toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Tourist Contact Information */}
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-2">Tourist Contact</h4>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-md">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {tour.tourist_name ? tour.tourist_name.charAt(0).toUpperCase() : (tour.tourist_email ? tour.tourist_email.charAt(0).toUpperCase() : 'T')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                {tour.tourist_name && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs font-medium text-gray-700">{tour.tourist_name}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground truncate">{tour.tourist_email || 'No email provided'}</span>
                                </div>
                                {tour.tourist_phone && tour.tourist_phone !== 'Not provided' && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{tour.tourist_phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Info */}
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-2">Tour Includes</h4>
                          <div className="flex flex-wrap gap-2">
                            {tour.hotel && (
                              <Badge variant="outline" className="text-xs">
                                <Building2 className="h-3 w-3 mr-1" />
                                Accommodation
                              </Badge>
                            )}
                            {tour.transport && (
                              <Badge variant="outline" className="text-xs">
                                <Car className="h-3 w-3 mr-1" />
                                Transport
                              </Badge>
                            )}
                            {tour.activities && tour.activities.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                {tour.activities.length} Activities
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" onClick={() => handleViewDetails(tour.id)} className="text-xs sm:text-sm">
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Tour Details - {tour.destination}</DialogTitle>
                                <DialogDescription>
                                  Complete itinerary and tourist information
                                </DialogDescription>
                              </DialogHeader>
                              {selectedTour && selectedTourId === tour.id && (
                                <TourDetailsDialog tour={selectedTour} />
                              )}
                            </DialogContent>
                          </Dialog>
                          {tour.booking_status === 'upcoming' && (
                            <>
                              <Button size="sm" variant="outline" className="text-xs sm:text-sm" asChild>
                                <a href={`mailto:${tour.tourist_email}`}>
                                  Contact Tourist
                                </a>
                              </Button>
                              {tour.tourist_phone && tour.tourist_phone !== 'Not provided' && (
                                <Button size="sm" variant="outline" className="text-xs sm:text-sm" asChild>
                                  <a href={`tel:${tour.tourist_phone}`}>
                                    Call Tourist
                                  </a>
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Tour Details Dialog Component
function TourDetailsDialog({ tour }) {
  return (
    <div className="space-y-6">
      {/* Tour Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Tour Information</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{tour.destination_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(tour.start_date), 'PPP')} - {format(new Date(tour.end_date), 'PPP')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{tour.duration_days} day{tour.duration_days !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={tour.booking_status === 'upcoming' ? 'default' : tour.booking_status === 'ongoing' ? 'destructive' : 'secondary'}>
                {tour.booking_status.charAt(0).toUpperCase() + tour.booking_status.slice(1)}
              </Badge>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Tourist Contact</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${tour.tourist_email}`} className="text-blue-600 hover:underline">
                {tour.tourist_email}
              </a>
            </div>
            {tour.tourist_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${tour.tourist_phone}`} className="text-blue-600 hover:underline">
                  {tour.tourist_phone}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Destination Description */}
      {tour.destination_description && (
        <div>
          <h3 className="text-lg font-semibold mb-3">About {tour.destination_name}</h3>
          <p className="text-muted-foreground">{tour.destination_description}</p>
        </div>
      )}

      {/* Itinerary Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Accommodation */}
        {tour.items?.hotel && tour.items.hotel.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Accommodation
            </h3>
            {tour.items.hotel.map((hotel, index) => (
              <Card key={`hotel-${tour.id}-${index}`}>
                <CardContent className="p-4">
                  <h4 className="font-medium">{hotel.item_name}</h4>
                  <p className="text-sm text-muted-foreground">{hotel.item_details_extra}</p>
                  <p className="text-sm font-medium mt-2">TZS {(hotel.cost * 2835).toLocaleString()}</p>
                  {hotel.item_details && typeof hotel.item_details === 'object' && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Room Number: {hotel.item_details.roomNumber}</p>
                      <p>Room Type: {hotel.item_details.roomType}</p>
                      {hotel.item_details.description && (
                        <p>Description: {hotel.item_details.description}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Transport */}
        {tour.items?.transport && tour.items.transport.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Car className="h-5 w-5" />
              Transport
            </h3>
            {tour.items.transport.map((transport, index) => (
              <Card key={`transport-${tour.id}-${index}`}>
                <CardContent className="p-4">
                  <h4 className="font-medium">{transport.item_name}</h4>
                  <p className="text-sm text-muted-foreground">Duration: {transport.item_details_extra}</p>
                  <p className="text-sm font-medium mt-2">TZS {(transport.cost * 2835).toLocaleString()}</p>
                  {transport.item_details && typeof transport.item_details === 'object' && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {transport.item_details.ticket_pdf_url ? (
                        <div className="flex items-center gap-2">
                          <span>🎫</span>
                          <a 
                            href={transport.item_details.ticket_pdf_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline font-medium"
                          >
                            Download Ticket PDF
                          </a>
                        </div>
                      ) : (
                        <p className="text-amber-600 italic">⏳ Waiting for ticket assignment</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Activities */}
        {tour.items?.activities && tour.items.activities.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Star className="h-5 w-5" />
              Activities
            </h3>
            <div className="space-y-3">
              {tour.items.activities.map((activity, index) => (
                <Card key={`activity-${tour.id}-${index}`}>
                  <CardContent className="p-4">
                    <h4 className="font-medium">{activity.item_name}</h4>
                    <p className="text-sm text-muted-foreground">{activity.item_details_extra}</p>
                    <p className="text-sm font-medium mt-2">TZS {(activity.cost * 2835).toLocaleString()}</p>
                    {activity.item_details && typeof activity.item_details === 'object' && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {activity.item_details.date && (
                          <p>Date: {activity.item_details.date}</p>
                        )}
                        {activity.item_details.time_slot && (
                          <p>Time: {activity.item_details.time_slot}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Total Cost */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total Tour Cost:</span>
          <span className="text-2xl font-bold">TZS {(tour.total_cost * 2835).toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
