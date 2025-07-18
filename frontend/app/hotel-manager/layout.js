"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  Hotel,
  Bed,
  LogOut,
  Menu,
  X,
  Lock,
  User,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/app/store/layoutStore";

import { RouteProtection } from "@/components/route-protection";
import { publishAuthChange } from "@/components/Navbar";
import { hotelManagerService, apiUtils } from "@/app/services/api";
import { useEffect, useState } from "react";
import { getUserData, clearAuthData, getAuthToken } from "../utils/auth";

export default function HotelManagerLayout({ children }) {
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
          const data = await hotelManagerService.getProfile();
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
      href: "/hotel-manager/dashboard",
      label: "Dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
      active: pathname === "/hotel-manager/dashboard",
      show: userStatus === "active",
    },
    {
      href: "/hotel-manager/bookings",
      label: "Manage Bookings",
      icon: <Bed className="h-5 w-5" />,
      active: pathname === "/hotel-manager/bookings",
      show: userStatus === "active",
    },
    {
      href: "/hotel-manager/profile",
      label: "Hotel Profile",
      icon: <Building className="h-5 w-5" />,
      active: pathname === "/hotel-manager/profile",
      show: userStatus === "active",
    },
    {
      href: "/hotel-manager/pending-status",
      label: "Application Status",
      icon: <User className="h-5 w-5" />,
      active: pathname === "/hotel-manager/pending-status",
      show: userStatus === "pending_approval" || userStatus === "rejected",
    },
    {
      href: "/hotel-manager/password",
      label: "Change Password",
      icon: <Lock className="h-5 w-5" />,
      active: pathname === "/hotel-manager/password",
      // Always show password change
      show: true,
    },
  ];

  const shouldRestrictAccess = () => {
    if (isLoading) return true;

    // If no profile exists, only allow complete-profile and password pages
    if (!hasProfile && userStatus === "pending_profile") {
      return ![
        "/hotel-manager/complete-profile",
        "/hotel-manager/password",
      ].includes(pathname);
    }

    // If profile exists but pending approval or rejected, only allow pending-status and password
    if (
      hasProfile &&
      (userStatus === "pending_approval" || userStatus === "rejected")
    ) {
      return ![
        "/hotel-manager/pending-status",
        "/hotel-manager/password",
      ].includes(pathname);
    }

    // If active, restrict access to complete-profile only
    if (userStatus === "active") {
      return ["/hotel-manager/complete-profile"].includes(pathname);
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

  // Show loading state while checking profile
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
    <RouteProtection allowedRoles={["hotel_manager"]}>
      <div className="flex h-screen bg-amber-50">
        {/* Mobile sidebar backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-64 transform bg-amber-900 transition-transform duration-200 ease-in-out md:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-between border-b border-amber-800 px-4">
              <div className="flex items-center">
                <Hotel className="h-6 w-6 text-white mr-2" />
                <h1 className="text-xl font-semibold text-white">
                  Hotel Manager
                </h1>
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

        {/* Main content */}
        <div className="flex flex-1 flex-col bg-white md:pl-64">
          {/* Top navigation */}
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
                  <AvatarFallback>H</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 px-6 py-6">
            {shouldRestrictAccess() ? (
              <div className="text-center py-10">
                {!hasProfile && userStatus === "pending_profile" ? (
                  <>
                    <Building className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700">
                      Complete Your Hotel Profile
                    </h2>
                    <p className="text-gray-500 mb-6">
                      You need to complete your hotel profile to access this
                      page.
                    </p>
                    <Button
                      onClick={() =>
                        router.push("/hotel-manager/complete-profile")
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
                    <User className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700">
                      Check Your Application Status
                    </h2>
                    <p className="text-gray-500 mb-6">
                      View your application status and submitted details.
                    </p>
                    <Button
                      onClick={() =>
                        router.push("/hotel-manager/pending-status")
                      }
                      className="bg-amber-700 hover:bg-amber-800"
                    >
                      View Application Status
                    </Button>
                  </>
                ) : userStatus === "active" ? (
                  <>
                    <Building className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-700">
                      Access Restricted
                    </h2>
                    <p className="text-gray-500 mb-6">
                      This page is not available for approved hotel managers.
                    </p>
                    <Button
                      onClick={() => router.push("/hotel-manager/dashboard")}
                      className="bg-amber-700 hover:bg-amber-800"
                    >
                      Go to Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <Building className="h-12 w-12 text-amber-500 mx-auto mb-4" />
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
