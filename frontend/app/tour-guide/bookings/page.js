"use client"

import { useEffect } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBookingsStore } from "./store"

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
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Smart Tour Tanzania...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assigned Tours</h1>
        <p className="text-gray-600">Manage your upcoming and past tours</p>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search tours..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
 
      </div>

      <Tabs defaultValue="all" className="space-y-5">
        <TabsList>
          <TabsTrigger value="all">All Tours</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          {filteredTours.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No tours found matching your criteria</p>
            </div>
          ) : (
            filteredTours.map((tour) => (
              <Card key={tour.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-48 h-40 md:h-auto">
                    <img
                      src={tour.image || "/placeholder.svg"}
                      alt={tour.destination}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg">{tour.destination}</h3>
                          <Badge variant={tour.status === "upcoming" ? "outline" : "outline"}>
                            {tour.status === "upcoming" ? "Upcoming" : "Completed"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(tour.startDate).toLocaleDateString()} -{" "}
                          {new Date(tour.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant={tour.paymentStatus === "paid" ? "outline" : "secondary"}>
                          {tour.paymentStatus === "paid" ? "Paid" : "Payment Pending"}
                        </Badge>
                        <p className="text-lg font-bold mt-1">${tour.amount}</p>
                      </div>
                    </div>
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-medium mb-2">Tourists ({tour.touristCount})</h4>
                      <div className="flex flex-wrap gap-2">
                        {tour.touristNames.map((name, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 rounded-md">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm">View Details</Button>
                      {tour.status === "upcoming" && (
                        <Button size="sm" variant="outline">
                          Contact Tourists
                        </Button>
                      )}
                      {tour.status === "upcoming" && (
                        <Button size="sm" variant="outline">
                          View Itinerary
                        </Button>
                      )}
                      {tour.status === "completed" && (
                        <Button size="sm" variant="outline">
                          View Feedback
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
        <TabsContent value="upcoming" className="space-y-4">
          {filteredTours.filter((tour) => tour.status === "upcoming").length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No upcoming tours found</p>
            </div>
          ) : (
            filteredTours
              .filter((tour) => tour.status === "upcoming")
              .map((tour) => (
                <Card key={tour.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-48 h-40 md:h-auto">
                      <img
                        src={tour.image || "/placeholder.svg"}
                        alt={tour.destination}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">{tour.destination}</h3>
                            <Badge>Upcoming</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(tour.startDate).toLocaleDateString()} -{" "}
                            {new Date(tour.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge variant={tour.paymentStatus === "paid" ? "outline" : "secondary"}>
                            {tour.paymentStatus === "paid" ? "Paid" : "Payment Pending"}
                          </Badge>
                          <p className="text-lg font-bold mt-1">${tour.amount}</p>
                        </div>
                      </div>
                      <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-medium mb-2">Tourists ({tour.touristCount})</h4>
                        <div className="flex flex-wrap gap-2">
                          {tour.touristNames.map((name, index) => (
                            <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm">View Details</Button>
                        <Button size="sm" variant="outline">
                          Contact Tourists
                        </Button>
                        <Button size="sm" variant="outline">
                          View Itinerary
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
          )}
        </TabsContent>
        <TabsContent value="completed" className="space-y-4">
          {filteredTours.filter((tour) => tour.status === "completed").length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No completed tours found</p>
            </div>
          ) : (
            filteredTours
              .filter((tour) => tour.status === "completed")
              .map((tour) => (
                <Card key={tour.id} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-48 h-40 md:h-auto">
                      <img
                        src={tour.image || "/placeholder.svg"}
                        alt={tour.destination}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">{tour.destination}</h3>
                            <Badge variant="secondary">Completed</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(tour.startDate).toLocaleDateString()} -{" "}
                            {new Date(tour.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge variant="outline">Paid</Badge>
                          <p className="text-lg font-bold mt-1">${tour.amount}</p>
                        </div>
                      </div>
                      <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-medium mb-2">Tourists ({tour.touristCount})</h4>
                        <div className="flex flex-wrap gap-2">
                          {tour.touristNames.map((name, index) => (
                            <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm">View Details</Button>
                        <Button size="sm" variant="outline">
                          View Feedback
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
