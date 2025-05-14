"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Calendar, CreditCard, LogOut, Star, User, Menu, X, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useLayoutStore } from "./layoutStore"
import { PendingApprovalAlert } from "@/components/pending-approval-alert"
import { RouteProtection } from "@/components/route-protection"
import { useEffect, useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function TourGuideLayout({ children }) {
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
        const response = await fetch(`${API_URL}/tour-guides/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setUserStatus(data.status || 'pending_profile')
          setHasProfile(true)
          
          // Redirect away from profile page if status is pending_approval
          if (data.status === 'pending_approval' && pathname === '/tour-guide/profile') {
            router.push('/tour-guide/dashboard')
          }
        } else if (response.status === 404) {
          // User has no profile yet
          setUserStatus('pending_profile')
          setHasProfile(false)
          
          // If not on dashboard or password page and has no profile, redirect to dashboard
          if (!pathname.includes('/dashboard') && !pathname.includes('/password')) {
            router.push('/tour-guide/dashboard')
          }
        } else if (response.status === 401) {
          // Unauthorized, redirect to login
          localStorage.removeItem('token')
          localStorage.removeItem('userData')
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
      href: "/tour-guide/dashboard",
      label: "Dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
      active: pathname === "/tour-guide/dashboard",
      // Always show dashboard
      show: true
    },
    {
      href: "/tour-guide/bookings",
      label: "Assigned Tours",
      icon: <Calendar className="h-5 w-5" />,
      active: pathname === "/tour-guide/bookings",
      // Only show bookings if user has completed profile and is active
      show: userStatus === 'active'
    },
    {
      href: "/tour-guide/profile",
      label: "Profile",
      icon: <User className="h-5 w-5" />,
      active: pathname === "/tour-guide/profile",
      // Only show profile if profile is active or not yet submitted (pending_profile)
      show: userStatus === 'active' || userStatus === 'pending_profile'
    },
    {
      href: "/tour-guide/password",
      label: "Change Password",
      icon: <Lock className="h-5 w-5" />,
      active: pathname === "/tour-guide/password",
      // Always show password change
      show: true
    }
  ]

  // Allow access only to dashboard and password page if user hasn't completed profile
  const shouldRestrictAccess = () => {
    if (isLoading) return true // Don't render content while checking
    
    if (!hasProfile) {
      return !['/tour-guide/dashboard', '/tour-guide/password'].includes(pathname)
    }
    
    if (userStatus === 'pending_approval') {
      // Do not allow access to profile page when in pending approval state
      return pathname === '/tour-guide/profile' || (!['/tour-guide/dashboard', '/tour-guide/password'].includes(pathname))
    }
    
    return false
  }

  const handleLogout = () => {
    try {
      // Clear all auth-related data from localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('userData')
      localStorage.removeItem('role')
      
      // Add a small delay before redirecting to ensure storage is cleared
      setTimeout(() => {
        // Redirect to login page
        router.push('/login?message=You have been logged out successfully')
      }, 100)
    } catch (error) {
      console.error('Logout error:', error)
      // Ensure navigation to login even if there was an error
      router.push('/login')
    }
  }

  // Show loading state while checking profile
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <RouteProtection allowedRoles={['tour_guide']}>
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
              <h1 className="text-xl font-semibold text-white">Tour Guide Portal</h1>
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
                  <AvatarFallback>TG</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 px-6 py-6">
            {/* Show pending approval alert if needed */}
            {userStatus !== 'active' && (
              <PendingApprovalAlert 
                userRole="tour_guide" 
                hasCompletedProfile={hasProfile && userStatus !== 'pending_profile'} 
              />
            )}

            {/* Show content based on access restrictions */}
            {shouldRestrictAccess() ? (
              pathname !== '/tour-guide/dashboard' && pathname !== '/tour-guide/password' && (
                <div className="text-center py-10">
                  {userStatus === 'pending_approval' && pathname === '/tour-guide/profile' ? (
                    // Show message specific to pending approval users trying to access profile
                    <div>
                      <User className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h2 className="text-xl font-semibold text-gray-700">Profile Under Review</h2>
                      <p className="text-gray-500 mb-6">Your profile is currently under review and cannot be modified. You will be able to access your profile again once it's approved.</p>
                      <Button 
                        onClick={() => router.push('/tour-guide/dashboard')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Go to Dashboard
                      </Button>
                    </div>
                  ) : (
                    // Standard message for other restricted access
                    <div>
                      <User className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h2 className="text-xl font-semibold text-gray-700">Please complete your profile</h2>
                      <p className="text-gray-500 mb-6">You need to complete your tour guide profile before accessing this page.</p>
                      {userStatus !== 'pending_approval' && (
                        <Button 
                          onClick={() => router.push('/tour-guide/profile')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Complete Profile
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </RouteProtection>
  )
}
