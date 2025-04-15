"use client"

import React from "react"
import { useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  Users,
  Star,
  Clock,
  ArrowRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import useBookingStore from "./bookingStore"
import { locations } from "@/app/locations/page"


const tourGuides = [
  { id: 1, name: "John Doe", expertise: "Wildlife", rating: 4.8, price: 50 },
  { id: 2, name: "Jane Smith", expertise: "History", rating: 4.9, price: 60 },
  { id: 3, name: "Mike Johnson", expertise: "Adventure", rating: 4.7, price: 55 },
]

const travelAgents = [
  { id: 1, name: "Safari Adventures", speciality: "Wildlife tours", rating: 4.6, price: 100 },
  { id: 2, name: "Zanzibar Getaways", speciality: "Beach holidays", rating: 4.8, price: 120 },
  { id: 3, name: "Mountain Expeditions", speciality: "Trekking tours", rating: 4.7, price: 110 },
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

export default function BookLocation({ params }) {
  const router = useRouter()
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params)
  const locationId = Number.parseInt(unwrappedParams.id, 10)

  // Zustand store for booking state
  const {
    step,
    startDate,
    endDate,
    selectedTourGuide,
    selectedTravelAgent,
    selectedHotel,
    selectedActivities,
    errors,
    agreedToTerms,
    setStep,
    setStartDate,
    setEndDate,
    setSelectedTourGuide,
    setSelectedTravelAgent,
    setSelectedHotel,
    setSelectedActivities,
    setErrors,
    setAgreedToTerms,
    nextStep,
    prevStep,
    resetBookingStore,
  } = useBookingStore();

  // Find the location based on the ID parameter
  const location = React.useMemo(() => {
    return locations.find((loc) => loc.id === locationId)
  }, [locationId])

  // Get selected objects - memoize to prevent unnecessary recalculations
  const selectedGuide = React.useMemo(() => {
    return tourGuides.find((g) => g.id.toString() === selectedTourGuide)
  }, [selectedTourGuide])

  const selectedAgent = React.useMemo(() => {
    return travelAgents.find((a) => a.id.toString() === selectedTravelAgent)
  }, [selectedTravelAgent])

  const selectedHotelObj = React.useMemo(() => {
    return hotels.find((h) => h.id.toString() === selectedHotel)
  }, [selectedHotel])


  // Calculate nights
  const nights = React.useMemo(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    }
    return 0
  }, [startDate, endDate])

  // Calculate total price
  const totalPrice = React.useMemo(() => {
    let total = 0

    // Location price per night
    if (location && nights > 0) {
      total += location.price * nights
    }

    // Tour guide price
    if (selectedGuide) {
      total += selectedGuide.price
    }

    // Travel agent price
    if (selectedAgent) {
      total += selectedAgent.price
    }

    // Hotel price per night
    if (selectedHotelObj && nights > 0) {
      total += selectedHotelObj.price * nights
    }

    // Activities price - ensure selectedActivities is an array
    if (Array.isArray(selectedActivities) && selectedActivities.length > 0) {
      selectedActivities.forEach((activityId) => {
        const activity = activities.find(a => a.id.toString() === activityId);
        if (activity) {
          total += activity.price;
        }
      });
    }

    return total
  }, [location, nights, selectedGuide, selectedAgent, selectedHotelObj, selectedActivities, activities]);

  const resetBooking = useCallback(() => {
    resetBookingStore();
  }, [resetBookingStore])

  const validateStep = useCallback(
    (currentStep) => {
      const newErrors = {};

      if (currentStep === 1) {
        if (!startDate) newErrors.startDate = "Start date is required"
        if (!endDate) newErrors.endDate = "End date is required"
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
          newErrors.endDate = "End date must be after start date"
        }
      } else if (currentStep === 2) {
        if (!selectedTourGuide) newErrors.tourGuide = "Please select a tour guide"
        if (!selectedTravelAgent) newErrors.travelAgent = "Please select a travel agent"
      } else if (currentStep === 3) {
        if (!selectedHotel) newErrors.hotel = "Please select a hotel"
      } else if (currentStep === 4) {
        if (!agreedToTerms) newErrors.terms = "You must agree to the terms and conditions"
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    },
    [startDate, endDate, selectedTourGuide, selectedTravelAgent, selectedHotel, agreedToTerms, setErrors],
  )

  const handleBooking = useCallback(
    (e) => {
      e.preventDefault()
      if (validateStep(4)) {
        // Proceed with booking confirmation
        console.log("Booking:", {
          locationId: location?.id,
          startDate,
          endDate,
          tourGuideId: selectedTourGuide,
          travelAgentId: selectedTravelAgent,
          hotelId: selectedHotel,
          activityIds: selectedActivities,
        })
        // Reset booking store after confirmation
        // resetBookingStore();
        toast.success("Booking confirmed!");
        // alert(`Booking confirmed for ${location?.name}`)
        // router.push("/locations")
      }
    },
    [
      validateStep,
      location,
      startDate,
      endDate,
      selectedTourGuide,
      selectedTravelAgent,
      selectedHotel,
      selectedActivities,
      router,
    ],
  )

  const handleActivityChange = useCallback((activityId, checked) => {
    setSelectedActivities((prev) => {
      const currentActivities = Array.isArray(prev) ? prev : [];
      if (checked) {
        return currentActivities.includes(activityId) ?
          currentActivities :
          [...currentActivities, activityId];
      }
      return currentActivities.filter(id => id !== activityId);
    });
  }, [setSelectedActivities])

  const formatDate = useCallback((dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
  }, [])

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

          <div className="relative">
            <div className="flex justify-between md:gap-64 gap-6 mb-2 ">
              <div className="text-center w-full md:w-1/4">
                <span className={`text-sm ${step >= 1 ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                  Dates
                </span>
              </div>
              <div className="text-center w-full md:w-1/4">
                <span className={`text-sm ${step >= 2 ? "text-blue-600 font-medium" : "text-gray-500"}`}>
                  Services
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
                  <Users className="h-5 w-5 text-blue-600" /> Select Tour Guide & Travel Agent
                </h3>

                <div className="space-y-8">
                  <div>
                    <Label htmlFor="tourGuide" className="text-base mb-2 block">
                      Tour Guide
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {tourGuides.map((guide) => (
                        <div
                          key={guide.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedTourGuide === guide.id.toString()
                              ? "bg-blue-100"
                              : "hover:border-blue-400"
                          }`}
                          onClick={() => setSelectedTourGuide(guide.id.toString())}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{guide.name}</p>
                              <p className="text-sm text-gray-500">{guide.expertise} Expert</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="ml-1 text-sm">{guide.rating}</span>
                            </div>
                            <Badge variant="outline">${guide.price}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.tourGuide && <p className="text-red-500 text-sm mt-1">{errors.tourGuide}</p>}
                  </div>

                  <div>
                    <Label htmlFor="travelAgent" className="text-base mb-2 block">
                      Travel Agent
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {travelAgents.map((agent) => (
                        <div
                          key={agent.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedTravelAgent === agent.id.toString()
                              ? "bg-blue-100"
                              : "hover:border-blue-400"
                          }`}
                          onClick={() => setSelectedTravelAgent(agent.id.toString())}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{agent.name}</p>
                              <p className="text-sm text-gray-500">{agent.speciality}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="ml-1 text-sm">{agent.rating}</span>
                            </div>
                            <Badge variant="outline">${agent.price}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.travelAgent && <p className="text-red-500 text-sm mt-1">{errors.travelAgent}</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button type="button" onClick={prevStep} variant="outline" className="h-12 px-8 hover:bg-blue-100">
                  Back
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    const success = nextStep()
                    if (!success) {
                      toast.error("Please select both a tour guide and travel agent")
                    }
                  }} 
                  className="h-12 px-12 text-white bg-blue-600 hover:bg-blue-700"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && ( /* Step 3 Content - No changes */
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
                  <Hotel className="h-5 w-5 text-blue-600" /> Select Hotel & Activities
                </h3>

                <div className="space-y-8">
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
                              ? "bg-blue-100"
                              : "hover:border-blue-400"
                          }`}
                          onClick={() => setSelectedHotel(hotel.id.toString())}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
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
                                <Badge key={index} className="text-xs bg-blue-50">
                                  {amenity}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex justify-end">
                              <Badge variant="outline" className="bg-blue-50">${hotel.price}/night</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.hotel && <p className="text-red-500 text-sm mt-1">{errors.hotel}</p>}
                  </div>

                  <div>
                    <Label className="text-base mb-2 block">Activities (Optional)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activities.map((activity) => {
                        const isSelected = selectedActivities.includes(activity.id.toString())
                        return (
                          <div
                            key={activity.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              isSelected ? "bg-blue-100" : "hover:border-blue-400"
                            }`}
                          >
                            <div className="flex items-start">
                              <Checkbox
                                id={`activity-${activity.id}`}
                                checked={isSelected}
                                className="mt-1"
                                onCheckedChange={(checked) => handleActivityChange(activity.id.toString(), checked)}
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex justify-between">
                                  <label
                                    htmlFor={`activity-${activity.id}`}
                                    className="font-medium cursor-pointer"
                                    onClick={() => handleActivityChange(activity.id.toString(), !isSelected)}
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
                <Button type="button" onClick={prevStep} variant="outline" className="h-12 px-8 hover:bg-blue-100">
                  Back
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    const success = nextStep()
                    if (!success) {
                      toast.error("Please select a hotel")
                    }
                  }} 
                  className="h-12 px-8 text-white bg-blue-600 hover:bg-blue-700"
                >
                  Review Booking <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 4 && ( 
            <div className="space-y-8">
              <div>
                {/* Review Booking Header*/}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" /> Review Your Booking
                  </h3>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    Booking #
                    {Math.floor(Math.random() * 10000)
                      .toString()
                      .padStart(4, "0")}
                  </Badge>
                </div>

                {/* Review Booking Details*/}
                <div className="bg-blue-50 rounded-lg border border-blue-100 p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6"> 
                      <div>
                        <h4 className="text-sm text-gray-500 mb-1">Destination</h4>
                        <p className="text-lg font-medium">{location.name}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm text-gray-500 mb-1">Check-in</h4>
                          <p className="font-medium">{formatDate(startDate)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm text-gray-500 mb-1">Check-out</h4>
                          <p className="font-medium">{formatDate(endDate)}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm text-gray-500 mb-1">Duration</h4>
                        <p className="font-medium">
                          {nights} {nights === 1 ? "night" : "nights"}
                        </p>
                      </div>

                      {selectedGuide && (
                        <div>
                          <h4 className="text-sm text-gray-500 mb-1">Tour Guide</h4>
                          <p className="font-medium">
                            {selectedGuide.name} ({selectedGuide.expertise})
                          </p>
                        </div>
                      )}

                      {selectedAgent && (
                        <div>
                          <h4 className="text-sm text-gray-500 mb-1">Travel Agent</h4>
                          <p className="font-medium">
                            {selectedAgent.name} ({selectedAgent.speciality})
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6"> {/* Hotel and Activities in Review */}
                      {selectedHotelObj && (
                        <div>
                          <h4 className="text-sm text-gray-500 mb-1">Hotel</h4>
                          <p className="font-medium">
                            {selectedHotelObj.name} {Array(selectedHotelObj.stars).fill("★").join("")}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedHotelObj.amenities.map((amenity, index) => (
                              <Badge key={index} className="bg-blue-100 text-xs">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Activities Section - Direct Calculation of selectedActivitiesObj */}
                      {(() => {
                        const selectedActivitiesObj = Array.isArray(selectedActivities)
                          ? activities.filter((a) => selectedActivities.includes(a.id.toString()))
                          : [];

                        if (selectedActivitiesObj.length > 0) {
                          return (
                            <div>
                              <h4 className="text-sm text-gray-500 mb-1">Activities</h4>
                              <ul className="space-y-2">
                                {selectedActivitiesObj.map((activity) => (
                                  <li key={activity.id} className="flex justify-between">
                                    <span>{activity.name}</span>
                                    <span className="text-sm text-gray-500">{activity.duration}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Price Breakdown - No changes */}
                <div className="bg-white rounded-lg border p-6">
                  <h4 className="font-semibold text-lg mb-4">Price Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {location.name} ({nights} {nights === 1 ? "night" : "nights"})
                      </span>
                      <span>${location.price * nights}</span>
                    </div>

                    {selectedHotelObj && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          {selectedHotelObj.name} ({nights} {nights === 1 ? "night" : "nights"})
                        </span>
                        <span>${selectedHotelObj.price * nights}</span>
                      </div>
                    )}

                    {selectedGuide && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tour Guide: {selectedGuide.name}</span>
                        <span>${selectedGuide.price}</span>
                      </div>
                    )}

                    {selectedAgent && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Travel Agent: {selectedAgent.name}</span>
                        <span>${selectedAgent.price}</span>
                      </div>
                    )}

                    {/* Activities Price Breakdown - Direct Calculation - No changes needed here, already using selectedActivitiesObj calculated above */}
                    {(() => {
                      const selectedActivitiesObj = Array.isArray(selectedActivities)
                        ? activities.filter((a) => selectedActivities.includes(a.id.toString()))
                        : [];
                      if (selectedActivitiesObj.length > 0) {
                        return (
                          <>
                            <div className="flex justify-between font-medium pt-2">
                              <span>Activities</span>
                              <span></span>
                            </div>
                            {selectedActivitiesObj.map((activity) => (
                              <div key={activity.id} className="flex justify-between pl-4">
                                <span className="text-gray-500">{activity.name}</span>
                                <span>${activity.price}</span>
                              </div>
                            ))}
                          </>
                        );
                      }
                      return null;
                    })()}


                    <Separator className="my-2" />

                    <div className="flex justify-between font-bold text-lg pt-2">
                      <span>Total</span>
                      <span className="text-blue-600">${totalPrice}</span>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions Card - No changes */}
                <Card className="border-gray-200 my-5">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-3 mb-6">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
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
                        <p className="text-sm text-gray-500">
                          By checking this box, you agree to our{" "}
                          <a href="#" className="text-blue-600 hover:underline">
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a href="#" className="text-blue-600 hover:underline">
                            Privacy Policy
                          </a>
                          .
                        </p>
                        {errors.terms && <p className="text-red-500 text-sm">{errors.terms}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Buttons - No changes */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <Button type="button" onClick={prevStep} variant="outline" className="h-12 px-8 hover:bg-blue-100">
                    Back
                  </Button>
                  <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700 h-12 text-base px-8">
                    <CreditCard className="mr-2 h-4 w-4" /> Confirm and Pay ${totalPrice}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}