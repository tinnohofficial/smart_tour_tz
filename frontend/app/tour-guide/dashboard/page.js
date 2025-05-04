"use client"

import { useEffect } from "react"
import { Calendar, CreditCard, Map, Star, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"
import { useDashboardStore } from "./store"

export default function TourGuideDashboard() {
  const {
    userData,
    tours,
    earnings,
    isLoading,
    isAvailable,
    profileStatus,
    setIsAvailable,
    fetchDashboard,
  } = useDashboardStore()

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const handleAvailabilityChange = async (checked) => {
    if (profileStatus !== 'active') {
      toast.error("You need to be approved to change availability")
      return
    }
    
    setIsAvailable(checked)
    await new Promise((resolve) => setTimeout(resolve, 500))
    if (checked) {
      toast.success("You are now available", {
        description: "You will be considered for new tour assignments."
      })
    } else {
      toast.info("You are now unavailable", {
        description: "You will not receive new tour assignments."
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Smart Tour Tanzania...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tour Guide Dashboard</h1>
            <p className="text-gray-600">Welcome back, {userData?.name}</p>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Availability Status</span>
              <span className="text-xs text-gray-500">Set your availability for new tours</span>
            </div>
            <Switch 
              checked={isAvailable} 
              onCheckedChange={handleAvailabilityChange}
              disabled={profileStatus !== 'active'} 
            />
            <Badge variant={isAvailable ? "outline" : "outline"} className="ml-2">
              {isAvailable ? "Available" : "Unavailable"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Show appropriate content based on profile status */}
        {profileStatus === 'pending_profile' ? (
          <div className="md:col-span-12">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Profile Status</p>
                    <p className="text-2xl font-bold text-yellow-600">Complete Your Profile</p>
                    <p className="text-sm text-gray-500 mt-2">Please complete your tour guide profile to start receiving assignments</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Users className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button className="w-full" asChild>
                    <Link href="/tour-guide/profile">Complete Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : profileStatus === 'pending_approval' ? (
          <div className="md:col-span-12">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Profile Status</p>
                    <p className="text-2xl font-bold text-yellow-600">Pending Approval</p>
                    <p className="text-sm text-gray-500 mt-2">Your profile is being reviewed by our administrators</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <Users className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Upcoming Tours</p>
                      <p className="text-2xl font-bold">
                        {tours.filter((t) => t.status === "upcoming").length}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">This Month</p>
                      <p className="text-2xl font-bold">{earnings?.currentMonth}</p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-full">
                      <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Rating</p>
                      <div className="flex items-center">
                        <p className="text-2xl font-bold">{userData?.rating}</p>
                        <Star className="h-4 w-4 ml-1 text-yellow-500 fill-yellow-500" />
                      </div>
                    </div>
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Star className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Tourists</p>
                      <p className="text-2xl font-bold">
                        {tours.filter((t) => t.status === "upcoming").reduce((acc, tour) => acc + tour.touristCount, 0)}
                      </p>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Profile Overview</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center pb-2">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarImage src={userData?.profileImage} alt={userData?.name} />
                    <AvatarFallback>{userData?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium text-lg">{userData?.name}</h3>

                  <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                    <Map className="h-3 w-3" />
                    <span>{userData?.location}</span>
                  </div>

                  <div className="w-full mt-4">
                    <Separator className="my-2" />
                    <div className="flex-1 pb-4">
                      <h4 className="font-medium text-sm mb-2">Areas of Expertise</h4>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {userData?.expertise?.general && (
                          <Badge variant="outline" className="text-sm">
                            {userData.expertise.general}
                          </Badge>
                        )}
                        {userData?.expertise?.activities?.map((activity) => (
                          <Badge key={activity.id} variant="outline" className="text-sm">
                            {activity.name}
                          </Badge>
                        ))}
                        {!userData?.expertise?.general && !userData?.expertise?.activities?.length && (
                          <span className="text-sm text-muted-foreground">No expertise listed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full hover:bg-blue-50" size="sm" asChild>
                    <Link href="/tour-guide/profile">Edit Profile</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="md:col-span-8 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Tours</CardTitle>
                  <CardDescription>Your scheduled tour assignments</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-4 px-6 py-4">
                    {tours.filter((tour) => tour.status === "upcoming").map((tour) => (
                      <div key={tour.id} className="flex gap-4 pb-4 border-b last:border-0">
                        <img
                          src={tour.image || "/placeholder.svg"}
                          alt={tour.destination}
                          className="h-20 w-24 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{tour.destination}</h3>
                              <p className="text-sm text-gray-500">
                                {new Date(tour.startDate).toLocaleDateString()} -{" "}
                                {new Date(tour.endDate).toLocaleDateString()}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Users className="h-3 w-3 text-gray-500" />
                                <span className="text-sm text-gray-500">{tour.touristCount} tourists</span>
                              </div>
                            </div>
                            <Badge>{new Date(tour.startDate).toLocaleDateString()}</Badge>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline" className="h-8 border border-blue-200 hover:bg-blue-50">
                              View Details
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 border border-blue-200 hover:bg-blue-50">
                              Contact Tourists
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {tours.filter((tour) => tour.status === "upcoming").length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        No upcoming tours scheduled
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-4">
                  <Button variant="outline" asChild>
                    <Link href="/tour-guide/bookings">View All Tours</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  )
}
