"use client";

import React, { useMemo, useCallback, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Plane,
  Ship,
  Wallet,
  Loader2,
  ShoppingCart,
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
import { EnhancedPaymentDialog } from "@/app/components/enhanced-payment-dialog";
import { formatTZS } from "@/app/utils/currency";
import { debounce } from "@/app/utils/debounce";
import { toast } from "sonner";
import { bookingCreationService } from "@/app/services/api";

function BookLocation({ params }) {
  const { id } = use(params);
  const destinationId = parseInt(id, 10);

  const router = useRouter();

  // Get cart store actions
  const { addToCart } = useCartStore();

  // Get wallet-related state from savings store
  const {
    isWalletConnected,
    isConnectingWallet,
    walletAddress,
    connectWallet,
    disconnectWallet,
  } = useSavingsStore();

  // Get state and actions from Zustand store
  const {
    step,
    startDate,
    endDate,
    selectedOrigin,
    selectedTransportRoute,
    selectedHotel,
    selectedActivities,
    activitySchedules,
    skipOptions,
    errors,
    agreedToTerms,
    paymentMethod,
    isPaymentDialogOpen,
    isEnhancedPaymentOpen,
    savingsBalance,
    setIsEnhancedPaymentOpen,
    processEnhancedPayment,
    setStartDate,
    setEndDate,
    setSelectedOrigin,
    setSelectedTransportRoute,
    setSelectedHotel,
    toggleActivity,
    setActivitySchedule,
    setSkipOption,
    setAgreedToTerms,
    setPaymentMethod,
    setIsPaymentDialogOpen,
    resetBooking,
    nextStep,
    prevStep,
    setErrors,
    createBooking,
    checkActivityAvailability,

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

  // State for real-time availability checking
  const [availabilityChecking, setAvailabilityChecking] = React.useState({});
  const [availabilityData, setAvailabilityData] = React.useState({});

  // Real-time availability checking function with enhanced error handling
  const checkAvailability = React.useCallback(
    async (activityId, date, timeSlot) => {
      if (!activityId || !date || !timeSlot) return null;

      const key = `${activityId}-${date}-${timeSlot}`;
      setAvailabilityChecking((prev) => ({ ...prev, [key]: true }));

      try {
        const availability = await checkActivityAvailability(
          activityId,
          date,
          timeSlot,
        );
        setAvailabilityData((prev) => ({
          ...prev,
          [key]: {
            ...availability,
            error: false,
            lastChecked: Date.now(),
          },
        }));
        return availability;
      } catch (error) {
        console.error("Error checking availability:", error);
        setAvailabilityData((prev) => ({
          ...prev,
          [key]: {
            available: false,
            error: true,
            errorMessage: error.message || "Failed to check availability",
            lastChecked: Date.now(),
          },
        }));
        return { available: false, error: true };
      } finally {
        setAvailabilityChecking((prev) => ({ ...prev, [key]: false }));
      }
    },
    [checkActivityAvailability],
  );

  // Debounced availability checking to avoid too many API calls
  const debouncedAvailabilityCheck = React.useMemo(
    () => debounce(checkAvailability, 500),
    [checkAvailability],
  );

  // Fetch destination data when component mounts
  useEffect(() => {
    if (destinationId) {
      fetchDestination(destinationId);
    }
    // Fetch transport origins for origin selection
    fetchTransportOrigins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationId]);

  // Fetch related data when destination is loaded
  useEffect(() => {
    if (destination) {
      // Fetch hotels in this location - prioritize using the region
      fetchHotels(destination.region || destination.name);

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
    // Use the actual API data when available
    return apiActivities.filter((a) =>
      selectedActivities.includes(a.id.toString()),
    );
  }, [selectedActivities, apiActivities]);

  // Find selected transport and hotel objects
  const selectedRoute = useMemo(() => {
    if (!selectedTransportRoute || !transportRoutes.length) return null;
    return transportRoutes.find(
      (r) => r.id.toString() === selectedTransportRoute.toString(),
    );
  }, [selectedTransportRoute, transportRoutes]);

  const selectedHotelObj = useMemo(() => {
    if (!selectedHotel || !hotels.length) return null;
    return hotels.find((h) => h.id.toString() === selectedHotel.toString());
  }, [selectedHotel, hotels]);

  // Calculate nights using the custom hook
  const nights = useBookingNights();

  // Calculate total price accounting for skipped services
  const totalPrice = useMemo(() => {
    let total = 0;

    // Add destination cost per day if available
    if (destination && destination.cost && nights > 0) {
      const destinationCostPerDay = parseFloat(destination.cost);
      if (!isNaN(destinationCostPerDay)) {
        total += destinationCostPerDay * nights;
      }
    }

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

    // Add selected activities cost only if not skipped
    if (!skipOptions.skipActivities && selectedActivitiesObj.length > 0) {
      selectedActivitiesObj.forEach((activity) => {
        total += activity.price ? parseFloat(activity.price) : 0;
      });
    }

    return total;
  }, [
    destination,
    nights,
    selectedRoute,
    selectedHotelObj,
    selectedActivitiesObj,
    skipOptions,
  ]);

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

  const handleEnhancedPaymentSuccess = useCallback(
    async (paymentResult) => {
      try {
        toast.success(
          `Booking confirmed! Payment of ${formatTZS(totalPrice)} processed successfully.`,
        );
        setIsEnhancedPaymentOpen(false);
        resetBooking();
        router.push("/my-bookings");
      } catch (error) {
        console.error("Error handling payment success:", error);
        toast.error("Error processing booking confirmation");
      }
    },
    [totalPrice, resetBooking, router],
  );

  const processPayment = useCallback(async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    // Validation based on payment method
    if (paymentMethod === "crypto" && !isWalletConnected) {
      toast.error("Please connect your wallet for crypto payments");
      return;
    }

    if (paymentMethod === "savings" && savingsBalance < totalPrice) {
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
        activitySchedules,
        skipOptions,
      });

      if (booking.error) {
        toast.error(booking.error);
        return;
      }

      // Process payment based on method
      let paymentResult;

      switch (paymentMethod) {
        case "crypto":
          // For crypto payments, we need the wallet address
          paymentResult = await bookingCreationService.processPayment(
            booking.bookingId,
            {
              paymentMethod: "crypto",
            },
          );
          break;

        case "savings":
          paymentResult = await bookingCreationService.processPayment(
            booking.bookingId,
            {
              paymentMethod: "savings",
            },
          );
          break;

        default:
          paymentResult = await bookingCreationService.processPayment(
            booking.bookingId,
            {
              paymentMethod: "external",
            },
          );
          break;
      }

      if (paymentResult && !paymentResult.error) {
        toast.success(
          `Booking confirmed! Payment of ${formatTZS(totalPrice)} processed successfully.`,
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
    savingsBalance,
    totalPrice,
    id,
    startDate,
    endDate,
    selectedOrigin,
    selectedTransportRoute,
    selectedHotel,
    selectedActivities,
    activitySchedules,
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
              <MapPin className="h-4 w-4" /> {destination.region || "Tanzania"}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              {destination.name}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl">
              {destination.description}
            </p>{" "}
            <div className="flex items-center gap-4 mt-4">
              <Badge
                variant="secondary"
                className="text-lg bg-amber-700 text-white"
              >
                TZS{" "}
                {(() => {
                  // Handle the cost display with proper parsing
                  if (destination.cost) {
                    const cost = parseFloat(destination.cost);
                    return !isNaN(cost) ? cost.toFixed(2) : "Price varies";
                  }
                  return "Price varies";
                })()}{" "}
                /= per visit
              </Badge>
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
            <div className="flex justify-between md:gap-12 gap-4 mb-2">
              <div className="text-center w-full">
                <span
                  className={`text-sm ${step >= 1 ? "text-amber-700 font-medium" : "text-gray-500"}`}
                >
                  Dates
                </span>
              </div>
              <div className="text-center w-full">
                <span
                  className={`text-sm ${step >= 2 ? "text-amber-700 font-medium" : "text-gray-500"}`}
                >
                  Transport
                </span>
              </div>
              <div className="text-center w-full">
                <span
                  className={`text-sm ${step >= 3 ? "text-amber-700 font-medium" : "text-gray-500"}`}
                >
                  Hotels
                </span>
              </div>
              <div className="text-center w-full">
                <span
                  className={`text-sm ${step >= 4 ? "text-amber-700 font-medium" : "text-gray-500"}`}
                >
                  Activities
                </span>
              </div>
              <div className="text-center w-full">
                <span
                  className={`text-sm ${step >= 5 ? "text-amber-700 font-medium" : "text-gray-500"}`}
                >
                  Review
                </span>
              </div>
            </div>

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
                      {transportOrigins.map((origin) => (
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
                        <div className="text-right">
                          <p className="font-medium">Base cost:</p>
                          <p className="text-lg font-semibold">
                            $
                            {(() => {
                              if (destination.cost) {
                                const cost = parseFloat(destination.cost);
                                return !isNaN(cost) ? cost.toFixed(2) : "0.00";
                              }
                              return "0.00";
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
                    onClick={() => setSkipOption('skipTransport', !skipOptions.skipTransport)}
                    className={`${skipOptions.skipTransport ? 'bg-amber-100 border-amber-300' : ''}`}
                  >
                    {skipOptions.skipTransport ? 'Include Transport' : 'Skip Transport'}
                  </Button>
                </div>

                {skipOptions.skipTransport && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                    <p className="text-amber-800 font-medium">Transport skipped</p>
                    <p className="text-amber-700 text-sm">You can arrange your own transportation to {destination?.name}.</p>
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
                      ) : transportRoutes.length === 0 ? (
                        <Alert className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No transport routes available to {destination.name}.
                            Please check back later or contact customer service.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {transportRoutes.map((route) => (
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
                                            {route.route_details.legs.map(
                                              (leg, legIndex) => (
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
                                              ),
                                            )}
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
                                      ${route.cost}
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
                    onClick={prevStep}
                    variant="outline"
                    className="h-12 px-8 border border-amber-200 hover:bg-amber-50"
                  >
                    Back to Travel Details
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
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
                      onClick={() => setSkipOption('skipHotel', !skipOptions.skipHotel)}
                      className={`${skipOptions.skipHotel ? 'bg-amber-100 border-amber-300' : ''}`}
                    >
                      {skipOptions.skipHotel ? 'Include Hotel' : 'Skip Hotel'}
                    </Button>
                  </div>

                  {skipOptions.skipHotel && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                      <p className="text-amber-800 font-medium">Hotel accommodation skipped</p>
                      <p className="text-amber-700 text-sm">You can arrange your own accommodation in {destination?.name}.</p>
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
                      ) : hotels.length === 0 ? (
                        <Alert className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No hotels available at {destination.name}. Please
                            check back later or contact customer service.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {hotels.map((hotel) => (
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
                                        <div className="flex items-center gap-2 mb-3 text-sm">
                                          <Badge
                                            variant="outline"
                                            className="bg-green-50 border-green-200"
                                          >
                                            Capacity: {hotel.capacity}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-lg font-bold">
                                          ${hotel.base_price_per_night}{" "}
                                          <span className="text-sm text-gray-500 font-normal">
                                            / night
                                          </span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          ${hotel.base_price_per_night * nights}{" "}
                                          total for {nights}{" "}
                                          {nights === 1 ? "night" : "nights"}
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-gray-600 line-clamp-2 mt-2">
                                      {hotel.description}
                                    </p>
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
                    onClick={prevStep}
                    variant="outline"
                    className="h-12 px-8 border border-amber-200 hover:bg-amber-50"
                  >
                    Back to Transport
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="h-12 px-8 text-white bg-amber-700 hover:bg-amber-800"
                  >
                    Continue to Activities <ArrowRight className="ml-2 h-4 w-4" />
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
                    <MapPin className="h-5 w-5 text-amber-600" /> Select Activities
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSkipOption('skipActivities', !skipOptions.skipActivities)}
                    className={`${skipOptions.skipActivities ? 'bg-amber-100 border-amber-300' : ''}`}
                  >
                    {skipOptions.skipActivities ? 'Include Activities' : 'Skip Activities'}
                  </Button>
                </div>

                {skipOptions.skipActivities && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                    <p className="text-amber-800 font-medium">Activities skipped</p>
                    <p className="text-amber-700 text-sm">You can explore {destination?.name} on your own or book activities separately.</p>
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
                      ) : apiActivities && apiActivities.length > 0 ? (
                        <>
                          <p className="text-sm text-gray-500 mb-4">
                            Enhance your stay in {destination.name} with these
                            exciting activities. Select activities and choose
                            your preferred time slots.
                          </p>
                          <div className="space-y-6">
                            {apiActivities.map((activity) => {
                              const isSelected = selectedActivities.includes(
                                activity.id.toString(),
                              );
                              const currentSchedule =
                                activitySchedules[activity.id] || {};

                              // Parse time slots and available dates
                              let timeSlots = [];
                              let availableDates = [];
                              try {
                                timeSlots = activity.time_slots
                                  ? JSON.parse(activity.time_slots)
                                  : [];
                                availableDates = activity.available_dates
                                  ? JSON.parse(activity.available_dates)
                                  : [];
                              } catch (e) {
                                console.error(
                                  "Failed to parse activity scheduling data:",
                                  e,
                                );
                              }

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
                                          {activity.duration && (
                                            <div className="flex items-center text-gray-500 text-sm mt-1">
                                              <Clock className="h-3 w-3 mr-1" />{" "}
                                              {activity.duration}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
                                        ${activity.price}
                                      </Badge>
                                    </div>
                                  </CardHeader>

                                  <CardContent>
                                    <p className="text-gray-600 text-sm mb-4">
                                      {activity.description}
                                    </p>

                                    {/* Time Slot Selection - Only shown when activity is selected */}
                                    {isSelected && (
                                      <div className="space-y-4 p-4 bg-white rounded-lg border border-amber-200">
                                        <h5 className="font-medium text-amber-800">
                                          Schedule Your Activity
                                        </h5>

                                        {/* Date Selection */}
                                        {availableDates.length > 0 ? (
                                          <div>
                                            <Label className="text-sm font-medium mb-2 block">
                                              Available Dates
                                            </Label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                              {availableDates.map((date) => (
                                                <Button
                                                  key={date}
                                                  type="button"
                                                  variant={
                                                    currentSchedule.date ===
                                                    date
                                                      ? "default"
                                                      : "outline"
                                                  }
                                                  size="sm"
                                                  className={`text-xs ${
                                                    currentSchedule.date ===
                                                    date
                                                      ? "bg-amber-600 hover:bg-amber-700"
                                                      : "border-amber-200 hover:bg-amber-50"
                                                  }`}
                                                  onClick={() => {
                                                    setActivitySchedule(
                                                      activity.id,
                                                      {
                                                        ...currentSchedule,
                                                        date: date,
                                                      },
                                                    );
                                                    // Check availability for the selected date
                                                    debouncedAvailabilityCheck(
                                                      activity.id,
                                                      date,
                                                      currentSchedule.time_slot,
                                                    );
                                                  }}
                                                >
                                                  {formatDate(date)}
                                                </Button>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div>
                                            <Label className="text-sm font-medium mb-2 block">
                                              Select Date
                                            </Label>
                                            <Input
                                              type="date"
                                              value={currentSchedule.date || ""}
                                              min={startDate}
                                              max={endDate}
                                              onChange={(e) => {
                                                setActivitySchedule(
                                                  activity.id,
                                                  {
                                                    ...currentSchedule,
                                                    date: e.target.value,
                                                  },
                                                );
                                                // Check availability for the selected date
                                                debouncedAvailabilityCheck(
                                                  activity.id,
                                                  e.target.value,
                                                  currentSchedule.time_slot,
                                                );
                                              }}
                                              className="max-w-xs"
                                            />
                                          </div>
                                        )}

                                        {/* Time Slot Selection */}
                                        {timeSlots.length > 0 ? (
                                          <div>
                                            <Label className="text-sm font-medium mb-2 block">
                                              Available Time Slots
                                            </Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                              {timeSlots.map((slot) => (
                                                <Button
                                                  key={slot.time}
                                                  type="button"
                                                  variant={
                                                    currentSchedule.time_slot ===
                                                    slot.time
                                                      ? "default"
                                                      : "outline"
                                                  }
                                                  size="sm"
                                                  className={`text-xs ${
                                                    currentSchedule.time_slot ===
                                                    slot.time
                                                      ? "bg-amber-600 hover:bg-amber-700"
                                                      : "border-amber-200 hover:bg-amber-50"
                                                  }`}
                                                  onClick={() => {
                                                    const newSchedule = {
                                                      ...currentSchedule,
                                                      time_slot: slot.time,
                                                    };
                                                    setActivitySchedule(
                                                      activity.id,
                                                      newSchedule,
                                                    );
                                                    // Check availability for the selected time slot
                                                    if (
                                                      newSchedule.date &&
                                                      slot.time
                                                    ) {
                                                      debouncedAvailabilityCheck(
                                                        activity.id,
                                                        newSchedule.date,
                                                        slot.time,
                                                      );
                                                    }
                                                  }}
                                                  disabled={
                                                    slot.available === false
                                                  }
                                                >
                                                  {slot.time}
                                                  {slot.available === false && (
                                                    <span className="ml-1 text-red-500">
                                                      •
                                                    </span>
                                                  )}
                                                </Button>
                                              ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                              <span className="text-red-500">
                                                •{" "}
                                              </span>
                                              Red dot indicates unavailable time
                                              slots
                                            </p>
                                          </div>
                                        ) : (
                                          <div>
                                            <Label className="text-sm font-medium mb-2 block">
                                              Preferred Time
                                            </Label>
                                            <Input
                                              type="time"
                                              value={
                                                currentSchedule.time_slot || ""
                                              }
                                              onChange={(e) => {
                                                setActivitySchedule(
                                                  activity.id,
                                                  {
                                                    ...currentSchedule,
                                                    time_slot: e.target.value,
                                                  },
                                                );
                                              }}
                                              className="max-w-xs"
                                            />
                                          </div>
                                        )}

                                        {/* Selected Schedule Summary */}
                                        {(currentSchedule.date ||
                                          currentSchedule.time_slot) && (
                                          <div className="p-3 bg-amber-50 rounded border border-amber-200">
                                            <p className="text-sm font-medium text-amber-800">
                                              Scheduled for:
                                            </p>
                                            <p className="text-sm text-amber-700">
                                              {currentSchedule.date &&
                                                formatDate(
                                                  currentSchedule.date,
                                                )}
                                              {currentSchedule.date &&
                                                currentSchedule.time_slot &&
                                                " at "}
                                              {currentSchedule.time_slot}
                                            </p>
                                          </div>
                                        )}

                                        {/* Availability Status - Show real-time availability feedback */}
                                        {availabilityData[
                                          `${activity.id}-${currentSchedule.date}-${currentSchedule.time_slot}`
                                        ] && (
                                          <div className="mt-2 text-sm">
                                            {availabilityChecking[
                                              `${activity.id}-${currentSchedule.date}-${currentSchedule.time_slot}`
                                            ] ? (
                                              <p className="text-gray-500">
                                                Checking availability...
                                              </p>
                                            ) : availabilityData[
                                                `${activity.id}-${currentSchedule.date}-${currentSchedule.time_slot}`
                                              ].available ? (
                                              <p className="text-green-600">
                                                <Check className="inline h-4 w-4 mr-1" />
                                                Available
                                              </p>
                                            ) : (
                                              <p className="text-red-600">
                                                <AlertCircle className="inline h-4 w-4 mr-1" />
                                                Not available
                                              </p>
                                            )}
                                          </div>
                                        )}
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

                      {selectedActivities.length > 0 && (
                        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Selected activities:</p>
                            <p className="text-lg font-semibold">
                              {selectedActivities.length}{" "}
                              {selectedActivities.length === 1
                                ? "activity"
                                : "activities"}
                            </p>
                          </div>

                          {/* Validate that all selected activities have schedules */}
                          {selectedActivities.some((actId) => {
                            const schedule = activitySchedules[actId];
                            return !schedule || !schedule.date;
                          }) && (
                            <Alert className="mt-3">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-sm">
                                Please schedule all selected activities before
                                continuing.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    onClick={prevStep}
                    variant="outline"
                    className="h-12 px-8 border border-amber-200 hover:bg-amber-50"
                  >
                    Back to Hotels
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="h-12 px-8 text-white bg-amber-700 hover:bg-amber-800"
                    disabled={
                      !skipOptions.skipActivities && 
                      selectedActivities.length > 0 && 
                      selectedActivities.some(actId => {
                        const schedule = activitySchedules[actId];
                        return !schedule || !schedule.date;
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
                          <p className="text-sm text-gray-600">
                            {destination.region || "Tanzania"}
                          </p>
                        </div>
                        <Badge className="ml-auto bg-amber-100 text-amber-800 border border-amber-200">
                          ${parseFloat(destination.cost || 0).toFixed(2)}
                        </Badge>
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
                                  ${selectedHotelObj.base_price_per_night}{" "}
                                  <span className="text-xs text-gray-500">
                                    / night
                                  </span>
                                </div>
                                <div className="text-sm text-amber-600 font-medium">
                                  $
                                  {selectedHotelObj.base_price_per_night *
                                    nights}{" "}
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
                                    ${selectedRoute.cost}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Multi-leg journey details for review */}
                          {selectedRoute.route_details &&
                            selectedRoute.route_details.legs &&
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
                                  {selectedRoute.route_details.legs.map(
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
                                    {activity.duration && (
                                      <p className="text-xs text-gray-500">
                                        Duration: {activity.duration}
                                      </p>
                                    )}
                                    {activity.description && (
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {activity.description}
                                      </p>
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
                            <span className="text-gray-600">
                              Destination Fee
                            </span>
                            <span className="font-medium">
                              {formatTZS(parseFloat(destination.cost || 0))}
                            </span>
                          </div>

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
                                  selectedActivitiesObj.reduce(
                                    (sum, act) =>
                                      sum + parseFloat(act.price || 0),
                                    0,
                                  ),
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
                              I agree to the terms and conditions and
                              cancellation policy
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
                                    includeTransport: !skipOptions.skipTransport,
                                    includeHotel: !skipOptions.skipHotel,
                                    includeActivities: !skipOptions.skipActivities,
                                    transportId: selectedTransportRoute || null,
                                    hotelId: selectedHotel || null,
                                    activityIds: selectedActivities || [],
                                    activitySchedules,
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
                            <Button
                              type="button"
                              onClick={() => setIsEnhancedPaymentOpen(true)}
                              className="w-full text-white bg-green-700 hover:bg-green-800"
                            >
                              <Wallet className="mr-2 h-4 w-4" />
                              Enhanced Payment
                            </Button>
                          </div>

                          <Button
                            type="button"
                            onClick={prevStep}
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
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                  />
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
              <div className="p-4 bg-amber-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span>Available Balance:</span>
                  <span className="font-semibold">
                    {formatTZS(savingsBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Required:</span>
                  <span className="font-semibold">{formatTZS(totalPrice)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center font-medium">
                  <span>Remaining Balance:</span>
                  <span
                    className={
                      savingsBalance >= totalPrice
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {formatTZS(savingsBalance - totalPrice)}
                  </span>
                </div>
                {savingsBalance < totalPrice && (
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

            <TabsContent value="crypto" className="space-y-4">
              {!isWalletConnected ? (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 mb-4">
                    Connect your MetaMask wallet to pay with cryptocurrency
                  </p>
                  <Button
                    onClick={async () => {
                      const result = await connectWallet();
                      if (result.success) {
                        toast.success("Wallet connected successfully!");
                      } else {
                        toast.error(result.error || "Failed to connect wallet");
                      }
                    }}
                    disabled={isConnectingWallet}
                    className="text-white bg-amber-700 hover:bg-amber-800"
                  >
                    {isConnectingWallet ? "Connecting..." : "Connect MetaMask"}
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span>Equivalent in ETH:</span>
                    <span className="font-semibold">
                      {(totalPrice / 9100000).toFixed(6)} ETH
                    </span>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="cryptoWallet">
                      Connected Wallet Address
                    </Label>
                    <div className="mt-1">
                      <Input
                        id="cryptoWallet"
                        type="text"
                        value={walletAddress || ""}
                        disabled
                        className="font-mono text-xs bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label className="mb-2 block">Payment Currency</Label>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center space-x-3 border rounded-md p-3 bg-white border-amber-300">
                        <svg
                          className="h-6 w-6 text-amber-600"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 2L5.25 12.05L12 15.85V2ZM12 15.85L18.75 12.05L12 2V15.85Z"
                            fill="currentColor"
                            stroke="currentColor"
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 22L5.25 12.5L12 16.3V22ZM12 16.3L18.75 12.5L12 22V16.3Z"
                            fill="currentColor"
                            stroke="currentColor"
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex-1">
                          <p className="font-medium">
                            USDT (via Smart Contract)
                          </p>
                          <p className="text-xs text-gray-500">
                            Recommended - {(totalPrice / 2600).toFixed(2)} USDT
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatTZS(totalPrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Alert className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-sm">
                      Payment will be processed through Smart Tour TZ blockchain
                      vault. Send USDT to the contract and confirm your
                      transaction.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
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
                (paymentMethod === "savings" && savingsBalance < totalPrice) ||
                !paymentMethod
              }
            >
              Pay {formatTZS(totalPrice)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Payment Dialog */}
      <EnhancedPaymentDialog
        isOpen={isEnhancedPaymentOpen}
        onClose={() => setIsEnhancedPaymentOpen(false)}
        amount={totalPrice}
        onPaymentSuccess={handleEnhancedPaymentSuccess}
        bookingId={null}
      />
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
