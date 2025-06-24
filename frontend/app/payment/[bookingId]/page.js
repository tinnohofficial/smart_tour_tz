"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  CreditCard,
  Wallet,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatTZS } from "@/app/utils/currency";
import { getUserData, clearAuthData, getAuthToken } from "../../utils/auth";

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId;

  const [booking, setBooking] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("external");

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const loadBookingDetails = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/bookings/my-bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const bookings = await response.json();
        const targetBooking = bookings.find(
          (b) => b.id === parseInt(bookingId),
        );

        if (!targetBooking) {
          toast.error("Booking not found");
          router.push("/my-bookings");
          return;
        }

        if (targetBooking.status !== "pending_payment") {
          toast.error("This booking is not pending payment");
          router.push("/my-bookings");
          return;
        }

        setBooking(targetBooking);
      } else {
        toast.error("Failed to load booking details");
        router.push("/my-bookings");
      }
    } catch (error) {
      console.error("Error loading booking:", error);
      toast.error("Error loading booking details");
      router.push("/my-bookings");
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, bookingId, router]);

  const loadUserBalance = useCallback(async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/users/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.balance || 0);
      }
    } catch (error) {
      console.error("Error loading user balance:", error);
    }
  }, [API_URL]);

  useEffect(() => {
    const token = getAuthToken();
    const userData = getUserData();

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const parsedUser = userData;
    if (parsedUser.role !== "tourist") {
      router.push("/forbidden");
      return;
    }

    loadBookingDetails();
    loadUserBalance();
  }, [bookingId, router, loadBookingDetails, loadUserBalance]);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/bookings/${bookingId}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Payment successful!");
        router.push("/my-bookings");
      } else {
        toast.error(data.message || "Payment failed");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Payment processing error");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateNights = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-700 mx-auto" />
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Booking Not Found</AlertTitle>
          <AlertDescription className="text-red-700">
            The requested booking could not be found or is not available for
            payment.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/my-bookings")}
          className="border-amber-200 hover:bg-amber-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bookings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-700" />
                Payment for Booking #{booking.id}
              </CardTitle>
              <CardDescription>
                Complete your payment to confirm this booking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Booking Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Destination</p>
                      <p className="text-gray-600">
                        {booking.destination?.name || "Not specified"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Duration</p>
                      <p className="text-gray-600">
                        {formatDate(booking.start_date)} -{" "}
                        {formatDate(booking.end_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Services</p>
                      <p className="text-gray-600">
                        {booking.items ? booking.items.length : 0} items
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-4">Select Payment Method</h3>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="external" id="external" />
                      <Label
                        htmlFor="external"
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <CreditCard className="w-4 h-4" />
                        <div>
                          <p className="font-medium">Credit/Debit Card</p>
                          <p className="text-sm text-gray-500">
                            Pay with your card via secure payment
                          </p>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="savings" id="savings" />
                      <Label
                        htmlFor="savings"
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <Wallet className="w-4 h-4" />
                        <div>
                          <p className="font-medium">Account Balance</p>
                          <p className="text-sm text-gray-500">
                            Available: {formatTZS(userBalance)}
                          </p>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {paymentMethod === "savings" &&
                  userBalance < booking.total_cost && (
                    <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">
                        Insufficient Balance
                      </AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        Your account balance ({formatTZS(userBalance)}) is less
                        than the booking total ({formatTZS(booking.total_cost)}
                        ). Please add funds to your account or use a different
                        payment method.
                      </AlertDescription>
                    </Alert>
                  )}
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => router.push("/my-bookings")}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={
                    isProcessing ||
                    (paymentMethod === "savings" &&
                      userBalance < booking.total_cost)
                  }
                  className="bg-amber-700 hover:bg-amber-800 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Pay {formatTZS(booking.total_cost)}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {booking.items &&
                  booking.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="capitalize">
                        {item.item_name || item.item_type?.replace("_", " ")}
                      </span>
                      <span>{formatTZS(item.cost)}</span>
                    </div>
                  ))}
              </div>

              <Separator />

              <div className="flex justify-between items-center font-medium">
                <span>Total Amount</span>
                <span className="text-lg">{formatTZS(booking.total_cost)}</span>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  After payment, our partners will arrange your services and
                  you&apos;ll receive confirmation details.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                If you have any questions about your booking or payment, our
                support team is here to help.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push("/contact")}
                className="w-full border-amber-200 hover:bg-amber-50"
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
