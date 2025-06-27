"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Calendar,
  LogOut,
  Star,
  User,
  Menu,
  X,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/app/store/layoutStore";
import { RouteProtection } from "@/components/route-protection";
import { publishAuthChange } from "@/components/Navbar";
import { tourGuideService, apiUtils } from "@/app/services/api";
import { useEffect, useState } from "react";
import { getUserData, clearAuthData, getAuthToken } from "../utils/auth";

export default function TourGuideLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarOpen, setIsSidebarOpen } = useLayoutStore();
  const [userStatus, setUserStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkUserProfile = async () => {
      setIsLoading(true);
      try {
        // Check if we're in browser environment
        if (typeof window === "undefined") {
          return;
        }

        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        try {
          const data = await tourGuideService.getProfile();
          setUserStatus(data.status || "pending_profile");
          setHasProfile(true);
        } catch (error) {
          if (error.response?.status === 404) {
            setUserStatus("pending_profile");
            setHasProfile(false);
          } else if (
            error.response?.status === 401 ||
            error.response?.status === 403 ||
            error.isAuthError
          ) {
            // Handle authentication errors gracefully
            console.log("Authentication error, redirecting to login");
            if (typeof window !== "undefined") {
              clearAuthData();
            }
            router.push("/login");
            return;
          } else {
            console.error("Error fetching profile:", error);
            // Don't crash the app, just set a default state
            setUserStatus("pending_profile");
            setHasProfile(false);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Don't crash the app, set safe defaults
        setUserStatus("pending_profile");
        setHasProfile(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserProfile();
  }, [pathname, router]);

  const navItems = [
    {
      href: "/tour-guide/dashboard",
      label: "Dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
      active: pathname === "/tour-guide/dashboard",
      show: userStatus === "active",
    },
    {
      href: "/tour-guide/bookings",
      label: "Assigned Tours",
      icon: <Calendar className="h-5 w-5" />,
      active: pathname === "/tour-guide/bookings",
      show: userStatus === "active",
    },
    {
      href: "/tour-guide/profile",
      label: "Guide Profile",
      icon: <User className="h-5 w-5" />,
      active: pathname === "/tour-guide/profile",
      show: userStatus === "active",
    },
    {
      href: "/tour-guide/pending-status",
      label: "Application Status",
      icon: <Star className="h-5 w-5" />,
      active: pathname === "/tour-guide/pending-status",
      show: userStatus === "pending_approval" || userStatus === "rejected",
    },
    {
      href: "/tour-guide/password",
      label: "Change Password",
      icon: <Lock className="h-5 w-5" />,
      active: pathname === "/tour-guide/password",
      show: true,
    },
  ];

  const shouldRestrictAccess = () => {
    if (isLoading) return true;

    if (!hasProfile && userStatus === "pending_profile") {
      return !["/tour-guide/complete-profile", "/tour-guide/password"].includes(
        pathname,
      );
    }

    if (
      hasProfile &&
      (userStatus === "pending_approval" || userStatus === "rejected")
    ) {
      return !["/tour-guide/pending-status", "/tour-guide/password"].includes(
        pathname,
      );
    }

    if (userStatus === "active") {
      return ["/tour-guide/complete-profile"].includes(pathname);
    }

    return false;
  };

  const handleLogout = () => {
    try {
      // Clear authentication data
      if (typeof window !== "undefined") {
        clearAuthData();
      }

      // Notify navbar about auth state change
      publishAuthChange();

      // Navigate to login page immediately
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      // Still navigate to login even if there's an error
      router.push("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Smart Tour Tanzania</p>
        </div>
      </div>
    );
  }

  return (
    <RouteProtection allowedRoles={["tour_guide"]}>
      <div className="flex h-screen bg-amber-50">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-64 transform bg-amber-900 transition-transform duration-200 ease-in-out md:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-between border-b border-amber-800 px-4">
              <div className="flex items-center">
                <Star className="h-6 w-6 text-white mr-2" />
                <h1 className="text-xl font-semibold text-white">Tour Guide</h1>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-amber-200 hover:text-white"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-4 px-2 py-4">
              {navItems
                .filter((item) => item.show)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      item.active
                        ? "bg-amber-800 text-white"
                        : "text-amber-200 hover:bg-amber-800/50 hover:text-white",
                    )}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
            </nav>

            <div className="border-t border-amber-800 p-4">
              <button
                className="flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-amber-200 hover:bg-amber-800/50 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col bg-white md:pl-64">
          <header className="sticky top-0 left-0 z-10 bg-transparent shadow-sm md:hidden">
            <div className="flex h-16 items-center justify-between px-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>

              <div className="ml-auto flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" alt="User" />
                  <AvatarFallback>T</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-6">
            {shouldRestrictAccess() ? (
              <div className="text-center py-10">
                {!hasProfile && userStatus === "pending_profile" ? (
                  <>
                    <User className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700">
                      Complete Your Guide Profile
                    </h2>
                    <p className="text-gray-500 mb-6">
                      You need to complete your tour guide profile to access
                      this page.
                    </p>
                    <Button
                      onClick={() =>
                        router.push("/tour-guide/complete-profile")
                      }
                      className="bg-amber-700 hover:bg-amber-800 text-white"
                    >
                      Complete Profile Now
                    </Button>
                  </>
                ) : hasProfile &&
                  (userStatus === "pending_approval" ||
                    userStatus === "rejected") ? (
                  <>
                    <Star className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700">
                      Check Your Application Status
                    </h2>
                    <p className="text-gray-500 mb-6">
                      View your application status and submitted details.
                    </p>
                    <Button
                      onClick={() => router.push("/tour-guide/pending-status")}
                      className="bg-amber-700 hover:bg-amber-800"
                    >
                      View Application Status
                    </Button>
                  </>
                ) : userStatus === "active" ? (
                  <>
                    <User className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700">
                      Access Restricted
                    </h2>
                    <p className="text-gray-500 mb-6">
                      This page is not available for approved tour guides.
                    </p>
                    <Button
                      onClick={() => router.push("/tour-guide/dashboard")}
                      className="bg-amber-700 hover:bg-amber-800"
                    >
                      Go to Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <User className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700">
                      Access Restricted
                    </h2>
                    <p className="text-gray-500 mb-6">
                      You don't have permission to access this page.
                    </p>
                  </>
                )}
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </RouteProtection>
  );
}
