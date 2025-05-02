"use client"

import React, { useMemo, useCallback } from "react" // Keep useMemo/useCallback for non-state logic
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
import { useBookingStore, useBookingNights } from "./bookingStore" // Adjust path as needed

// --- Mock Data (Keep as is) ---
const locations = [
  {
    id: 1,
    name: "Serengeti National Park",
    description: "Experience the incredible wildlife of Tanzania in this world-famous national park.",
    image: "/placeholder.svg?height=600&width=1200",
    price: 500,
  },
  {
    id: 2,
    name: "Zanzibar Beaches",
    description: "Relax on the pristine white sand beaches of Zanzibar with crystal clear waters.",
    image: "/placeholder.svg?height=600&width=1200",
    price: 400,
  },
  {
    id: 3,
    name: "Mount Kilimanjaro",
    description: 'Climb Africa\'s highest peak and witness breathtaking views from the "Roof of Africa".',
    image: "/placeholder.svg?height=600&width=1200",
    price: 600,
  },
  {
    id: 4,
    name: "Ngorongoro Conservation Area",
    description: "Explore the unique ecosystem of this UNESCO World Heritage site, home to diverse wildlife.",
    image: "/placeholder.svg?height=600&width=1200",
    price: 450,
  },
  {
    id: 5,
    name: "Stone Town, Zanzibar",
    description: "Wander through the historic streets of Stone Town and discover its rich cultural heritage.",
    image: "/placeholder.svg?height=600&width=1200",
    price: 350,
  },
]


const transportRoutes = [
  {
    id: 1,
    origin: "Dar es Salaam",
    destination: "Zanzibar",
    type: "ferry",
    agency: "Zanzibar Fast Ferries",
    price: 50,
    duration: "2 hours",
    schedule: "Daily, 7:00 AM and 3:30 PM",
  },
  {
    id: 2,
    origin: "Arusha",
    destination: "Serengeti",
    type: "bus",
    agency: "Safari Express",
    price: 80,
    duration: "5 hours",
    schedule: "Mon, Wed, Fri - 8:00 AM",
  },
  {
    id: 3,
    origin: "Nairobi",
    destination: "Arusha",
    type: "air",
    agency: "East African Airways",
    price: 150,
    duration: "1 hour",
    schedule: "Daily, 10:00 AM",
  },
]

const hotels = [
  { id: 1, name: "Serengeti Luxury Lodge", stars: 5, price: 200, amenities: ["Pool", "Spa", "Restaurant"] },
  { id: 2, name: "Zanzibar Beach Resort", stars: 4, price: 150, amenities: ["Beach Access", "Restaurant", "Bar"] },
  { id: 3, name: "Kilimanjaro View Hotel", stars: 3, price: 100, amenities: ["Restaurant", "Wi-Fi", "Parking"] },
]

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
// --- End Mock Data ---

export default function BookLocation({ params }) {
  const { id } = React.use(params) // Unwrap the params Promise
  const locationId = Number.parseInt(id, 10)

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
    nextStep, // Use the action from the store which includes validation
    prevStep,
    setErrors, // Get setErrors for handleBooking validation
  } = useBookingStore()

  // Find the location based on the ID parameter (using useMemo for efficiency)
  const location = useMemo(() => {
    return locations.find((loc) => loc.id === locationId)
  }, [locationId])

  // Get selected objects - memoize to prevent unnecessary recalculations
  const selectedRoute = useMemo(() => {
    return transportRoutes.find((r) => r.id.toString() === selectedTransportRoute)
  }, [selectedTransportRoute])

  const selectedHotelObj = useMemo(() => {
    return hotels.find((h) => h.id.toString() === selectedHotel)
  }, [selectedHotel])

  const selectedActivitiesObj = useMemo(() => {
    return activities.filter((a) => selectedActivities.includes(a.id.toString()))
  }, [selectedActivities])

  // Calculate nights using the custom hook or recalculate here
  const nights = useBookingNights()
  // Or: const nights = useMemo(() => calculateNights(startDate, endDate), [startDate, endDate]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    let total = 0
    if (location && nights > 0) {
      total += location.price * nights
    }
    if (selectedRoute) {
      total += selectedRoute.price
    }
    if (selectedHotelObj && nights > 0) {
      total += selectedHotelObj.price * nights
    }
    if (selectedActivitiesObj.length > 0) {
      selectedActivitiesObj.forEach((activity) => {
        total += activity.price
      })
    }
    return total
  }, [location, nights, selectedRoute, selectedHotelObj, selectedActivitiesObj])

  // Use useCallback for handlers that don't directly map to simple store actions
  const handleBooking = useCallback((e) => {
      e.preventDefault()
      // Final validation check before opening payment dialog
      if (!agreedToTerms) {
          setErrors({ terms: "You must agree to the terms and conditions" })
          return
      }
      setErrors({}) // Clear any previous errors
      setIsPaymentDialogOpen(true)
    }, [agreedToTerms, setIsPaymentDialogOpen, setErrors] // Include dependencies
  )

  const processPayment = useCallback(() => {
    if (!paymentMethod) {
      return // Should ideally show an error message
    }

    console.log("Booking:", {
      locationId: location?.id,
      startDate,
      endDate,
      transportRouteId: selectedTransportRoute,
      hotelId: selectedHotel,
      activityIds: selectedActivities,
      paymentMethod,
    })

    alert(
      `Booking confirmed for ${location?.name}. Payment processed via ${paymentMethod === "credit" ? "credit card" : "savings account"}.`,
    )
    setIsPaymentDialogOpen(false)
    resetBooking() // Reset the form/state after successful booking
    router.push("/")
  }, [
    location,
    startDate,
    endDate,
    selectedTransportRoute,
    selectedHotel,
    selectedActivities,
    paymentMethod,
    router,
    setIsPaymentDialogOpen,
    resetBooking // Make sure to include store actions used inside
  ])

  // Use useCallback for stable function references if passed down or complex
  const formatDate = useCallback((dateString) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
       // Add check for invalid date
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    } catch (error) {
        console.error("Error formatting date:", dateString, error);
        return "Invalid Date";
    }
  }, [])

  const getTransportIcon = useCallback((type) => {
    switch (type) {
      case "bus":
        return <Bus className="h-5 w-5 text-blue-600" />
      case "air":
        return <Plane className="h-5 w-5 text-blue-600" />
      case "ferry":
        return <Ship className="h-5 w-5 text-blue-600" />
      default:
        return <Bus className="h-5 w-5 text-blue-600" /> // Default icon
    }
  }, [])

  // --- Render Logic (Mostly Unchanged, just uses state/actions from store) ---

  if (!location) {
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
    )
  }

  return (
    <div className="w-full">
      {/* Hero Image Section */}
      <div className="relative w-full h-[50vh] md:h-[60vh]">
        <Image src={location.image || "/placeholder.svg"} alt={location.name} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6 md:p-12">
          <div className="max-w-6xl mx-auto w-full">
            <Badge
              variant="outline"
              className="bg-white/10 backdrop-blur-sm text-white mb-4 px-3 py-1 flex items-center gap-1 w-fit"
            >
              <MapPin className="h-4 w-4" /> {location.name.split(",")[0]}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{location.name}</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl">{location.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <Badge variant="secondary" className="text-lg bg-blue-600 text-white">
                ${location.price} / night
              </Badge>
              <div className="flex items-center gap-1 text-white">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">4.9</span>
                <span className="text-white/70">(128 reviews)</span>
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
                  {/* Use resetBooking from store */}
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
                  Review
                </span>
              </div>
            </div>

            <div className="flex items-center">
               {/* Progress Steps Logic (remains the same, depends on 'step' from store) */}
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
                      // Use setStartDate from store
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
                       // Use setEndDate from store
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
                        <p className="font-medium">Base price:</p>
                        {/* Calculate location base price */}
                        <p className="text-lg font-semibold">${location.price * nights}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={() => {
                    const success = nextStep()
                    if (!success) {
                      toast.error("Please fill in all required fields")
                    }
                  }} 
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {transportRoutes.map((route) => (
                        <div
                          key={route.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedTransportRoute === route.id.toString()
                              ? "border-blue-600 bg-blue-50"
                              : "hover:border-blue-300"
                          }`}
                          // Use setSelectedTransportRoute from store
                          onClick={() => setSelectedTransportRoute(route.id.toString())}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              {getTransportIcon(route.type)}
                            </div>
                            <div>
                              <p className="font-medium">{route.agency}</p>
                              <p className="text-sm text-gray-500 capitalize">{route.type}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm">{route.origin}</span>
                              <ArrowRight className="h-4 w-4 mx-1" />
                              <span className="text-sm">{route.destination}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500">
                              <span>{route.duration}</span>
                              <Badge className="border border-blue-200">${route.price}</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{route.schedule}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                     {/* Display errors from store */}
                    {errors.transportRoute && <p className="text-red-500 text-sm mt-1">{errors.transportRoute}</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                 {/* Use prevStep from store */}
                <Button type="button" onClick={prevStep} variant="outline" className="h-12 px-8 border border-blue-200 hover:bg-blue-50">
                  Back
                </Button>
                 {/* Use nextStep from store */}
                <Button type="button" onClick={nextStep} className="h-12 px-8 text-white bg-blue-600 hover:bg-blue-700">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Hotel & Activities */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
                  <Hotel className="h-5 w-5 text-blue-600" /> Select Hotel & Activities
                </h3>

                <div className="space-y-8">
                  {/* Hotel Selection */}
                  <div>
                    <Label htmlFor="hotel" className="text-base mb-2 block">
                      Hotel
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {hotels.map((hotel) => (
                        <div
                          key={hotel.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedHotel === hotel.id.toString()
                              ? "border-blue-600 bg-blue-50"
                              : "hover:border-blue-300"
                          }`}
                           // Use setSelectedHotel from store
                          onClick={() => setSelectedHotel(hotel.id.toString())}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Hotel className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{hotel.name}</p>
                              <p className="text-sm text-yellow-500">{Array(hotel.stars).fill("★").join("")}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {hotel.amenities.map((amenity, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex justify-end">
                              <Badge variant="outline">${hotel.price}/night</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                     {/* Display errors from store */}
                    {errors.hotel && <p className="text-red-500 text-sm mt-1">{errors.hotel}</p>}
                  </div>

                  {/* Activity Selection */}
                  <div>
                    <Label className="text-base mb-2 block">Activities</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activities.map((activity) => {
                        // Check if selected from store state
                        const isSelected = selectedActivities.includes(activity.id.toString())
                        return (
                          <div
                            key={activity.id}
                            className={`p-4 border rounded-lg transition-all ${ 
                              isSelected ? "border-blue-600 bg-blue-50" : "hover:border-blue-100"
                            }`}
                          >
                            <div className="flex items-start">
                              <Checkbox
                                id={`activity-${activity.id}`}
                                checked={isSelected}
                                className="mt-1"
                                // Use toggleActivity from store
                                onCheckedChange={() => toggleActivity(activity.id.toString())}
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex justify-between">
                                  {/* Label click toggles the checkbox */}
                                  <label
                                    htmlFor={`activity-${activity.id}`}
                                    className="font-medium cursor-pointer"
                                  >
                                    {activity.name}
                                  </label>
                                  <Badge variant="outline">${activity.price}</Badge>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                                <div className="flex items-center mt-2 text-sm text-gray-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {activity.duration}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                {/* Use prevStep from store */}
                <Button type="button" onClick={prevStep} variant="outline" className="h-12 px-8 border border-blue-100 hover:bg-blue-50">
                  Back
                </Button>
                {/* Use nextStep from store */}
                <Button type="button" onClick={nextStep} className="h-12 px-8 text-white bg-blue-600 hover:bg-blue-700">
                  Review Booking <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Check className="h-5 w-5 text-blue-600" /> Review Your Booking
                  </h3>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    Booking #
                    {Math.floor(Math.random() * 10000)
                      .toString()
                      .padStart(4, "0")}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left column - Booking details */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Booking Details Card */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Booking Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Destination</h4>
                            <p className="font-medium">{location.name}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                            <p className="font-medium">
                              {nights} {nights === 1 ? "night" : "nights"}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Check-in</h4>
                            {/* Use formatDate helper */}
                            <p className="font-medium">{formatDate(startDate)}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Check-out</h4>
                            {/* Use formatDate helper */}
                            <p className="font-medium">{formatDate(endDate)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Transport Card */}
                    {selectedRoute && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Transport</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              {getTransportIcon(selectedRoute.type)}
                            </div>
                            <div>
                              <p className="font-medium">{selectedRoute.agency}</p>
                              <p className="text-sm text-gray-500 capitalize">{selectedRoute.type}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Route</h4>
                              <p className="font-medium">
                                {selectedRoute.origin} → {selectedRoute.destination}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                              <p className="font-medium">{selectedRoute.duration}</p>
                            </div>
                            <div className="col-span-2">
                              <h4 className="text-sm font-medium text-gray-500">Schedule</h4>
                              <p className="font-medium">{selectedRoute.schedule}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Accommodation Card */}
                    {selectedHotelObj && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Accommodation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Hotel className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{selectedHotelObj.name}</p>
                              <p className="text-sm text-yellow-500">
                                {Array(selectedHotelObj.stars).fill("★").join("")}
                              </p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Amenities</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedHotelObj.amenities.map((amenity, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Activities Card */}
                    {selectedActivitiesObj.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Activities</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {selectedActivitiesObj.map((activity) => (
                              <div
                                key={activity.id}
                                className="flex justify-between items-start pb-2 border-b last:border-0 last:pb-0"
                              >
                                <div>
                                  <p className="font-medium">{activity.name}</p>
                                  <p className="text-sm text-gray-500">{activity.description}</p>
                                  <div className="flex items-center mt-1 text-sm text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {activity.duration}
                                  </div>
                                </div>
                                <Badge variant="outline">${activity.price}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Right column - Price summary */}
                  <div>
                    <Card className="sticky top-4">
                      <CardHeader>
                        <CardTitle>Price Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          {/* Location Price */}
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              {location.name} ({nights} {nights === 1 ? "night" : "nights"})
                            </span>
                            <span>${location.price * nights}</span>
                          </div>

                          {/* Hotel Price */}
                          {selectedHotelObj && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                {selectedHotelObj.name} ({nights} {nights === 1 ? "night" : "nights"})
                              </span>
                              <span>${selectedHotelObj.price * nights}</span>
                            </div>
                          )}

                          {/* Transport Price */}
                          {selectedRoute && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Transport: {selectedRoute.origin} to {selectedRoute.destination}
                              </span>
                              <span>${selectedRoute.price}</span>
                            </div>
                          )}

                           {/* Activities Price */}
                          {selectedActivitiesObj.length > 0 && (
                            <>
                              <div className="flex justify-between font-medium pt-2">
                                <span>Activities</span>
                                <span></span> {/* Placeholder for alignment */}
                              </div>
                              {selectedActivitiesObj.map((activity) => (
                                <div key={activity.id} className="flex justify-between pl-4">
                                  <span className="text-gray-500">{activity.name}</span>
                                  <span>${activity.price}</span>
                                </div>
                              ))}
                            </>
                          )}
                        </div>

                        <Separator />

                         {/* Total Price */}
                        <div className="flex justify-between font-bold text-lg pt-2">
                          <span>Total</span>
                           {/* Use calculated totalPrice */}
                          <span className="text-blue-600">${totalPrice}</span>
                        </div>

                        <div className="text-sm text-gray-500">
                          * Tour guide will be assigned by the administrator after booking confirmation
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col space-y-2">
                        <Button type="submit" className="w-full text-white bg-blue-600 hover:bg-blue-700" disabled={!agreedToTerms}>
                          Confirm and Pay
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Terms Agreement Card */}
              <Card className="border-blue-100">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3 mb-6">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                       // Use setAgreedToTerms from store
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the terms and conditions
                      </label>
                      <p className="text-sm text-muted-foreground">
                        By checking this box, you agree to our{" "}
                        <a href="#" className="text-primary hover:underline">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-primary hover:underline">
                          Privacy Policy
                        </a>
                        .
                      </p>
                      {/* Display errors from store */}
                      {errors.terms && <p className="text-red-500 text-sm">{errors.terms}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                 {/* Use prevStep from store */}
                <Button type="button" onClick={prevStep} variant="outline" className="h-12 px-8">
                  Back
                </Button>
                 {/* The "Confirm and Pay" button is now part of the Price Summary card and triggers form submission */}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Payment Method Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
            <DialogDescription>Choose how you would like to pay for your booking.</DialogDescription>
          </DialogHeader>

          {/* Payment Tabs */}
          <Tabs defaultValue="credit" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credit">
                <CreditCard className="h-4 w-4 mr-2" />
                Credit Card
              </TabsTrigger>
              <TabsTrigger value="savings">
                <Wallet className="h-4 w-4 mr-2" />
                Savings
              </TabsTrigger>
            </TabsList>

            {/* Credit Card Tab */}
            <TabsContent value="credit" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input id="expiry" placeholder="MM/YY" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input id="cvc" placeholder="123" />
                </div>
              </div>
              <Button
                className="w-full text-white bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  // Set payment method in store and process
                  setPaymentMethod("credit")
                  processPayment()
                }}
              >
                 {/* Display total price */}
                Pay ${totalPrice}
              </Button>
            </TabsContent>

            {/* Savings Tab */}
            <TabsContent value="savings" className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Available Balance:</span>
                   {/* Display savings balance from store */}
                  <span className="font-bold">${savingsBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Cost:</span>
                   {/* Display total price */}
                  <span className="font-bold">${totalPrice.toFixed(2)}</span>
                </div>

                {/* Balance Check */}
                {savingsBalance < totalPrice ? (
                  <Alert className="mt-4" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient funds in your savings account. Please add more funds or use a credit card.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="mt-4" variant="default">
                    <Check className="h-4 w-4" />
                    <AlertDescription>You have sufficient funds to complete this booking.</AlertDescription>
                  </Alert>
                )}
              </div>

              <Button
                className="w-full text-white bg-blue-600 hover:bg-blue-700"
                disabled={savingsBalance < totalPrice}
                onClick={() => {
                  // Set payment method in store and process
                  setPaymentMethod("savings")
                  processPayment()
                }}
              >
                Pay with Savings
              </Button>
            </TabsContent>
          </Tabs>

          {/* Dialog Footer */}
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            {/* Close dialog using store action */}
            <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}