"use client";

import React, { useMemo, useCallback, useEffect, use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Calendar,
  Check,
  CreditCard,
  Hotel,
  MapPin,
  RefreshCw,
  Clock,
  ArrowRight,
  Bus,
  Wallet,
  Loader2,
  ShoppingCart,
  PiggyBank,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import the Zustand store and selectors/actions
import { useBookingStore, useBookingNights } from "./bookingStore";
// Import cart store
import { useCartStore } from "../../store/cartStore";
// Import savings store for wallet functionality
import { useSavingsStore } from "../../savings/savingStore";
// Import RouteProtection component
import { RouteProtection } from "@/components/route-protection";
// Import shared utilities
import { formatBookingDate } from "@/app/utils/dateUtils";
import { TransportIcon } from "@/app/components/shared/TransportIcon";

import { formatTZS } from "@/app/utils/currency";
import { toast } from "sonner";
import { bookingCreationService } from "@/app/services/api";

function BookLocation({ params }) {
  const { id } = use(params);
  const destinationId = parseInt(id, 10);

  const router = useRouter();

  // Get cart store actions
  const { addToCart } = useCartStore();

  // Get savings store (simplified)
  const { balance, fetchBalance } = useSavingsStore();

  // Get state and actions from Zustand store
  const {
    step,
    startDate,
    endDate,
    selectedOrigin,
    selectedTransportRoute,
    selectedHotel,
    selectedActivities,
    activitySessions,
    skipOptions,
    errors,
    agreedToTerms,
    paymentMethod,
    isPaymentDialogOpen,
    setStartDate,
    setEndDate,
    setSelectedOrigin,
    setSelectedTransportRoute,
    setSelectedHotel,
    toggleActivity,
    setActivitySessions,
    setSkipOption,
    setAgreedToTerms,
    setPaymentMethod,
    setIsPaymentDialogOpen,
    resetBooking,
    nextStep,
    prevStep,
    setErrors,
    createBooking,

    // API-related state and actions
    destination,
    transportOrigins,
    transportRoutes,
    hotels,
    activities: apiActivities,
    isLoading,
    error,
    fetchDestination,
    fetchTransportOrigins,
    fetchTransportRoutes,
    fetchHotels,
    fetchActivities,
  } = useBookingStore();

  // Error-wrapped navigation functions with toast notifications
  const handleNextStep = useCallback(async () => {
    try {
      const success = nextStep();
      if (!success) {
        // Error handling is already done in the store with toast notifications
        return;
      }
    } catch (error) {
      console.error("Error in handleNextStep:", error);
      toast.error("Navigation Error", {
        description:
          "An unexpected error occurred while proceeding to the next step.",
      });
    }
  }, [nextStep]);

  const handlePrevStep = useCallback(async () => {
    try {
      prevStep();
    } catch (error) {
      console.error("Error in handlePrevStep:", error);
      toast.error("Navigation Error", {
        description: "An unexpected error occurred while going back.",
      });
    }
  }, [prevStep]);

  // Fetch destination data when component mounts
  useEffect(() => {
    if (destinationId) {
      fetchDestination(destinationId);
    }
    // Fetch transport origins for origin selection
    fetchTransportOrigins();
    // Fetch user's savings balance
    fetchBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationId]);

  // Fetch related data when destination is loaded
  useEffect(() => {
    if (destination) {
      // Fetch hotels at this destination using destination ID for exact matching
      fetchHotels(destination.id);

      // Fetch activities for this destination
      fetchActivities(destinationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination]);

  // Fetch transport routes when origin is selected and destination is available
  useEffect(() => {
    if (selectedOrigin && destination) {
      fetchTransportRoutes(selectedOrigin, destination.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrigin, destination]);

  // For now, still using mock activities data - will be replaced in a future update
  const selectedActivitiesObj = useMemo(() => {
    // Use the actual API data when available, with proper null checks
    if (!apiActivities || !Array.isArray(apiActivities)) {
      return [];
    }
    return apiActivities.filter((a) =>
      selectedActivities.includes(a.id.toString()),
    );
  }, [selectedActivities, apiActivities]);

  // Find selected transport and hotel objects
  const selectedRoute = useMemo(() => {
    if (
      !selectedTransportRoute ||
      !transportRoutes ||
      !Array.isArray(transportRoutes) ||
      !transportRoutes.length
    )
      return null;
    return transportRoutes.find(
      (r) => r.id.toString() === selectedTransportRoute.toString(),
    );
  }, [selectedTransportRoute, transportRoutes]);

  const selectedHotelObj = useMemo(() => {
    if (!selectedHotel || !hotels || !Array.isArray(hotels) || !hotels.length)
      return null;
    return hotels.find((h) => h.id.toString() === selectedHotel.toString());
  }, [selectedHotel, hotels]);

  // Calculate nights using the custom hook
  const nights = useBookingNights();

  // Calculate total price accounting for skipped services
  const totalPrice = useMemo(() => {
    let total = 0;

    // Add transport cost only if not skipped
    if (!skipOptions.skipTransport && selectedRoute) {
      total += selectedRoute.cost ? parseFloat(selectedRoute.cost) : 0;
    }

    // Add hotel cost only if not skipped
    if (!skipOptions.skipHotel && selectedHotelObj && nights > 0) {
      const hotelPrice =
        selectedHotelObj.base_price_per_night || selectedHotelObj.price || 0;
      total += parseFloat(hotelPrice) * nights;
    }

    // Add selected activities cost only if not skipped, multiplied by sessions
    if (!skipOptions.skipActivities && selectedActivitiesObj.length > 0) {
      selectedActivitiesObj.forEach((activity) => {
        const activityPrice = activity.price ? parseFloat(activity.price) : 0;
        const sessions = activitySessions[activity.id] || 1;
        total += activityPrice * sessions;
      });
    }

    return total;
  }, [
    nights,
    selectedRoute,
    selectedHotelObj,
    selectedActivitiesObj,
    activitySessions,
    skipOptions,
  ]);

  // Calculate discounted price for savings payments (5% discount)
  const discountedPrice = useMemo(() => {
    return totalPrice * 0.95; // 5% discount
  }, [totalPrice]);

  const savingsDiscount = useMemo(() => {
    return totalPrice * 0.05; // 5% discount amount
  }, [totalPrice]);

  // Use useCallback for handlers that don't directly map to simple store actions
  const handleBooking = useCallback(
    (e) => {
      e.preventDefault();
      if (!agreedToTerms) {
        setErrors({ terms: "You must agree to the terms and conditions" });
        return;
      }
      setErrors({});
      setIsPaymentDialogOpen(true);
    },
    [agreedToTerms, setIsPaymentDialogOpen, setErrors],
  );

  const processPayment = useCallback(async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (paymentMethod === "savings" && balance < discountedPrice) {
      toast.error("Insufficient funds in savings account");
      return;
    }

    try {
      // Create booking first
      const booking = await createBooking(id, {
        startDate,
        endDate,
        selectedOrigin,
        selectedTransportRoute,
        selectedHotel,
        selectedActivities,
        activitySessions,
        skipOptions,
      });

      if (booking.error) {
        toast.error(booking.error);
        return;
      }

      // Process payment based on method
      let paymentResult;

      switch (paymentMethod) {
        case "savings":
          paymentResult = await bookingCreationService.processPayment(
            booking.bookingId,
            {
              paymentMethod: "savings",
              amount: discountedPrice,
            },
          );
          break;

        default:
          paymentResult = await bookingCreationService.processPayment(
            booking.bookingId,
            {
              paymentMethod: "external",
              amount: totalPrice,
            },
          );
          break;
      }

      if (paymentResult && !paymentResult.error) {
        const finalAmount = paymentMethod === "savings" ? discountedPrice : totalPrice;
        const discountMessage = paymentMethod === "savings" ? ` (5% savings discount applied!)` : "";
        toast.success(
          `Booking confirmed! Payment of ${formatTZS(finalAmount)} processed successfully.${discountMessage}`,
        );
        setIsPaymentDialogOpen(false);
        resetBooking();
        router.push("/my-bookings");
      } else {
        toast.error(paymentResult?.error || "Payment processing failed");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment. Please try again.");
    }
  }, [
    paymentMethod,
    balance,
    totalPrice,
    discountedPrice,
    id,
    startDate,
    endDate,
    selectedOrigin,
    selectedTransportRoute,
    selectedHotel,
    selectedActivities,
    activitySessions,
    skipOptions,
    createBooking,
    setIsPaymentDialogOpen,
    resetBooking,
    router,
  ]);

  const formatDate = formatBookingDate;

  const getTransportIcon = useCallback(
    (type) => (
      <TransportIcon type={type} className="h-5 w-5" color="text-amber-700" />
    ),
    [],
  );

  // Show loading state while fetching destination
  if (isLoading.destination) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Smart Tour Destinations</p>
        </div>
      </div>
    );
  }

  // Show error state if destination fetch failed
  if (error.destination) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading destination: {error.destination}
          </AlertDescription>
        </Alert>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => router.push("/locations")}
        >
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
          <AlertDescription>
            Location not found. Please try another destination.
          </AlertDescription>
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
              <MapPin className="h-4 w-4" /> Tanzania
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              {destination.name}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl">
              {destination.description}
            </p>
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
            <div className="flex items-center">
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center ${
                  step >= 1
                    ? "bg-amber-700 text-white"
                    : "bg-amber-100 text-gray-500"
                }`}
              >
                1
              </div>
              <div
                className={`h-1 flex-grow ${step > 1 ? "bg-amber-700" : "bg-amber-100"}`}
              ></div>
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center ${
                  step >= 2
                    ? "bg-amber-700 text-white"
                    : "bg-amber-100 text-gray-500"
                }`}
              >
                2
              </div>
              <div
                className={`h-1 flex-grow ${step > 2 ? "bg-amber-700" : "bg-amber-100"}`}
              ></div>
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center ${
                  step >= 3
                    ? "bg-amber-700 text-white"
                    : "bg-amber-100 text-gray-500"
                }`}
              >
                3
              </div>
              <div
                className={`h-1 flex-grow ${step > 3 ? "bg-amber-700" : "bg-amber-100"}`}
              ></div>
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center ${
                  step >= 4
                    ? "bg-amber-700 text-white"
                    : "bg-amber-100 text-gray-500"
                }`}
              >
                4
              </div>
              <div
                className={`h-1 flex-grow ${step > 4 ? "bg-amber-700" : "bg-amber-100"}`}
              ></div>
              <div
                className={`rounded-full h-10 w-10 flex items-center justify-center ${
                  step >= 5
                    ? "bg-amber-700 text-white"
                    : "bg-amber-100 text-gray-500"
                }`}
              >
                5
              </div>
            </div>
          </div>
        </div>

        {/* Use handleBooking for the form submission */}
        <form onSubmit={handleBooking} className="space-y-8">
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2 mb-6">
                  <Calendar className="h-5 w-5 text-amber-600" /> Select Your
                  Travel Details
                </h3>

                {/* Origin Selection - only show if transport is not skipped */}
                {!skipOptions.skipTransport && (
                  <div className="mb-8">
                    <Label htmlFor="origin" className="text-base mb-2 block">
                      Departure Location
                    </Label>
                    <select
                      id="origin"
                      value={selectedOrigin || ""}
                      onChange={(e) => setSelectedOrigin(e.target.value)}
                      className={`w-full h-12 text-base px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                        errors.origin ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select your departure location</option>
                      {(transportOrigins || []).map((origin) => (
                        <option key={origin.id} value={origin.id}>
                          {origin.name}
                        </option>
                      ))}
                    </select>
                    {errors.origin && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.origin}
                      </p>
                    )}
                  </div>
                )}

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
                    {errors.startDate && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.startDate}
                      </p>
                    )}
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
                    {errors.endDate && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.endDate}
                      </p>
                    )}
                  </div>
                </div>

                {startDate &&
                  endDate &&
                  new Date(startDate) <= new Date(endDate) && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Duration of stay:</p>
                          <p className="text-lg font-semibold">
                            {nights} {nights === 1 ? "night" : "nights"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-amber-700 hover:bg-amber-800 text-white px-8"
                >
                  Continue to Transport
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Bus className="h-5 w-5 text-amber-600" /> Select Transport
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setSkipOption("skipTransport", !skipOptions.skipTransport)
                    }
                    className={`${skipOptions.skipTransport ? "bg-amber-100 border-amber-300" : ""}`}
                  >
                    {skipOptions.skipTransport
                      ? "Include Transport"
                      : "Skip Transport"}
                  </Button>
                </div>

                {skipOptions.skipTransport && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                    <p className="text-amber-800 font-medium">
                      Transport skipped
                    </p>
                    <p className="text-amber-700 text-sm">
                      You can arrange your own transportation to{" "}
                      {destination?.name}.
                    </p>
                  </div>
                )}

                {!skipOptions.skipTransport && (
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="transport"
                        className="text-base mb-2 block"
                      >
                        Transport Route
                      </Label>

                      {/* Show loading state for transport routes */}
                      {isLoading.transports ? (
                        <div className="flex justify-center items-center py-8">
                          <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
                          <span className="ml-3 text-amber-600">
                            Loading transport options...
                          </span>
                        </div>
                      ) : error.transports ? (
                        <Alert variant="destructive" className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {error.transports}. Please try refreshing the page.
                          </AlertDescription>
                        </Alert>
                      ) : !transportRoutes ||
                        !Array.isArray(transportRoutes) ||
                        transportRoutes.length === 0 ? (
                        <Alert className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No transport routes available to {destination.name}.
                            Please check back later or contact customer service.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {(transportRoutes || []).map((route) => (
                            <Card
                              key={route.id}
                              className={`cursor-pointer overflow-hidden transition-all duration-200 ${
                                selectedTransportRoute === route.id.toString()
                                  ? "border-amber-600 ring-2 ring-amber-200"
                                  : "hover:border-amber-300"
                              }`}
                              onClick={() =>
                                setSelectedTransportRoute(route.id.toString())
                              }
                            >
                              <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start gap-4 flex-1">
                                    <div className="p-2 rounded-lg bg-blue-100">
                                      {getTransportIcon(
                                        route.transportation_type,
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-lg font-semibold mb-1">
                                        {route.origin_name} →{" "}
                                        {route.destination_name}
                                      </h4>
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge
                                          variant="outline"
                                          className="bg-blue-50 border-blue-200"
                                        >
                                          {route.transportation_type}
                                        </Badge>
                                        {route.agency_name && (
                                          <span className="text-sm text-gray-600">
                                            by {route.agency_name}
                                          </span>
                                        )}
                                      </div>

                                      {/* Multi-leg journey details */}
                                      {route.route_details &&
                                      route.route_details.legs &&
                                      Array.isArray(route.route_details.legs) &&
                                      route.route_details.legs.length > 1 ? (
                                        <div className="mt-3 space-y-2">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Badge
                                              variant="secondary"
                                              className="bg-green-100 text-green-800"
                                            >
                                              Multi-leg Journey (
                                              {route.route_details.legs.length}{" "}
                                              legs)
                                            </Badge>
                                            {route.route_details
                                              .total_duration && (
                                              <span className="text-xs text-gray-600">
                                                Total:{" "}
                                                {
                                                  route.route_details
                                                    .total_duration
                                                }
                                              </span>
                                            )}
                                          </div>
                                          <div className="space-y-2 max-h-32 overflow-y-auto">
                                            {(
                                              route.route_details.legs || []
                                            ).map((leg, legIndex) => (
                                              <div
                                                key={legIndex}
                                                className="bg-gray-50 p-3 rounded text-sm"
                                              >
                                                <div className="flex items-center justify-between mb-1">
                                                  <span className="font-medium text-blue-700">
                                                    Leg {legIndex + 1}:{" "}
                                                    {leg.departure} →{" "}
                                                    {leg.arrival}
                                                  </span>
                                                  {leg.carrier && (
                                                    <span className="text-xs text-gray-600">
                                                      {leg.carrier}
                                                    </span>
                                                  )}
                                                </div>
                                                {(leg.departure_time ||
                                                  leg.arrival_time ||
                                                  leg.flight_number) && (
                                                  <div className="text-xs text-gray-600 space-y-1">
                                                    {(leg.departure_time ||
                                                      leg.arrival_time) && (
                                                      <p>
                                                        {leg.departure_time &&
                                                          `Dep: ${leg.departure_time}`}
                                                        {leg.departure_time &&
                                                          leg.arrival_time &&
                                                          " → "}
                                                        {leg.arrival_time &&
                                                          `Arr: ${leg.arrival_time}`}
                                                      </p>
                                                    )}
                                                    {leg.flight_number && (
                                                      <p>
                                                        Flight:{" "}
                                                        {leg.flight_number}
                                                      </p>
                                                    )}
                                                    {leg.duration_hours && (
                                                      <p>
                                                        Duration:{" "}
                                                        {leg.duration_hours}h
                                                      </p>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                          {route.route_details
                                            .booking_instructions && (
                                            <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-800">
                                              <strong>Instructions:</strong>{" "}
                                              {
                                                route.route_details
                                                  .booking_instructions
                                              }
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="mt-2">
                                          {route.description && (
                                            <p className="text-gray-600 text-sm">
                                              {route.description}
                                            </p>
                                          )}
                                          {route.route_details &&
                                            typeof route.route_details ===
                                              "string" && (
                                              <p className="text-gray-600 text-sm">
                                                {route.route_details}
                                              </p>
                                            )}
                                        </div>
                                      )}

                                      {/* Contact information */}
                                      {route.agency_phone && (
                                        <div className="mt-2 text-xs text-gray-500">
                                          Contact: {route.agency_phone}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className="text-xl font-bold">
                                      {formatTZS(route.cost)}
                                    </div>
                                    {selectedTransportRoute ===
                                      route.id.toString() && (
                                      <div className="flex items-center gap-2 text-amber-600 mt-2">
                                        <Check className="h-5 w-5" /> Selected
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}

                      {errors.transportRoute && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.transportRoute}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    onClick={handlePrevStep}
                    variant="outline"
                    className="h-12 px-8 border border-amber-200 hover:bg-amber-50"
                  >
                    Back to Travel Details
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-amber-700 hover:bg-amber-800 text-white h-12 px-8"
                  >
                    Continue to Hotels
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Hotel className="h-5 w-5 text-amber-600" /> Select Hotel
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setSkipOption("skipHotel", !skipOptions.skipHotel)
                    }
                    className={`${skipOptions.skipHotel ? "bg-amber-100 border-amber-300" : ""}`}
                  >
                    {skipOptions.skipHotel ? "Include Hotel" : "Skip Hotel"}
                  </Button>
                </div>

                {skipOptions.skipHotel && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                    <p className="text-amber-800 font-medium">
                      Hotel accommodation skipped
                    </p>
                    <p className="text-amber-700 text-sm">
                      You can arrange your own accommodation in{" "}
                      {destination?.name}.
                    </p>
                  </div>
                )}

                {!skipOptions.skipHotel && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="hotel" className="text-base mb-2 block">
                        Hotel Choice
                      </Label>

                      {/* Show loading state for hotels */}
                      {isLoading.hotels ? (
                        <div className="flex justify-center items-center py-8">
                          <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
                          <span className="ml-3 text-amber-600">
                            Loading hotels...
                          </span>
                        </div>
                      ) : error.hotels ? (
                        <Alert variant="destructive" className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {error.hotels}. Please try refreshing the page.
                          </AlertDescription>
                        </Alert>
                      ) : !hotels ||
                        !Array.isArray(hotels) ||
                        hotels.length === 0 ? (
                        <Alert className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No hotels available at {destination.name}. Please
                            check back later or contact customer service.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {(hotels || []).map((hotel) => (
                            <Card
                              key={hotel.id}
                              className={`cursor-pointer overflow-hidden transition-all duration-200 ${
                                selectedHotel === hotel.id.toString()
                                  ? "border-amber-600 ring-2 ring-amber-200"
                                  : "hover:border-amber-300"
                              }`}
                              onClick={() =>
                                setSelectedHotel(hotel.id.toString())
                              }
                            >
                              <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row">
                                  <div className="relative w-full md:w-1/3 h-48">
                                    <Image
                                      src={(() => {
                                        try {
                                          // If images is a string (likely JSON), try to parse it
                                          if (
                                            hotel.images &&
                                            typeof hotel.images === "string"
                                          ) {
                                            const parsedImages = JSON.parse(
                                              hotel.images,
                                            );
                                            if (
                                              Array.isArray(parsedImages) &&
                                              parsedImages.length > 0
                                            ) {
                                              return parsedImages[0]; // Return first image URL
                                            }
                                          }
                                          // If images is already parsed as an array
                                          else if (
                                            hotel.images &&
                                            Array.isArray(hotel.images) &&
                                            hotel.images.length > 0
                                          ) {
                                            return hotel.images[0]; // Return first image URL
                                          }
                                        } catch (e) {
                                          console.error(
                                            "Error parsing hotel images:",
                                            e,
                                          );
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
                                        <h4 className="text-xl font-semibold mb-1">
                                          {hotel.name}
                                        </h4>
                                        <div className="flex items-center text-gray-500 gap-1 mb-2">
                                          <MapPin className="h-4 w-4" />
                                          <span>{hotel.location}</span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-lg font-bold">
                                          {formatTZS(
                                            hotel.base_price_per_night,
                                          )}{" "}
                                          <span className="text-sm text-gray-500 font-normal">
                                            / night
                                          </span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {formatTZS(
                                            hotel.base_price_per_night * nights,
                                          )}{" "}
                                          total for {nights}{" "}
                                          {nights === 1 ? "night" : "nights"}
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-gray-600 line-clamp-2 mt-2">
                                      {hotel.description}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between">
                                      {selectedHotel ===
                                        hotel.id.toString() && (
                                        <div className="flex items-center gap-2 text-amber-600">
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

                      {errors.hotel && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.hotel}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    onClick={handlePrevStep}
                    variant="outline"
                    className="h-12 px-8 border border-amber-200 hover:bg-amber-50"
                  >
                    Back to Transport
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="h-12 px-8 text-white bg-amber-700 hover:bg-amber-800"
                  >
                    Continue to Activities{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-amber-600" /> Select
                    Activities
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setSkipOption(
                        "skipActivities",
                        !skipOptions.skipActivities,
                      )
                    }
                    className={`${skipOptions.skipActivities ? "bg-amber-100 border-amber-300" : ""}`}
                  >
                    {skipOptions.skipActivities
                      ? "Include Activities"
                      : "Skip Activities"}
                  </Button>
                </div>

                {skipOptions.skipActivities && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                    <p className="text-amber-800 font-medium">
                      Activities skipped
                    </p>
                    <p className="text-amber-700 text-sm">
                      You can explore {destination?.name} on your own or book
                      activities separately.
                    </p>
                  </div>
                )}

                {!skipOptions.skipActivities && (
                  <div className="space-y-6">
                    <div>
                      <Label
                        htmlFor="activities"
                        className="text-base mb-2 block"
                      >
                        Choose Activities and Schedule Your Experience
                      </Label>

                      {/* Show loading state for activities */}
                      {isLoading.activities ? (
                        <div className="flex justify-center items-center py-8">
                          <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
                          <span className="ml-3 text-amber-600">
                            Loading activities...
                          </span>
                        </div>
                      ) : error.activities ? (
                        <Alert variant="destructive" className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {error.activities}. Please try refreshing the page.
                          </AlertDescription>
                        </Alert>
                      ) : apiActivities &&
                        Array.isArray(apiActivities) &&
                        apiActivities.length > 0 ? (
                        <>
                          <p className="text-sm text-gray-500 mb-4">
                            Enhance your stay in {destination.name} with these
                            exciting activities. Select activities and specify
                            the number of sessions you&apos;d like.
                          </p>
                          <div className="space-y-6">
                            {(apiActivities || []).map((activity) => {
                              const isSelected = selectedActivities.includes(
                                activity.id.toString(),
                              );
                              const currentSessions =
                                activitySessions[activity.id] || 1;

                              return (
                                <Card
                                  key={activity.id}
                                  className={`overflow-hidden transition-all duration-200 ${
                                    isSelected
                                      ? "ring-2 ring-amber-500 bg-amber-50"
                                      : "hover:shadow-md"
                                  }`}
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() =>
                                            toggleActivity(
                                              activity.id.toString(),
                                            )
                                          }
                                          className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                                        />
                                        <div>
                                          <CardTitle className="text-lg">
                                            {activity.name}
                                          </CardTitle>
                                        </div>
                                      </div>
                                      <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
                                        {formatTZS(activity.price)}
                                      </Badge>
                                    </div>
                                  </CardHeader>

                                  <CardContent>
                                    <p className="text-gray-600 text-sm mb-4">
                                      {activity.description}
                                    </p>

                                    {/* Sessions Selection - Only shown when activity is selected */}
                                    {isSelected && (
                                      <div className="space-y-4 p-4 bg-white rounded-lg border border-amber-200">
                                        <div className="flex items-center gap-4">
                                          <Label className="text-sm font-medium">
                                            Sessions:
                                          </Label>
                                          <Input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={currentSessions}
                                            onChange={(e) => {
                                              const sessions =
                                                parseInt(e.target.value) || 1;
                                              setActivitySessions(
                                                activity.id,
                                                sessions,
                                              );
                                            }}
                                            className="w-20"
                                          />
                                          <span className="text-sm text-gray-500">
                                            × {formatTZS(activity.price)} ={" "}
                                            {formatTZS(
                                              activity.price * currentSessions,
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <Alert className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No activities available for {destination.name}. You
                            can still proceed with your booking.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    onClick={handlePrevStep}
                    variant="outline"
                    className="h-12 px-8 border border-amber-200 hover:bg-amber-50"
                  >
                    Back to Hotels
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="h-12 px-8 text-white bg-amber-700 hover:bg-amber-800"
                    disabled={
                      !skipOptions.skipActivities &&
                      selectedActivities.length > 0 &&
                      selectedActivities.some((actId) => {
                        const sessions = activitySessions[actId] || 1;
                        return sessions < 1;
                      })
                    }
                  >
                    Continue to Review <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Check className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold">
                  Review and Confirm Your Booking
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Booking Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Destination Card */}
                  <Card className="border-0 shadow-md rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="h-9 w-9 rounded-full bg-amber-50 flex-shrink-0 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-lg">
                            {destination.name}
                          </h4>
                          <p className="text-sm text-gray-600">Tanzania</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-amber-600" />
                          <div>
                            <h4 className="font-medium">Travel Dates</h4>
                            <p className="text-gray-600 text-sm">
                              {formatDate(startDate)} - {formatDate(endDate)}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-amber-50 border-amber-200 text-amber-700"
                        >
                          {nights} {nights === 1 ? "night" : "nights"}
                        </Badge>
                      </div>

                      {selectedHotelObj && (
                        <div className="flex items-start gap-3 mb-4 pt-4 border-t">
                          <div className="h-9 w-9 rounded-full bg-amber-50 flex-shrink-0 flex items-center justify-center">
                            <Hotel className="h-4 w-4 text-amber-600" />
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-medium">
                                  {selectedHotelObj.name}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  <MapPin className="h-3 w-3 inline mr-1" />{" "}
                                  {selectedHotelObj.location}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {formatTZS(
                                    selectedHotelObj.base_price_per_night,
                                  )}{" "}
                                  <span className="text-xs text-gray-500">
                                    / night
                                  </span>
                                </div>
                                <div className="text-sm text-amber-600 font-medium">
                                  {formatTZS(
                                    selectedHotelObj.base_price_per_night *
                                      nights,
                                  )}{" "}
                                  total
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedRoute && (
                        <div className="mb-4 pt-4 border-t">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="h-9 w-9 rounded-full bg-amber-50 flex-shrink-0 flex items-center justify-center">
                              {getTransportIcon(
                                selectedRoute.transportation_type,
                              )}
                            </div>
                            <div className="flex-grow">
                              <div className="flex justify-between">
                                <div>
                                  <h4 className="font-medium">
                                    {selectedRoute.transportation_type ||
                                      "Transport"}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {selectedRoute.origin_name} to{" "}
                                    {selectedRoute.destination_name}
                                  </p>
                                  {selectedRoute.agency_name && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Provider: {selectedRoute.agency_name}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-amber-600">
                                    {formatTZS(selectedRoute.cost)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Multi-leg journey details for review */}
                          {selectedRoute.route_details &&
                            selectedRoute.route_details.legs &&
                            Array.isArray(selectedRoute.route_details.legs) &&
                            selectedRoute.route_details.legs.length > 1 && (
                              <div className="bg-blue-50 p-3 rounded-md">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge
                                    variant="secondary"
                                    className="bg-blue-100 text-blue-800 text-xs"
                                  >
                                    Multi-leg Journey
                                  </Badge>
                                  {selectedRoute.route_details
                                    .total_duration && (
                                    <span className="text-xs text-gray-600">
                                      Total:{" "}
                                      {
                                        selectedRoute.route_details
                                          .total_duration
                                      }
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  {(selectedRoute.route_details.legs || []).map(
                                    (leg, legIndex) => (
                                      <div
                                        key={legIndex}
                                        className="bg-white p-2 rounded text-xs"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium text-blue-700">
                                            {leg.departure} → {leg.arrival}
                                          </span>
                                          {leg.carrier && (
                                            <span className="text-gray-600">
                                              {leg.carrier}
                                            </span>
                                          )}
                                        </div>
                                        {(leg.departure_time ||
                                          leg.flight_number) && (
                                          <div className="mt-1 text-gray-600">
                                            {leg.departure_time &&
                                              `Dep: ${leg.departure_time}`}
                                            {leg.flight_number &&
                                              ` • ${leg.flight_number}`}
                                          </div>
                                        )}
                                      </div>
                                    ),
                                  )}
                                </div>
                                {selectedRoute.route_details
                                  .booking_instructions && (
                                  <div className="mt-2 p-2 bg-amber-100 rounded text-xs text-amber-800">
                                    <strong>Important:</strong>{" "}
                                    {
                                      selectedRoute.route_details
                                        .booking_instructions
                                    }
                                  </div>
                                )}
                                {selectedRoute.agency_phone && (
                                  <div className="mt-2 text-xs text-gray-600">
                                    <strong>Contact for details:</strong>{" "}
                                    {selectedRoute.agency_phone}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Activities Section */}
                  {selectedActivitiesObj.length > 0 && (
                    <Card className="border-0 shadow-md rounded-xl">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-amber-600" />
                          Selected Activities
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid gap-4">
                          {selectedActivitiesObj.map((activity) => (
                            <div
                              key={activity.id}
                              className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                            >
                              <div className="h-9 w-9 rounded-full bg-green-50 flex-shrink-0 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-green-600" />
                              </div>
                              <div className="flex-grow">
                                <div className="flex justify-between">
                                  <div>
                                    <h4 className="font-medium">
                                      {activity.name}
                                    </h4>

                                    {activity.description && (
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {activity.description}
                                      </p>
                                    )}
                                    <div className="mt-2">
                                      <span className="text-xs text-gray-500">
                                        Sessions:{" "}
                                        {activitySessions[activity.id] || 1} ×{" "}
                                        {formatTZS(activity.price)} ={" "}
                                        {formatTZS(
                                          (activitySessions[activity.id] || 1) *
                                            parseFloat(activity.price || 0),
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <Badge className="bg-green-50 text-green-700 border border-green-200">
                                      {formatTZS(
                                        (activitySessions[activity.id] || 1) *
                                          parseFloat(activity.price || 0),
                                      )}
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
                          {selectedHotelObj && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Accommodation ({nights}{" "}
                                {nights === 1 ? "night" : "nights"})
                              </span>
                              <span className="font-medium">
                                {formatTZS(
                                  selectedHotelObj.base_price_per_night *
                                    nights,
                                )}
                              </span>
                            </div>
                          )}

                          {selectedRoute && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Transport</span>
                              <span className="font-medium">
                                {formatTZS(parseFloat(selectedRoute.cost))}
                              </span>
                            </div>
                          )}

                          {selectedActivitiesObj.length > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Activities ({selectedActivitiesObj.length})
                              </span>
                              <span className="font-medium">
                                {formatTZS(
                                  selectedActivitiesObj.reduce((sum, act) => {
                                    const activityPrice = parseFloat(
                                      act.price || 0,
                                    );
                                    const sessions =
                                      activitySessions[act.id] || 1;
                                    return sum + activityPrice * sessions;
                                  }, 0),
                                )}
                              </span>
                            </div>
                          )}

                          <Separator className="my-3" />

                          <div className="flex justify-between text-base font-bold">
                            <span>Total</span>
                            <span className="text-amber-700">
                              {formatTZS(totalPrice)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-6 space-y-4">
                          <div className="flex items-center space-x-2 p-3 bg-amber-50 rounded-lg">
                            <Checkbox
                              id="terms"
                              checked={agreedToTerms}
                              onCheckedChange={setAgreedToTerms}
                              className={`${errors.terms ? "border-red-500" : ""} h-5 w-5`}
                            />
                            <Label htmlFor="terms" className="text-sm">
                              I agree to the{" "}
                              <Link 
                                href="/terms" 
                                className="text-amber-700 hover:text-amber-800 underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                terms and conditions
                              </Link>
                            </Label>
                          </div>
                          {errors.terms && (
                            <p className="text-red-500 text-xs -mt-2 ml-2">
                              {errors.terms}
                            </p>
                          )}

                          <div className="flex gap-3">
                            <Button
                              type="button"
                              onClick={async () => {
                                if (!agreedToTerms) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    terms:
                                      "Please agree to terms and conditions",
                                  }));
                                  return;
                                }

                                try {
                                  // Prepare cart booking data
                                  const cartBookingData = {
                                    destinationId,
                                    startDate,
                                    endDate,
                                    includeTransport:
                                      !skipOptions.skipTransport,
                                    includeHotel: !skipOptions.skipHotel,
                                    includeActivities:
                                      !skipOptions.skipActivities,
                                    transportId: selectedTransportRoute || null,
                                    hotelId: selectedHotel || null,
                                    activityIds: selectedActivities || [],
                                    activitySessions,
                                  };

                                  await addToCart(cartBookingData);

                                  // Reset the booking form
                                  resetBooking();

                                  // Navigate back to destinations or cart
                                  router.push("/cart");
                                } catch (error) {
                                  // Error is handled in the cart store
                                }
                              }}
                              variant="outline"
                              className="flex-1 h-12 border-amber-200 hover:bg-amber-50 font-medium"
                              disabled={!agreedToTerms}
                            >
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Add to Cart
                            </Button>

                            <Button
                              type="submit"
                              className="flex-1 h-12 text-white bg-amber-700 hover:bg-amber-800 font-medium"
                              disabled={!agreedToTerms}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Pay Now
                            </Button>
                          </div>

                          <Button
                            type="button"
                            onClick={handlePrevStep}
                            variant="outline"
                            className="w-full h-12 border-amber-200 hover:bg-amber-50 mt-2"
                          >
                            Back to Activities
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
            <DialogDescription>
              Choose how you want to pay for your booking.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="credit" onValueChange={setPaymentMethod}>
            <TabsList className="w-full mb-4 grid grid-cols-2">
              <TabsTrigger value="credit" className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" /> Credit Card
              </TabsTrigger>
              <TabsTrigger value="savings" className="flex-1">
                <Wallet className="h-4 w-4 mr-2" /> Savings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="credit" className="space-y-4">
              {/* Credit Card Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input id="cardNumber" type="text" />
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
                  <Input id="nameOnCard" type="text" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="savings" className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <PiggyBank className="h-4 w-4 text-green-600" />
                  <span className="text-green-800 font-medium text-sm">5% Savings Discount Applied!</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span>Available Balance:</span>
                  <span className="font-semibold">{formatTZS(balance)}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span>Original Price:</span>
                  <span className="line-through text-gray-500">{formatTZS(totalPrice)}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span>Discount (5%):</span>
                  <span className="text-green-600">-{formatTZS(savingsDiscount)}</span>
                </div>
                <div className="flex justify-between items-center font-semibold">
                  <span>You Pay:</span>
                  <span className="text-green-600">{formatTZS(discountedPrice)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center font-medium">
                  <span>Remaining Balance:</span>
                  <span
                    className={
                      balance >= discountedPrice ? "text-green-600" : "text-red-600"
                    }
                  >
                    {formatTZS(balance - discountedPrice)}
                  </span>
                </div>
                {balance < discountedPrice && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient funds in your savings account. Please choose
                      another payment method or top up your balance.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={processPayment}
              disabled={
                (paymentMethod === "savings" && balance < discountedPrice) ||
                !paymentMethod
              }
            >
              Pay {paymentMethod === "savings" ? formatTZS(discountedPrice) : formatTZS(totalPrice)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Wrap the component with RouteProtection to ensure only logged-in tourists can access
export default function ProtectedBookingPage({ params }) {
  return (
    <RouteProtection allowedRoles={["tourist"]}>
      <BookLocation params={params} />
    </RouteProtection>
  );
}
