"use client";

import React, { useEffect, useState } from "react";
import CartComponent from "../../components/CartComponent";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in and is a tourist
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("userData");

      if (!token || !userData) {
        toast.error("Please log in to access your cart");
        router.push("/login");
        return;
      }

      try {
        const user = JSON.parse(userData);
        if (user.role !== "tourist") {
          toast.error("Cart is only available for tourists");
          router.push("/login");
          return;
        }
        
        setIsAuthorized(true);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("userData");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect to login
  }





  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Cart
          </h1>
          <p className="text-gray-600">
            Review your selected destinations and complete your booking
          </p>
        </div>

        <CartComponent />
      </div>
    </div>
  );
}
