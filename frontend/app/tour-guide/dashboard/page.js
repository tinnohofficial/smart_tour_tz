"use client"

import { useEffect } from "react"
import { Calendar, CreditCard, Map, Star, Users, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
          <p className="mt-4 text-gray-600">Loading Smart Tour Tanzania...</p>
        </div>
      </div>
    )
  }

  // Extract expertise details safely
  const generalExpertise = userData?.expertise?.general || "";
  const activityExpertise = userData?.expertise?.activities || [];
  
  // Check if expertises exist
  const hasGeneralExpertise = !!generalExpertise && typeof generalExpertise === 'string';
  const hasActivityExpertise = Array.isArray(activityExpertise) && activityExpertise.length > 0;
  const hasAnyExpertise = hasGeneralExpertise || hasActivityExpertise;

  const upcomingTours = tours.filter(t => t.status === "upcoming");
  const totalTourists = upcomingTours.reduce((acc, tour) => acc + tour.touristCount, 0);

  return (
    <div>
      {/* Header Section - Matching the mockup */}
      <div className="bg-blue-600 p-6 mb-6 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Tour Guide Dashboard</h1>
            <p className="text-blue-100">Welcome back, {userData?.name}</p>
            
            {profileStatus === 'active' && (
              <div className="flex mt-2 gap-3">
                <Badge className="bg-blue-700/40 text-white border-0">
                  Active Guide
                </Badge>
                <Badge className="bg-blue-700/40 text-white border-0">
                  {userData?.rating || '4.5'} Rating
                </Badge>
              </div>
            )}
          </div>
          
          <div className="mt-4 md:mt-0 bg-blue-700/40 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
              <div>
                <span className="text-sm text-white font-medium">Availability Status</span>
                <p className="text-xs text-blue-100">Set your availability for new tours</p>
              </div>
              <Switch 
                checked={isAvailable} 
                onCheckedChange={handleAvailabilityChange}
                disabled={profileStatus !== 'active'}
                className="data-[state=checked]:bg-yellow-400" 
              />
              <span className="text-xs text-white">
                {isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>
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
            {/* Stats Cards - Matching the mockup layout */}
            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Upcoming Tours Card */}
              <Card className="bg-blue-50/50">
                <CardContent className="p-0">
                  <div className="flex justify-between items-center">
                    <div className="p-5">
                      <p className="text-sm font-medium text-gray-500">Upcoming Tours</p>
                      <div className="flex items-end gap-1 mt-2">
                        <p className="text-2xl font-bold">
                          {upcomingTours.length}
                        </p>
                        <p className="text-xs text-gray-500 mb-1 ml-1">scheduled</p>
                      </div>
                      <Link href="/tour-guide/bookings" className="text-xs text-blue-600 mt-3 font-medium flex items-center">
                        View Schedule
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Link>
                    </div>
                    <div className="h-full flex items-center pr-5">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Earnings Card */}
              <Card className="bg-green-50/50">
                <CardContent className="p-0">
                  <div className="flex justify-between items-center">
                    <div className="p-5">
                      <p className="text-sm font-medium text-gray-500">Monthly Earnings</p>
                      <p className="text-2xl font-bold mt-2">
                        {earnings?.currentMonth || '$1,200'}
                      </p>
                      <Link href="#" className="text-xs text-green-600 mt-3 font-medium flex items-center">
                        View Earnings
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Link>
                    </div>
                    <div className="h-full flex items-center pr-5">
                      <div className="bg-green-100 p-3 rounded-full">
                        <CreditCard className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Rating Card */}
              <Card className="bg-yellow-50/50">
                <CardContent className="p-0">
                  <div className="flex justify-between items-center">
                    <div className="p-5">
                      <p className="text-sm font-medium text-gray-500">Performance Rating</p>
                      <p className="text-2xl font-bold mt-2">
                        {userData?.rating || '4.5'}
                      </p>
                      <Link href="#" className="text-xs text-yellow-600 mt-3 font-medium flex items-center">
                        {userData?.reviewCount || '12'} Reviews
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Link>
                    </div>
                    <div className="h-full flex items-center pr-5">
                      <div className="flex">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-200" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tourists Guided Card */}
              <Card className="bg-purple-50/50">
                <CardContent className="p-0">
                  <div className="flex justify-between items-center">
                    <div className="p-5">
                      <p className="text-sm font-medium text-gray-500">Tourists Guided</p>
                      <div className="flex items-end gap-1 mt-2">
                        <p className="text-2xl font-bold">
                          {totalTourists}
                        </p>
                        <p className="text-xs text-gray-500 mb-1 ml-1">this month</p>
                      </div>
                      <Link href="#" className="text-xs text-purple-600 mt-3 font-medium flex items-center">
                        Tourist Details
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Link>
                    </div>
                    <div className="h-full flex items-center pr-5">
                      <div className="bg-purple-100 p-3 rounded-full">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Overview */}
            <div className="md:col-span-4">
              <Card>
                <CardHeader className="flex justify-between items-center pb-2 pt-5 px-6">
                  <h3 className="font-semibold text-gray-800">Profile Overview</h3>
                  <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 p-0" asChild>
                    <Link href="/tour-guide/profile">
                      Edit
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center px-6">
                  <Avatar className="h-20 w-20 bg-blue-600 mb-4">
                    <AvatarImage src={userData?.profileImage} alt={userData?.name} />
                    <AvatarFallback>{userData?.name?.charAt(0) || 'E'}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg text-gray-900">{userData?.name || 'Edmund Ngowi'}</h3>
                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                    <Map className="h-3 w-3" />
                    <span>{userData?.location || 'Arusha, Tanzania'}</span>
                  </div>
                  
                  <div className="flex items-center mt-3">
                    <Badge className="bg-blue-100 text-blue-600 border-0">Tour Guide</Badge>
                    <Badge className="bg-gray-100 text-gray-600 border-0 ml-2">{userData?.yearsExperience || '3'}+ years</Badge>
                  </div>
                  
                  <div className="w-full mt-6 border-t pt-5">
                    <h4 className="font-medium text-sm mb-3 text-gray-700 text-left">Areas of Expertise</h4>
                    <div className="flex flex-wrap gap-1">
                      {hasGeneralExpertise && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {generalExpertise}
                        </Badge>
                      )}
                      
                      {hasActivityExpertise && 
                        activityExpertise.map((activity) => (
                          <Badge key={activity.id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {activity.name}
                          </Badge>
                        ))
                      }
                      
                      {!hasAnyExpertise && (
                        <Badge variant="outline" className="border-blue-200 text-blue-600">
                          Guided Nature Walks
                        </Badge>
                      )}
                    </div>
                    <Button className="w-full text-white bg-blue-600 hover:bg-blue-700 mt-5" size="sm" asChild>
                      <Link href="/tour-guide/profile">Edit Profile</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Tours Section */}
            <div className="md:col-span-8">
              <Card>
                <CardHeader className="flex justify-between items-center pb-2 pt-5 px-6">
                  <div>
                    <h3 className="font-semibold text-gray-800">Upcoming Tours</h3>
                    <p className="text-sm text-gray-500">Your scheduled tour assignments</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-8" asChild>
                    <Link href="/tour-guide/bookings">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent className="px-6 pb-5">
                  {upcomingTours.length > 0 ? (
                    upcomingTours.map((tour) => (
                      <div key={tour.id} className="flex items-center gap-4 py-4 border-b last:border-0">
                        <div className="flex-shrink-0">
                          <img
                            src={tour.image || "/placeholder.svg"}
                            alt={tour.destination}
                            className="h-16 w-20 object-cover rounded-md"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{tour.destination}</h3>
                              <p className="text-sm text-gray-500">
                                {new Date(tour.startDate).toLocaleDateString()} - {new Date(tour.endDate).toLocaleDateString()}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Users className="h-3 w-3 text-gray-500" />
                                <span className="text-sm text-gray-500">{tour.touristCount} tourists</span>
                              </div>
                            </div>
                            <Badge>{new Date(tour.startDate).toLocaleDateString()}</Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-gray-300" />
                      <p className="mt-3 text-gray-500 font-medium">No upcoming tours scheduled</p>
                      <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                        When you're assigned to guide a tour, it will appear here. Make sure your availability is turned on.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
