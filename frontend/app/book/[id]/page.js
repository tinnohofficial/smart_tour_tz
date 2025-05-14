"use client"

import React, { useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertCircle,
  Calendar,
  Check,
  CreditCard,
  Hotel,
  MapPin,
  RefreshCw,
  Star,
  Clock,
  ArrowRight,
  Bus,
  Plane,
  Ship,
  Wallet,
  Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Import the Zustand store and selectors/actions
import { useBookingStore, useBookingNights } from "./bookingStore"
// Import RouteProtection component
import { RouteProtection } from "@/components/route-protection"

// Activities mock data - this will be replaced in a future update
const activities = [
  { id: 1, name: "Game Drive", price: 100, duration: "3 hours", description: "Explore the wildlife in a 4x4 vehicle" },
  {
    id: 2,
    name: "Hot Air Balloon Safari",
    price: 300,
    duration: "1 hour",
    description: "See the landscape from above",
  },
  {
    id: 3,
    name: "Guided Nature Walk",
    price: 50,
    duration: "2 hours",
    description: "Learn about local flora and fauna",
  },
  { id: 4, name: "Cultural Village Visit", price: 75, duration: "4 hours", description: "Experience local traditions" },
]

function BookLocation({ params }) {
  const { id } = React.use(params) // Unwrap the params Promise
  const destinationId = parseInt(id, 10)

  const router = useRouter()

  // Get state and actions from Zustand store
  const {
    step,
    startDate,
    endDate,
    selectedTransportRoute,
    selectedHotel,
    selectedActivities,
    errors,
    agreedToTerms,
    paymentMethod,
    isPaymentDialogOpen,
    savingsBalance,
    setStartDate,
    setEndDate,
    setSelectedTransportRoute,
    setSelectedHotel,
    toggleActivity,
    setAgreedToTerms,
    setPaymentMethod,
    setIsPaymentDialogOpen,
    resetBooking,
    nextStep,
    prevStep,
    setErrors,
    
    // API-related state and actions
    destination,
    transportRoutes,
    hotels,
    activities: apiActivities,
    isLoading,
    error,
    fetchDestination,
    fetchTransportRoutes,
    fetchHotels,
    fetchActivities,
  } = useBookingStore()

  // Fetch destination data when component mounts
  useEffect(() => {
    if (destinationId) {
      fetchDestination(destinationId);
      console.log("Fetching destination with ID:", destinationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationId]); 

  // Debug log whenever destination changes
  useEffect(() => {
    if (destination) {
      console.log("Destination data loaded:", destination);
      console.log("Destination cost:", destination.cost);
    }
  }, [destination]);

  // Fetch related data when destination is loaded
  useEffect(() => {
    if (destination) {
      // Fetch transport routes relevant to this destination
      fetchTransportRoutes(destination.name || destination.region);
      
      // Fetch hotels in this location - prioritize using the region
      fetchHotels(destination.region || destination.name);
      
      // Fetch activities for this destination
      fetchActivities(destinationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination]);

  // For now, still using mock activities data - will be replaced in a future update
  const selectedActivitiesObj = useMemo(() => {
    if (!apiActivities || apiActivities.length === 0) {
      // Fallback to mock data if no API data available
      return activities.filter((a) => selectedActivities.includes(a.id.toString()));
    }
    // Use the actual API data when available
    return apiActivities.filter((a) => selectedActivities.includes(a.id.toString()));
  }, [selectedActivities, apiActivities]);

  // Find selected transport and hotel objects
  const selectedRoute = useMemo(() => {
    if (!selectedTransportRoute || !transportRoutes.length) return null;
    return transportRoutes.find((r) => r.id.toString() === selectedTransportRoute.toString());
  }, [selectedTransportRoute, transportRoutes])

  const selectedHotelObj = useMemo(() => {
    if (!selectedHotel || !hotels.length) return null;
    return hotels.find((h) => h.id.toString() === selectedHotel.toString());
  }, [selectedHotel, hotels])

  // Calculate nights using the custom hook
  const nights = useBookingNights()

  // Calculate total price
  const totalPrice = useMemo(() => {
    let total = 0
    
    // Add destination cost if available
    if (destination && destination.cost) {
      const destinationCost = parseFloat(destination.cost);
      if (!isNaN(destinationCost)) {
        total += destinationCost;
      }
    }
    
    // Add transport cost
    if (selectedRoute) {
      total += selectedRoute.cost ? parseFloat(selectedRoute.cost) : 0;
    }
    
    // Add hotel cost
    if (selectedHotelObj && nights > 0) {
      const hotelPrice = selectedHotelObj.base_price_per_night || selectedHotelObj.price || 0;
      total += parseFloat(hotelPrice) * nights;
    }
    
    // Add selected activities cost
    if (selectedActivitiesObj.length > 0) {
      selectedActivitiesObj.forEach((activity) => {
        total += activity.price ? parseFloat(activity.price) : 0;
      })
    }
    
    return total
  }, [destination, nights, selectedRoute, selectedHotelObj, selectedActivitiesObj])

  // Use useCallback for handlers that don't directly map to simple store actions
  const handleBooking = useCallback((e) => {
      e.preventDefault()
      if (!agreedToTerms) {
          setErrors({ terms: "You must agree to the terms and conditions" })
          return
      }
      setErrors({})
      setIsPaymentDialogOpen(true)
    }, [agreedToTerms, setIsPaymentDialogOpen, setErrors]
  )

  const processPayment = useCallback(() => {
    if (!paymentMethod) {
      return
    }

    console.log("Booking:", {
      destinationId,
      startDate,
      endDate,
      transportRouteId: selectedTransportRoute,
      hotelId: selectedHotel,
      activityIds: selectedActivities,
      paymentMethod,
    })

    alert(
      `Booking confirmed for ${destination?.name}. Payment processed via ${paymentMethod === "credit" ? "credit card" : paymentMethod === "savings" ? "savings account" : "crypto"}.`
    )
    setIsPaymentDialogOpen(false)
    resetBooking()
    router.push("/")
  }, [
    destination,
    destinationId,
    startDate,
    endDate,
    selectedTransportRoute,
    selectedHotel,
    selectedActivities,
    paymentMethod,
    router,
    setIsPaymentDialogOpen,
    resetBooking
  ])

  const formatDate = useCallback((dateString) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    } catch (error) {
        console.error("Error formatting date:", dateString, error);
        return "Invalid Date";
    }
  }, [])

  const getTransportIcon = useCallback((type) => {
    switch (type?.toLowerCase()) {
      case "bus":
        return <Bus className="h-5 w-5 text-blue-600" />
      case "air":
        return <Plane className="h-5 w-5 text-blue-600" />
      case "ferry":
        return <Ship className="h-5 w-5 text-blue-600" />
      default:
        return <Bus className="h-5 w-5 text-blue-600" />
    }
  }, [])

  // Show loading state while fetching destination
  if (isLoading.destination) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Smart Tour Destinations</p>
        </div>
      </div>
    )
  }

  // Show error state if destination fetch failed
  if (error.destination) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error loading destination: {error.destination}</AlertDescription>
        </Alert>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/locations")}>
          Back to Locations
        </Button>
      </div>
    );
  }

  // Show not found state if no destination data
  if (!destination) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Location not found. Please try another destination.</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/locations")}>
          Back to Locations
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Hero Image Section */}
      <div className="relative w-full h-[50vh] md:h-[60vh]">
        <Image 
          src={destination.image_url || "/placeholder.svg"} 
          alt={destination.name} 
          fill 
          className="object-cover" 
          priority 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6 md:p-12">
          <div className="max-w-6xl mx-auto w-full">
            <Badge
              variant="outline"
              className="bg-white/10 backdrop-blur-sm text-white mb-4 px-3 py-1 flex items-center gap-1 w-fit"
            >
              <MapPin className="h-4 w-4" /> {destination.region || 'Tanzania'}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{destination.name}</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl">{destination.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <Badge variant="secondary" className="text-lg bg-blue-600 text-white">
                ${(() => {
                  // Handle the cost display with proper parsing
                  if (destination.cost) {
                    const cost = parseFloat(destination.cost);
                    return !isNaN(cost) ? cost.toFixed(2) : 'Price varies';
                  }
                  return 'Price varies';
                })()} / visit
              </Badge>
              <div className="flex items-center gap-1 text-white">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{destination.rating || '4.5'}</span>
                <span className="text-white/70">({destination.reviews_count || '100+'})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Booking Progress */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Book Your Experience</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={resetBooking}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset booking</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Progress Bar Logic */}
          <div className="relative">
            <div className="flex justify-between md:gap-64 gap-6 mb-2 ">
              <div className="text-center w-full md:w-1/4">
                <span className={`text-sm ${step >= 1 ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                  Dates
                </span>
              </div>
              <div className="text-center w-full md:w-1/4">
                <span className={`text-sm ${step >= 2 ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                  Transport
                </span>
              </div>
              <div className="text-center w-full md:w-1/4">
                <span className={`text-sm ${step >= 3 ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                  Accommodations
                </span>
              </div>
              <div className="text-center w-full md:w-1/4">
                <span className={`text-sm ${step >= 4 ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                  Activities
                </span>
              </div>
            </div>

            <div className="flex items-center">
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center ${
                  step >= 1 ? "bg-blue-600 text-white" : "bg-blue-100 text-gray-500"
                }`}
              >
                1
              </div>
              <div className={`h-1 flex-grow ${step > 1 ? "bg-blue-600" : "bg-blue-100"}`}></div>
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center ${
                  step >= 2 ? "bg-blue-600 text-white" : "bg-blue-100 text-gray-500"
                }`}
              >
                2
              </div>
              <div className={`h-1 flex-grow ${step > 2 ? "bg-blue-600" : "bg-blue-100"}`}></div>
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center ${
                  step >= 3 ? "bg-blue-600 text-white" : "bg-blue-100 text-gray-500"
                }`}
              >
                3
              </div>
              <div className={`h-1 flex-grow ${step > 3 ? "bg-blue-600" : "bg-blue-100"}`}></div>
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center ${
                  step >= 4 ? "bg-blue-600 text-white" : "bg-blue-100 text-gray-500"
                }`}
              >
                4
              </div>
            </div>
          </div>
        </div>

        {/* Use handleBooking for the form submission */}
        <form onSubmit={handleBooking} className="space-y-8">
          {step === 1 && ( /* Step 1 Content */
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
                  <Calendar className="h-5 w-5 text-blue-600" /> Select Your Travel Dates
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <Label htmlFor="startDate" className="text-base mb-2 block">
                      Check-in Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`h-12 text-base ${errors.startDate ? "border-red-500" : ""}`}
                      min={new Date().toISOString().split("T")[0]} // Prevent past dates
                    />
                    {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-base mb-2 block">
                      Check-out Date
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`h-12 text-base ${errors.endDate ? "border-red-500" : ""}`}
                      min={startDate || new Date().toISOString().split("T")[0]} // Prevent dates before start date
                    />
                    {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                  </div>
                </div>

                {startDate && endDate && new Date(startDate) <= new Date(endDate) && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Duration of stay:</p>
                        <p className="text-lg font-semibold">
                          {nights} {nights === 1 ? "night" : "nights"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Base cost:</p>
                        <p className="text-lg font-semibold">
                          ${(() => {
                            if (destination.cost) {
                              const cost = parseFloat(destination.cost);
                              return !isNaN(cost) ? cost.toFixed(2) : '0.00';
                            }
                            return '0.00';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={nextStep} 
                  className="w-full md:w-auto text-white bg-blue-600 hover:bg-blue-700 h-12"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (  /* Step 2 Content */
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
                  <Bus className="h-5 w-5 text-blue-600" /> Select Transport Route
                </h3>

                <div className="space-y-8">
                  <div>
                    <Label htmlFor="transportRoute" className="text-base mb-2 block">
                      Transport Route
                    </Label>
                    
                    {/* Show loading state */}
                    {isLoading.transports ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                        <span className="ml-3 text-blue-600">Loading transport options...</span>
                      </div>
                    ) : error.transports ? (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {error.transports}. Please try refreshing the page.
                        </AlertDescription>
                      </Alert>
                    ) : transportRoutes.length === 0 ? (
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No transport options available for {destination.name}. Please check back later.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {transportRoutes.map((route) => (
                          <div
                            key={route.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              selectedTransportRoute === route.id.toString()
                                ? "border-blue-600 bg-blue-50"
                                : "hover:border-blue-300"
                            }`}
                            onClick={() => setSelectedTransportRoute(route.id.toString())}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                {getTransportIcon(route.transportation_type)}
                              </div>
                              <div>
                                {/* Use the travel agency name if available */}
                                <p className="font-medium">{route.agency_name || "Transport Provider"}</p>
                                <p className="text-sm text-gray-500 capitalize">{route.transportation_type || "Transport"}</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm">{route.origin}</span>
                                <ArrowRight className="h-4 w-4 mx-1" />
                                <span className="text-sm">{route.destination}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm text-gray-500">
                                {/* Use duration if available, otherwise just show the route */}
                                <span>{route.duration || `${route.origin} to ${route.destination}`}</span>
                                <Badge className="border border-blue-200">${route.cost}</Badge>
                              </div>
                              {/* Show schedule if available */}
                              {route.schedule && <p className="text-xs text-gray-500 mt-2">{route.schedule}</p>}
                              {/* Show description if available */}
                              {route.description && (
                                <p className="text-xs text-gray-500 mt-2">{route.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {errors.transportRoute && <p className="text-red-500 text-sm mt-1">{errors.transportRoute}</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button type="button" onClick={prevStep} variant="outline" className="h-12 px-8 border border-blue-200 hover:bg-blue-50">
                  Back
                </Button>
                <Button type="button" onClick={nextStep} className="h-12 px-8 text-white bg-blue-600 hover:bg-blue-700">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (  /* Step 3 Content */
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
                  <Hotel className="h-5 w-5 text-blue-600" /> Select Hotel
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hotel" className="text-base mb-2 block">
                      Hotel Choice
                    </Label>
                    
                    {/* Show loading state for hotels */}
                    {isLoading.hotels ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                        <span className="ml-3 text-blue-600">Loading hotels...</span>
                      </div>
                    ) : error.hotels ? (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {error.hotels}. Please try refreshing the page.
                        </AlertDescription>
                      </Alert>
                    ) : hotels.length === 0 ? (
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No hotels available at {destination.name}. Please check back later or contact customer service.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {hotels.map((hotel) => (
                          <Card
                            key={hotel.id}
                            className={`cursor-pointer overflow-hidden transition-all duration-200 ${
                              selectedHotel === hotel.id.toString()
                                ? "border-blue-600 ring-2 ring-blue-200"
                                : "hover:border-blue-300"
                            }`}
                            onClick={() => setSelectedHotel(hotel.id.toString())}
                          >
                            <CardContent className="p-0">
                              <div className="flex flex-col md:flex-row">
                                <div className="relative w-full md:w-1/3 h-48">
                                  {/* Adding console log to debug hotel image data format */}
                                  {console.log("Hotel image data:", hotel.images)}
                                  <Image
                                    src={(() => {
                                      try {
                                        // If images is a string (likely JSON), try to parse it
                                        if (hotel.images && typeof hotel.images === 'string') {
                                          const parsedImages = JSON.parse(hotel.images);
                                          if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                                            return parsedImages[0]; // Return first image URL
                                          }
                                        } 
                                        // If images is already parsed as an array
                                        else if (hotel.images && Array.isArray(hotel.images) && hotel.images.length > 0) {
                                          return hotel.images[0]; // Return first image URL
                                        }
                                      } catch (e) {
                                        console.error("Error parsing hotel images:", e);
                                      }
                                      
                                      // Fallback to placeholder if no valid image found
                                      return "/placeholder.svg";
                                    })()}
                                    alt={hotel.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="p-6 md:w-2/3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="text-xl font-semibold mb-1">{hotel.name}</h4>
                                      <div className="flex items-center text-gray-500 gap-1 mb-2">
                                        <MapPin className="h-4 w-4" />
                                        <span>{hotel.location}</span>
                                      </div>
                                      <div className="flex items-center gap-2 mb-3 text-sm">
                                        <Badge variant="outline" className="bg-blue-50 border-blue-200">
                                          <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                          {hotel.rating || "4.8"}
                                        </Badge>
                                        <Badge variant="outline" className="bg-green-50 border-green-200">
                                          Capacity: {hotel.capacity}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold">${hotel.base_price_per_night} <span className="text-sm text-gray-500 font-normal">/ night</span></div>
                                      <div className="text-sm text-gray-500">${hotel.base_price_per_night * nights} total for {nights} {nights === 1 ? "night" : "nights"}</div>
                                    </div>
                                  </div>
                                  <p className="text-gray-600 line-clamp-2 mt-2">{hotel.description}</p>
                                  <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center text-sm text-gray-500 gap-4">
                                      <div className="flex items-center">
                                        <Check className="h-4 w-4 text-green-500 mr-1" />
                                        Free WiFi
                                      </div>
                                      <div className="flex items-center">
                                        <Check className="h-4 w-4 text-green-500 mr-1" />
                                        Breakfast included
                                      </div>
                                    </div>
                                    {selectedHotel === hotel.id.toString() && (
                                      <div className="flex items-center gap-2 text-blue-600">
                                        <Check className="h-5 w-5" /> Selected
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                    
                    {errors.hotel && <p className="text-red-500 text-sm mt-1">{errors.hotel}</p>}
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  className="h-12 px-8 border border-blue-200 hover:bg-blue-50"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  className="h-12 px-8 text-white bg-blue-600 hover:bg-blue-700"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (  /* Step 4 - Activities Content */
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
                  <MapPin className="h-5 w-5 text-blue-600" /> Add Activities
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="activities" className="text-base mb-2 block">
                      Choose Activities for Your Trip
                    </Label>
                    
                    {/* Show loading state for activities */}
                    {isLoading.activities ? (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                        <span className="ml-3 text-blue-600">Loading activities...</span>
                      </div>
                    ) : error.activities ? (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {error.activities}. Please try refreshing the page.
                        </AlertDescription>
                      </Alert>
                    ) : apiActivities && apiActivities.length > 0 ? (
                      <>
                        <p className="text-sm text-gray-500 mb-4">
                          Enhance your stay in {destination.name} with these exciting activities. Select as many as you'd like.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {apiActivities.map((activity) => (
                            <div
                              key={activity.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                selectedActivities.includes(activity.id.toString())
                                  ? "border-blue-600 bg-blue-50"
                                  : "hover:border-blue-300"
                              }`}
                              onClick={() => toggleActivity(activity.id.toString())}
                            >
                              <div className="flex justify-between">
                                <div>
                                  <h4 className="font-medium text-lg">{activity.name}</h4>
                                  {activity.duration && (
                                    <div className="flex items-center text-gray-500 text-sm mt-1">
                                      <Clock className="h-3 w-3 mr-1" /> {activity.duration}
                                    </div>
                                  )}
                                </div>
                                <Badge className="border border-blue-200 bg-blue-50 text-blue-700">
                                  ${activity.price}
                                </Badge>
                              </div>
                              <p className="text-gray-600 text-sm mt-2 line-clamp-2">{activity.description}</p>
                              {selectedActivities.includes(activity.id.toString()) && (
                                <div className="flex items-center gap-1 text-blue-600 mt-2">
                                  <Check className="h-4 w-4" /> Selected
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No activities available for {destination.name}. You can still proceed with your booking.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {selectedActivities.length > 0 && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">Selected activities:</p>
                          <p className="text-lg font-semibold">
                            {selectedActivities.length} {selectedActivities.length === 1 ? "activity" : "activities"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  className="h-12 px-8 border border-blue-200 hover:bg-blue-50"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  className="h-12 px-8 text-white bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Review <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 5 && (  /* Step 5 Content - Review and Payment Page */
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Check className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold">Review and Confirm Your Booking</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Booking Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Destination Card */}
                  <Card className="border-0 shadow-md rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="h-9 w-9 rounded-full bg-blue-50 flex-shrink-0 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-lg">{destination.name}</h4>
                          <p className="text-sm text-gray-600">{destination.region || 'Tanzania'}</p>
                        </div>
                        <Badge className="ml-auto bg-blue-100 text-blue-800 border border-blue-200">
                          ${parseFloat(destination.cost || 0).toFixed(2)}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center mb-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium">Travel Dates</h4>
                            <p className="text-gray-600 text-sm">
                              {formatDate(startDate)} - {formatDate(endDate)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                          {nights} {nights === 1 ? "night" : "nights"}
                        </Badge>
                      </div>
                      
                      {selectedHotelObj && (
                        <div className="flex items-start gap-3 mb-4 pt-4 border-t">
                          <div className="h-9 w-9 rounded-full bg-blue-50 flex-shrink-0 flex items-center justify-center">
                            <Hotel className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-medium">{selectedHotelObj.name}</h4>
                                <p className="text-sm text-gray-500">
                                  <MapPin className="h-3 w-3 inline mr-1" /> {selectedHotelObj.location}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">${selectedHotelObj.base_price_per_night} <span className="text-xs text-gray-500">/ night</span></div>
                                <div className="text-sm text-blue-600 font-medium">${selectedHotelObj.base_price_per_night * nights} total</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {selectedRoute && (
                        <div className="flex items-start gap-3 mb-4 pt-4 border-t">
                          <div className="h-9 w-9 rounded-full bg-blue-50 flex-shrink-0 flex items-center justify-center">
                            {getTransportIcon(selectedRoute.transportation_type)}
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-medium">{selectedRoute.transportation_type || "Transport"}</h4>
                                <p className="text-sm text-gray-500">
                                  {selectedRoute.origin} to {selectedRoute.destination}
                                </p>
                                {selectedRoute.agency_name && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Provider: {selectedRoute.agency_name}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-blue-600">${selectedRoute.cost}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Activities Section */}
                  {selectedActivitiesObj.length > 0 && (
                    <Card className="border-0 shadow-md rounded-xl">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-blue-600" /> 
                          Selected Activities
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid gap-4">
                          {selectedActivitiesObj.map((activity) => (
                            <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                              <div className="h-9 w-9 rounded-full bg-green-50 flex-shrink-0 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="flex-grow">
                                <div className="flex justify-between">
                                  <div>
                                    <h4 className="font-medium">{activity.name}</h4>
                                    {activity.duration && (
                                      <p className="text-xs text-gray-500">Duration: {activity.duration}</p>
                                    )}
                                    {activity.description && (
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{activity.description}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <Badge className="bg-green-50 text-green-700 border border-green-200">
                                      ${activity.price}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column - Payment Summary */}
                <div className="lg:col-span-1">
                  <div className="sticky top-4">
                    <Card className="border-0 shadow-md rounded-xl">
                      <CardHeader className="pb-3 border-b">
                        <CardTitle>Price Details</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Destination Fee</span>
                            <span className="font-medium">
                              ${parseFloat(destination.cost || 0).toFixed(2)}
                            </span>
                          </div>

                          {selectedHotelObj && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Accommodation ({nights} {nights === 1 ? "night" : "nights"})</span>
                              <span className="font-medium">
                                ${(selectedHotelObj.base_price_per_night * nights).toFixed(2)}
                              </span>
                            </div>
                          )}

                          {selectedRoute && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Transport</span>
                              <span className="font-medium">
                                ${parseFloat(selectedRoute.cost).toFixed(2)}
                              </span>
                            </div>
                          )}

                          {selectedActivitiesObj.length > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Activities ({selectedActivitiesObj.length})</span>
                              <span className="font-medium">
                                ${selectedActivitiesObj.reduce((sum, act) => sum + parseFloat(act.price || 0), 0).toFixed(2)}
                              </span>
                            </div>
                          )}

                          <Separator className="my-3" />
                          
                          <div className="flex justify-between text-base font-bold">
                            <span>Total</span>
                            <span className="text-blue-700">${totalPrice.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="mt-6 space-y-4">
                          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                            <Checkbox
                              id="terms"
                              checked={agreedToTerms}
                              onCheckedChange={setAgreedToTerms}
                              className={`${errors.terms ? "border-red-500" : ""} h-5 w-5`}
                            />
                            <Label htmlFor="terms" className="text-sm">
                              I agree to the terms and conditions and cancellation policy
                            </Label>
                          </div>
                          {errors.terms && (
                            <p className="text-red-500 text-xs -mt-2 ml-2">{errors.terms}</p>
                          )}

                          <Button
                            type="submit"
                            className="w-full h-12 text-white bg-blue-600 hover:bg-blue-700 font-medium"
                            disabled={!agreedToTerms}
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Pay ${totalPrice.toFixed(2)}
                          </Button>
                          
                          <Button
                            type="button"
                            onClick={prevStep}
                            variant="outline"
                            className="w-full h-12 border-blue-200 hover:bg-blue-50 mt-2"
                          >
                            Go Back
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
            <DialogDescription>Choose how you want to pay for your booking.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="credit" onValueChange={setPaymentMethod}>
            <TabsList className="w-full mb-4 grid grid-cols-3">
              <TabsTrigger value="credit" className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" /> Credit Card
              </TabsTrigger>
              <TabsTrigger value="savings" className="flex-1">
                <Wallet className="h-4 w-4 mr-2" /> Savings
              </TabsTrigger>
              <TabsTrigger value="crypto" className="flex-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-4 w-4 mr-2 lucide lucide-bitcoin"
                >
                  <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m3.94.694-.347 1.97M7.116 5.137l-1.257-.221 1.437 8.148" />
                </svg>
                Crypto
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="credit" className="space-y-4">
              {/* Credit Card Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input id="cardNumber" type="text" placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input id="expiry" type="text" placeholder="MM/YY" />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" type="text" placeholder="123" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="nameOnCard">Name on Card</Label>
                  <Input id="nameOnCard" type="text" placeholder="John Doe" />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="savings" className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span>Available Balance:</span>
                  <span className="font-semibold">${savingsBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Required:</span>
                  <span className="font-semibold">${totalPrice.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center font-medium">
                  <span>Remaining Balance:</span>
                  <span
                    className={savingsBalance >= totalPrice ? "text-green-600" : "text-red-600"}
                  >
                    ${(savingsBalance - totalPrice).toFixed(2)}
                  </span>
                </div>
                {savingsBalance < totalPrice && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient funds in your savings account. Please choose another payment method or top up your
                      balance.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="crypto" className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span>Equivalent in ETH:</span>
                  <span className="font-semibold">{(totalPrice / 3500).toFixed(6)} ETH</span>
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="cryptoWallet">Your Wallet Address</Label>
                  <div className="mt-1 relative">
                    <Input 
                      id="cryptoWallet" 
                      type="text" 
                      placeholder="0x..." 
                      className="pr-20" 
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-1 top-1 h-7 text-xs text-blue-600"
                      onClick={() => {
                        if (window.ethereum) {
                          window.ethereum.request({ method: 'eth_requestAccounts' })
                            .then(accounts => {
                              document.getElementById('cryptoWallet').value = accounts[0];
                            })
                            .catch(error => {
                              console.error(error);
                            });
                        } else {
                          alert("MetaMask or another web3 wallet is required for crypto payments");
                        }
                      }}
                    >
                      Connect wallet
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Label className="mb-2 block">Select Cryptocurrency</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer bg-white hover:bg-blue-50 hover:border-blue-300">
                      <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none">
                        <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m3.94.694-.347 1.97M7.116 5.137l-1.257-.221 1.437 8.148" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div>
                        <p className="font-medium">Bitcoin</p>
                        <p className="text-xs text-gray-500">BTC</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-2 cursor-pointer bg-white hover:bg-blue-50 hover:border-blue-300">
                      <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L5.25 12.05L12 15.85V2ZM12 15.85L18.75 12.05L12 2V15.85Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 22L5.25 12.5L12 16.3V22ZM12 16.3L18.75 12.5L12 22V16.3Z" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div>
                        <p className="font-medium">Ethereum</p>
                        <p className="text-xs text-gray-500">ETH</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Alert className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-sm">
                    Crypto payment will connect to Smart Tour TZ blockchain vault. Current exchange rate applies at time of payment.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={processPayment}
              disabled={
                (paymentMethod === "savings" && savingsBalance < totalPrice) ||
                !paymentMethod
              }
            >
              Pay ${totalPrice.toFixed(2)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Wrap the component with RouteProtection to ensure only logged-in tourists can access
export default function ProtectedBookingPage({ params }) {
  return (
    <RouteProtection allowedRoles={["tourist"]}>
      <BookLocation params={params} />
    </RouteProtection>
  )
}