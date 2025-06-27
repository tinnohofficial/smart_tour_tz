"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, LogIn } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getUserData, clearAuthData, getAuthToken } from "../utils/auth";

export default function SessionExpiredPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any session data
    if (typeof window !== "undefined") {
      clearAuthData();

      // Show toast message
      toast.error("Your session has expired. Please sign in again.");
    }
  }, []);

  const handleLoginClick = () => {
    router.push("/login");
  };

  return (
    <div className="container max-w-lg mx-auto py-16">
      <Card className="border-amber-100 shadow-md">
        <CardHeader className="space-y-2 pb-2">
          <div className="mx-auto bg-amber-100 p-3 rounded-full">
            <Clock className="h-10 w-10 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center pt-2">
            Session Expired
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center pb-6">
          <p className="text-gray-600">
            Your session has expired due to inactivity or token expiration.
          </p>
          <p className="text-gray-500 text-sm mt-4">
            For security reasons, you&apos;ve been logged out. Please sign in
            again to continue.
          </p>
        </CardContent>

        <CardFooter className="flex justify-center border-t pt-6">
          <Button
            onClick={handleLoginClick}
            className="w-full sm:w-auto bg-amber-700 hover:bg-amber-800 text-white"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign In Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
