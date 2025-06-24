"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getUserData, clearAuthData, getAuthToken } from "../app/utils/auth";

/**
 * A component that handles route protection by checking authentication and role permissions
 * Simplified to rely on token presence and user data in localStorage
 */
export function RouteProtection({ allowedRoles = [], children }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function checkAuth() {
      try {
        // Check if we're in browser environment
        if (typeof window === "undefined") {
          setIsLoading(false);
          return;
        }

        // Check if token exists in localStorage
        const token = getAuthToken();
        if (!token) {
          toast.error("You must be signed in to access this page");
          router.push("/login");
          return;
        }

        // Validate token format (basic check)
        try {
          const parts = token.split(".");
          if (parts.length !== 3) {
            throw new Error("Invalid token format");
          }
          // Try to decode the payload to check if token is malformed
          JSON.parse(atob(parts[1]));
        } catch (tokenError) {
          clearAuthData();
          toast.error("Invalid authentication token. Please sign in again.");
          router.push("/login");
          return;
        }

        // Get user data from localStorage
        const storedUserData = getUserData();
        if (!storedUserData) {
          clearAuthData();
          toast.error("Authentication error. Please sign in again.");
          router.push("/login");
          return;
        }

        let userData;
        try {
          userData = JSON.parse(storedUserData);
        } catch (parseError) {
          clearAuthData();
          toast.error("Authentication error. Please sign in again.");
          router.push("/login");
          return;
        }

        // Check if user has one of the allowed roles
        if (allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
          toast.error("You don't have permission to access this page");
          router.push("/forbidden");
          return;
        }

        // User is authorized, show the content
        setIsAuthorized(true);
      } catch (error) {
        if (typeof window !== "undefined") {
          clearAuthData();
        }
        toast.error("Authentication error. Please sign in again.");
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [allowedRoles, router]);

  // While checking authorization, show a loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-amber-700" />
          <p className="text-gray-500">Verifying your access...</p>
        </div>
      </div>
    );
  }

  // Only render the children if the user is authorized
  return isAuthorized ? children : null;
}
