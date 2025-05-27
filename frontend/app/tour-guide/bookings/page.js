"use client"

import { useEffect } from "react"
import Image from "next/image"
import { Search, CalendarDays, Users, MapPin, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useBookingsStore } from "./store"
import { format } from "date-fns"

export default function TourGuideBookings() {
  const {
    tours,
    isLoading,
    searchQuery,
    statusFilter,
    setSearchQuery,
    setStatusFilter,
    fetchTours,
  } = useBookingsStore()

  useEffect(() => {
    fetchTours()
  }, [fetchTours])

  // Filter tours based on search query and status filter
  const filteredTours = tours.filter((tour) => {
    const matchesSearch = tour.destination.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || tour.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
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
          <Card className="col-span-1 md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-sm">Search Tours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by destination..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-sm">Total Tours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
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
                    {tours.reduce((acc, tour) => acc + tour.touristCount, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">All time</p>
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
                      {searchQuery
                        ? "No tours match your search criteria"
                        : "You don't have any tours yet"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredTours.map((tour) => (
                    <div
                      key={tour.id}
                      className="flex flex-col md:flex-row gap-6 p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
                    >
                      {/* Tour Image */}
                      <div className="w-full md:w-48 h-48 md:h-full relative rounded-md overflow-hidden">
                        <Image
                          src={tour.image}
                          alt={tour.destination}
                          className="absolute inset-0 w-full h-full object-cover"
                          fill
                        />
                      </div>

                      {/* Tour Details */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <h3 className="font-semibold text-lg">{tour.destination}</h3>
                              <Badge variant={tour.status === 'upcoming' ? 'default' : 'secondary'}>
                                {tour.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                              </Badge>
                            </div>
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4" />
                                <span>
                                  {format(new Date(tour.startDate), 'PPP')} -{' '}
                                  {format(new Date(tour.endDate), 'PPP')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{tour.touristCount} tourists</span>
                              </div>
                              {tour.rating && (
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span>{tour.rating.toFixed(1)} rating</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={tour.paymentStatus === 'paid' ? 'outline' : 'destructive'}>
                              {tour.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                            </Badge>
                            <p className="text-lg font-bold">${tour.amount}</p>
                          </div>
                        </div>

                        {/* Tourists */}
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-2">Tourists</h4>
                          <div className="flex flex-wrap gap-2">
                            {tour.touristNames.map((name, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-md"
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                          <Button size="sm">View Details</Button>
                          {tour.status === 'upcoming' && (
                            <>
                              <Button size="sm" variant="outline">
                                Contact Tourists
                              </Button>
                              <Button size="sm" variant="outline">
                                View Itinerary
                              </Button>
                            </>
                          )}
                          {tour.status === 'completed' && tour.feedback && (
                            <Button size="sm" variant="outline">
                              View Feedback
                            </Button>
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
