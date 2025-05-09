"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { BarChart3, Hotel, Bed, LogOut, Menu, X, Lock, User, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useLayoutStore } from "./layoutStore"
import { PendingApprovalAlert } from "@/components/pending-approval-alert"
import { useEffect, useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function HotelManagerLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isSidebarOpen, setIsSidebarOpen } = useLayoutStore()
  const [userStatus, setUserStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)

  useEffect(() => {
    const checkUserProfile = async () => {
      setIsLoading(true)
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          // Redirect to login if no token
          router.push('/login')
          return
        }

        // Fetch user profile to check status
        const response = await fetch(`${API_URL}/hotels/manager/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setUserStatus(data.status || 'pending_profile')
          setHasProfile(true)
        } else if (response.status === 404) {
          // User has no profile yet
          setUserStatus('pending_profile')
          setHasProfile(false)
          
          // If not on dashboard or password page and has no profile, redirect to dashboard
          if (!pathname.includes('/dashboard') && !pathname.includes('/password')) {
            router.push('/hotel-manager/dashboard')
          }
        } else if (response.status === 401) {
          // Unauthorized, redirect to login
          localStorage.removeItem('token')
          router.push('/login')
          return
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserProfile()
  }, [pathname, router])

  const navItems = [
    {
      href: "/hotel-manager/dashboard",
      label: "Dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
      active: pathname === "/hotel-manager/dashboard",
      // Always show dashboard
      show: true
    },
    {
      href: "/hotel-manager/bookings",
      label: "Manage Bookings",
      icon: <Bed className="h-5 w-5" />,
      active: pathname === "/hotel-manager/bookings",
      // Only show bookings if user has completed profile and is active
      show: userStatus === 'active'
    },
    {
      href: "/hotel-manager/profile",
      label: "Hotel Profile",
      icon: <Building className="h-5 w-5" />,
      active: pathname === "/profile/hotelManager",
      // Only show profile if user has a profile or if they are active
      show: hasProfile || userStatus === 'active'
    },
    {
      href: "/hotel-manager/password",
      label: "Change Password",
      icon: <Lock className="h-5 w-5" />,
      active: pathname === "/hotel-manager/password",
      // Always show password change
      show: true
    }
  ]

  // Allow access only to dashboard and password page if user hasn't completed profile
  const shouldRestrictAccess = () => {
    if (isLoading) return true // Don't render content while checking
    
    if (!hasProfile) {
      return !['/hotel-manager/dashboard', '/hotel-manager/password'].includes(pathname)
    }
    
    if (userStatus === 'pending_approval') {
      return !['/hotel-manager/dashboard', '/hotel-manager/password'].includes(pathname)
    }
    
    return false
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  // Show loading state while checking profile
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Smart Tour Tanzania</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-gray-900 transition-transform duration-200 ease-in-out md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
            <div className="flex items-center">
              <Hotel className="h-6 w-6 text-blue-400 mr-2" />
              <h1 className="text-xl font-semibold text-white">Hotel Manager</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-400 hover:text-white"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-4 px-2 py-4">
            {navItems.filter(item => item.show).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  item.active ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
                )}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-gray-800 p-4">
            <button 
              className="flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
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
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
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
          {/* Show pending approval alert if needed */}
          {userStatus !== 'active' && (
            <PendingApprovalAlert 
              userRole="hotel_manager" 
              hasCompletedProfile={hasProfile && userStatus !== 'pending_profile'} 
            />
          )}

          {/* Show content based on access restrictions */}
          {shouldRestrictAccess() ? (
            pathname !== '/hotel-manager/dashboard' && pathname !== '/hotel-manager/password' && (
              <div className="text-center py-10">
                <Building className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">Please complete your profile</h2>
                <p className="text-gray-500 mb-6">You need to complete your hotel profile before accessing this page.</p>
                <Button 
                  onClick={() => router.push('/profile/hotelManager')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Complete Profile
                </Button>
              </div>
            )
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}