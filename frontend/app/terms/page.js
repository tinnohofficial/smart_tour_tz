"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TermsAndConditions() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Button
          variant="outline"
          className="border-amber-700 text-amber-700 hover:bg-amber-50 mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-4xl font-bold text-amber-900 mb-4">
          Terms and Conditions
        </h1>
        <p className="text-amber-700 text-lg">
          Please read these terms carefully before booking your tour with Smart Tour Tanzania.
        </p>
      </div>

      <Card className="border-amber-200 mb-6">
        <CardHeader className="bg-amber-50">
          <CardTitle className="text-amber-900 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-700" />
            Important Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-amber-800">
            By proceeding with your booking, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">1. No Refund Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800">
              All payments are final and non-refundable. Once you have completed your payment, your money will not be returned under any circumstances. We strongly advise you to carefully consider your booking before making payment.
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">2. No Rescheduling</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800">
              Tour dates cannot be changed or rescheduled once your booking is confirmed. Please ensure your travel dates are correct before completing your booking. We do not accommodate date changes for any reason, including personal emergencies or unforeseen circumstances.
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">3. Transportation Punctuality</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800">
              You must arrive at the designated transport boarding site on time. There are absolutely no second chances if you miss your scheduled departure. Late arrivals will not be accommodated, and no alternative transportation will be provided.
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">4. Booking Confirmation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800">
              Your booking is only confirmed upon full payment. Partial payments do not guarantee reservation of services. All selected services (transport, accommodation, activities) are subject to availability at the time of payment.
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">5. Personal Responsibility</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800">
              You are responsible for ensuring you have all required travel documents, insurance, and meet health requirements for your tour. Smart Tour Tanzania is not liable for any issues arising from inadequate preparation on your part.
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">6. Service Modifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-800">
              While we strive to deliver services as described, Smart Tour Tanzania reserves the right to make minor modifications to itineraries due to weather, safety concerns, or operational requirements. Such changes do not entitle you to compensation or refunds.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 p-6 bg-amber-50 rounded-lg border border-amber-200">
        <h3 className="text-xl font-bold text-amber-900 mb-3">
          Contact Information
        </h3>
        <p className="text-amber-800 mb-2">
          If you have any questions about these terms, please contact us before making your booking.
        </p>
        <p className="text-amber-700 text-sm">
          Email: support@smarttourtanzania.com | Phone: +255 XXX XXX XXX
        </p>
      </div>

      <div className="text-center mt-8">
        <Button 
          className="bg-amber-700 text-white hover:bg-amber-800 px-8 py-3"
          onClick={() => router.back()}
        >
          I Understand - Go Back
        </Button>
      </div>
    </div>
  );
}