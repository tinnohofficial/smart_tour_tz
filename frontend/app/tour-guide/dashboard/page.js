"use client"

import { useEffect } from "react"
import Image from "next/image"
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
    
    try {
      await setIsAvailable(checked)
      if (checked) {
        toast.success("You are now available", {
          description: "You will be considered for new tour assignments."
        })
      } else {
        toast.info("You are now unavailable", {
          description: "You will not receive new tour assignments."
        })
      }
    } catch (error) {
      // Error already handled in store, just show user feedback
      console.error('Availability update failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-700 mx-auto"></div>
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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
      {/* Header Section - Improved mobile responsiveness */}
      <div className="bg-amber-700 p-4 sm:p-6 mb-4 sm:mb-6 rounded-lg">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="w-full lg:w-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Tour Guide Dashboard</h1>
            <p className="text-amber-100 text-sm sm:text-base">Welcome back, {userData?.name}</p>
            
            {profileStatus === 'active' && (
              <div className="flex mt-2 gap-3">
                <Badge className="bg-amber-800/40 text-white border-0 text-xs sm:text-sm">
                  Active Guide
                </Badge>
              </div>
            )}
          </div>
          
          <div className="w-full lg:w-auto bg-amber-800/40 rounded-lg px-3 sm:px-4 py-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <div className="flex-1">
                <span className="text-sm text-white font-medium">Availability Status</span>
                <p className="text-xs text-amber-100">Set your availability for new tours</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={isAvailable} 
                  onCheckedChange={handleAvailabilityChange}
                  disabled={profileStatus !== 'active'}
                  className="data-[state=checked]:bg-yellow-400"
                />
                <span className="text-xs text-white whitespace-nowrap">
                  {isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        {/* Profile status content */}
        {profileStatus === 'pending_profile' ? (
          <div className="xl:col-span-12">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Profile Status</p>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-600">Complete Your Profile</p>
                    <p className="text-sm text-gray-500 mt-2">Please complete your tour guide profile to start receiving assignments</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-full flex-shrink-0">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button className="w-full sm:w-auto" asChild>
                    <Link href="/tour-guide/profile">Complete Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : profileStatus === 'pending_approval' ? (
          <div className="xl:col-span-12">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Profile Status</p>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-600">Pending Approval</p>
                    <p className="text-sm text-gray-500 mt-2">Your profile is being reviewed by our administrators</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-full flex-shrink-0">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="xl:col-span-12">
            {/* Stats Cards - Improved mobile grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
              {/* Upcoming Tours Card */}
              <Card className="bg-amber-50/50">
                <CardContent className="p-0">
                  <div className="flex justify-between items-center">
                    <div className="p-4 sm:p-5">
                      <p className="text-sm font-medium text-gray-500">Upcoming Tours</p>
                      <div className="flex items-end gap-1 mt-2">
                        <p className="text-xl sm:text-2xl font-bold">
                          {upcomingTours.length}
                        </p>
                        <p className="text-xs text-gray-500 mb-1 ml-1">scheduled</p>
                      </div>
                      <Link href="/tour-guide/bookings" className="text-xs text-amber-700 mt-3 font-medium flex items-center hover:text-amber-800 transition-colors">
                        View Schedule
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Link>
                    </div>
                    <div className="h-full flex items-center pr-4 sm:pr-5">
                      <div className="bg-amber-100 p-2 sm:p-3 rounded-full">
                        <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Earnings Card */}
              <Card className="bg-green-50/50">
                <CardContent className="p-0">
                  <div className="flex justify-between items-center">
                    <div className="p-4 sm:p-5">
                      <p className="text-sm font-medium text-gray-500">Monthly Earnings</p>
                      <p className="text-xl sm:text-2xl font-bold mt-2">
                        {earnings?.currentMonth || '$1,200'}
                      </p>
                      <Link href="#" className="text-xs text-green-600 mt-3 font-medium flex items-center hover:text-green-700 transition-colors">
                        View Earnings
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Link>
                    </div>
                    <div className="h-full flex items-center pr-4 sm:pr-5">
                      <div className="bg-green-100 p-2 sm:p-3 rounded-full">
                        <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tourists Guided Card */}
              <Card className="bg-purple-50/50">
                <CardContent className="p-0">
                  <div className="flex justify-between items-center">
                    <div className="p-4 sm:p-5">
                      <p className="text-sm font-medium text-gray-500">Tourists Guided</p>
                      <div className="flex items-end gap-1 mt-2">
                        <p className="text-xl sm:text-2xl font-bold">
                          {totalTourists}
                        </p>
                        <p className="text-xs text-gray-500 mb-1 ml-1">this month</p>
                      </div>
                      <Link href="#" className="text-xs text-purple-600 mt-3 font-medium flex items-center hover:text-purple-700 transition-colors">
                        Tourist Details
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Link>
                    </div>
                    <div className="h-full flex items-center pr-4 sm:pr-5">
                      <div className="bg-purple-100 p-2 sm:p-3 rounded-full">
                        <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Locations Covered Card */}
              <Card className="bg-blue-50/50">
                <CardContent className="p-0">
                  <div className="flex justify-between items-center">
                    <div className="p-4 sm:p-5">
                      <p className="text-sm font-medium text-gray-500">Locations Covered</p>
                      <div className="flex items-end gap-1 mt-2">
                        <p className="text-xl sm:text-2xl font-bold">
                          {tours.length || 5}
                        </p>
                        <p className="text-xs text-gray-500 mb-1 ml-1">destinations</p>
                      </div>
                      <Link href="#" className="text-xs text-blue-600 mt-3 font-medium flex items-center hover:text-blue-700 transition-colors">
                        View Map
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Link>
                    </div>
                    <div className="h-full flex items-center pr-4 sm:pr-5">
                      <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                        <Map className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid - Responsive layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
              {/* Profile Overview */}
              <div className="lg:col-span-4">
                <Card>
                  <CardHeader className="flex flex-row justify-between items-center pb-2 pt-4 sm:pt-5 px-4 sm:px-6">
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Profile Overview</h3>
                    <Button variant="ghost" size="sm" className="h-8 text-amber-700 hover:text-amber-800 p-0" asChild>
                      <Link href="/tour-guide/profile">
                        Edit
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center text-center px-4 sm:px-6">
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20 bg-amber-700 mb-4">
                      <AvatarImage src={userData?.profileImage} alt={userData?.name} />
                      <AvatarFallback>{userData?.name?.charAt(0) || 'E'}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900">{userData?.name || 'Edmund Ngowi'}</h3>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <Map className="h-3 w-3" />
                      <span>{userData?.location || 'Arusha, Tanzania'}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3 justify-center">
                      <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Tour Guide</Badge>
                      <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">{userData?.yearsExperience || '3'}+ years</Badge>
                    </div>
                    
                    <div className="w-full mt-6 border-t pt-5">
                      <h4 className="font-medium text-sm mb-3 text-gray-700 text-left">Areas of Expertise</h4>
                      <div className="flex flex-wrap gap-1 justify-start">
                        {hasGeneralExpertise && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                            {generalExpertise}
                          </Badge>
                        )}
                        
                        {hasActivityExpertise && 
                          activityExpertise.map((activity) => (
                            <Badge key={activity.id} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                              {activity.name}
                            </Badge>
                          ))
                        }
                        
                        {!hasAnyExpertise && (
                          <Badge variant="outline" className="border-amber-200 text-amber-700 text-xs">
                            Guided Nature Walks
                          </Badge>
                        )}
                      </div>
                      <Button className="w-full text-white bg-amber-700 hover:bg-amber-800 mt-5" size="sm" asChild>
                        <Link href="/tour-guide/profile">Edit Profile</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Tours Section */}
              <div className="lg:col-span-8">
                <Card>
                  <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 pt-4 sm:pt-5 px-4 sm:px-6 gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Upcoming Tours</h3>
                      <p className="text-sm text-gray-500">Your scheduled tour assignments</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 w-full sm:w-auto" asChild>
                      <Link href="/tour-guide/bookings">View All</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-5">
                    {upcomingTours.length > 0 ? (
                      upcomingTours.map((tour) => (
                        <div key={tour.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 py-4 border-b last:border-0">
                          <div className="flex-shrink-0 relative h-16 w-20 sm:w-20 rounded-md overflow-hidden">
                            <Image
                              src={tour.image || "/placeholder.svg"}
                              alt={tour.destination}
                              className="h-full w-full object-cover"
                              fill
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{tour.destination}</h3>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  {new Date(tour.startDate).toLocaleDateString()} - {new Date(tour.endDate).toLocaleDateString()}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Users className="h-3 w-3 text-gray-500" />
                                  <span className="text-xs sm:text-sm text-gray-500">{tour.touristCount} tourists</span>
                                </div>
                              </div>
                              <Badge className="text-xs whitespace-nowrap">{new Date(tour.startDate).toLocaleDateString()}</Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center">
                        <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-300" />
                        <p className="mt-3 text-gray-500 font-medium text-sm sm:text-base">No upcoming tours scheduled</p>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-md mx-auto px-4">
                          When you&apos;re assigned to guide a tour, it will appear here. Make sure your availability is turned on.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
