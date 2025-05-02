"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Calendar, Hotel, Ticket, User, Users } from "lucide-react"
import Link from "next/link"
import {create} from 'zustand'

// Zustand store for managing user role and name
const useDashboardStore = create((set) => ({
  userRole: "",
  userName: "",
  userStatus: "active",
  setUserRole: (role) => set({ userRole: role }),
  setUserName: (name) => set({ userName: name }),
  setUserStatus: (status) => set({ userStatus: status }),
}));


export default function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const completeProfile = searchParams.get("completeProfile")
  const role = searchParams.get("role")
  const { userRole, userName, setUserRole, setUserName } = useDashboardStore(); // Use Zustand store

  useEffect(() => {
    // In here I'll fetch the user's role and profile completion status from authentication system
    // for now i'll just use a random role for demo
    if (role) {
      setUserRole(role);
    } else {
      const roles = ["tourist", "tour_guide", "hotel_manager", "travel_agent", "admin"];
      setUserRole(roles[Math.floor(Math.random() * roles.length)]);
    }

    // Mock user name
    setUserName("Eddie Thinker");
  }, [role, setUserRole, setUserName]); 

  const roleDisplayName = () => {
    switch (userRole) {
      case "tour_guide":
        return " Tour Guide";
      case "hotel_manager":
        return " Hotel Manager";
      case "travel_agent":
        return " Travel Agent";
      default:
        return " tourist";
    }
  }

  const getDashboardContent = () => {
    // If profile needs completion, only show profile management option
    if (completeProfile === "true") {
      return (
        <div>
          <h2 className="text-xl mb-2">{roleDisplayName()} Dashboard</h2>
          <div className="grid grid-cols-1 gap-4">
            <Button className="w-full bg-white border hover:bg-blue-100" asChild>
              <Link href={`/profile/${userRole.replace('_', '')}`}>
                <User className="mr-2 h-4 w-4" />Complete Your Profile
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    // Regular dashboard content based on role
    switch (userRole) {
      case "tourist":
        return (
          <div>
            <h2 className="text-xl mb-2">Tourist Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="w-full bg-white border border-blue-100 hover:bg-blue-100" asChild>
                <Link href="/locations">Browse Locations</Link>
              </Button>
              <Button className="w-full bg-white border border-blue-100 hover hover:bg-blue-100" variant="outline">
                View Bookings
              </Button>
              <Button className="w-full text-white bg-blue-600 hover:bg-blue-700" variant="outline">
                Manage Payments
              </Button>
            </div>
          </div>
        );
      case "tour_guide":
        return (
          <div>
            <h2 className="text-xl mb-2">Tour Guide Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="w-full bg-white border hover:bg-blue-100" asChild>
                <Link href="/profile/tourGuide"><User className="mr-2 h-4 w-4" />Manage Profile</Link>
              </Button>
              <Button className="w-full text-white bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/dashboard/tour-guide/bookings">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Tour Schedule
                </Link>
              </Button>
            </div>
          </div>
        );
      case "hotel_manager":
        return (
          <div>
            <h2 className="text-xl mb-2">Hotel Manager Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="w-full bg-white border hover:bg-blue-100" asChild>
                <Link href="/hotel-manager/profile">Manage Hotel Profile</Link>
              </Button>
              <Button className="w-full text-white bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/dashboard/hotel-manager/bookings">
                  <Hotel className="mr-2 h-4 w-4" />
                  Process Hotel Bookings
                </Link>
              </Button>
            </div>
          </div>
        );
      case "travel_agent":
        return (
          <div>
            <h2 className="text-xl mb-2">Travel Agent Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="w-full bg-white border hover:bg-blue-100" asChild>
                <Link href="/profile/travelAgent">Manage Agency Profile</Link>
              </Button>
              <Button className="w-full text-white bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/dashboard/travel-agent/bookings">
                  <Ticket className="mr-2 h-4 w-4" />
                  Process Travel Bookings
                </Link>
              </Button>
            </div>
          </div>
        );
      case "admin":
        return (
          <div>
            <h2 className="text-xl mb-2">Administrator Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="w-full bg-white border hover:bg-blue-100">Approve Applications</Button>
              <Button className="w-full text-white bg-blue-600 hover:bg-blue-700" variant="outline">
              <Users className="mr-2 h-4 w-4" />Manage Users
              </Button>
            </div>
          </div>
        );
      default:
        return null; 
    }
  };


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Profile Completion Alert */}
      {completeProfile === "true" && (
        <Alert variant="warning" className="mb-6 border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Complete Your Profile</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Please complete your profile to access all features.
            <div className="mt-2">
              <Button
                onClick={() => router.push(`/profile/${userRole}`)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Complete Profile Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Welcome, {userName}!</CardTitle>
          <CardDescription>
            You are logged in as a{roleDisplayName()}
          </CardDescription>
        </CardHeader>        <CardContent>
          {getDashboardContent()}
        </CardContent>
      </Card>
    </div>
  )
}