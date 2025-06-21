"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, User, LogOut, Settings, ShoppingCart } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useCartStore } from "../app/store/cartStore"

// Function to publish auth change events (exported for use in other components)
export function publishAuthChange() {
  if (typeof window !== 'undefined') {
    // Dispatch a custom event that the Navbar can listen for
    window.dispatchEvent(new Event('authStateChanged'));
  }
}

export function Navbar() {
  const [user, setUser] = useState(null)
  const [showNavbar, setShowNavbar] = useState(true)
  const router = useRouter()
  
  // Get cart item count for tourists
  const { getCartItemCount, fetchCart } = useCartStore()

  // Function to check authentication status
  const checkUser = () => {
    try {
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem("userData")
        if (userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          
          // Hide navbar for specific roles
          if (['admin', 'tour_guide', 'hotel_manager', 'travel_agent'].includes(parsedUser.role)) {
            setShowNavbar(false)
          } else {
            setShowNavbar(true)
          }
        } else {
          setUser(null)
          setShowNavbar(true)
        }
      }
    } catch (error) {
      console.error("Error checking user authentication:", error)
      // Clear potentially corrupted data
      if (typeof window !== 'undefined') {
        localStorage.removeItem("userData")
        localStorage.removeItem("token")
      }
      setUser(null)
      setShowNavbar(true)
    }
  }

  // Check authentication status on component mount and when auth state changes
  useEffect(() => {
    // Check on mount
    checkUser()
    
    // Only add event listeners if we're in browser environment
    if (typeof window !== 'undefined') {
      // Listen for storage events (for when user logs in/out in another tab)
      window.addEventListener('storage', checkUser)
      
      // Listen for custom auth state change events
      window.addEventListener('authStateChanged', checkUser)
      
      return () => {
        window.removeEventListener('storage', checkUser)
        window.removeEventListener('authStateChanged', checkUser)
      }
    }
  }, [])

  // Fetch cart for tourists
  useEffect(() => {
    if (user && user.role === 'tourist') {
      fetchCart().catch(() => {
        // Silently handle cart fetch errors
      })
    }
  }, [user, fetchCart])

  // Handle logout
  const handleLogout = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem("token")
        localStorage.removeItem("userData")
        localStorage.removeItem("loginTimestamp")
      }
      setUser(null)
      toast.success("You've been successfully logged out")
      // Notify other components about auth state change
      publishAuthChange()
      router.push("/")
    } catch (error) {
      console.error("Error during logout:", error)
      // Still reset user state and navigate
      setUser(null)
      router.push("/")
    }
  }

  // Extract name from email address
  const extractNameFromEmail = (email) => {
    if (!email) return "User"
    
    // Extract the part before @ symbol
    const namePart = email.split('@')[0]
    
    // Split by common separators (dot, underscore, dash, plus)
    const nameParts = namePart.split(/[._\-+]/)
    
    // Capitalize first letter of each part
    const formattedName = nameParts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ')
    
    return formattedName
  }

  // Get username from email
  const getUserName = () => {
    if (!user || !user.email) return "User"
    return extractNameFromEmail(user.email)
  }

  // If navbar should be hidden, return null
  if (!showNavbar) {
    return null
  }

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-amber-700">
            Smart Tour
          </Link>
          <div className="hidden md:flex space-x-4 items-center">
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>            <Link href="/locations">
              <Button variant="ghost">Locations</Button>
            </Link>
            
            {user && user.role === 'tourist' && (
              <Link href="/ai-suggestions">
                <Button variant="ghost" className="text-amber-700 hover:bg-amber-50">
                  AI Suggestions
                </Button>
              </Link>
            )}
            
            {user ? (
              // Logged-in tourist view
              <>
                <Link href="/savings">
                  <Button variant="ghost">Savings</Button>
                </Link>
                
                {user.role === 'tourist' && (
                  <Link href="/my-bookings">
                    <Button variant="ghost">My Bookings</Button>
                  </Link>
                )}
                
                {user.role === 'tourist' && (
                  <Link href="/cart" className="relative">
                    <Button variant="ghost" className="relative">
                      <ShoppingCart className="h-4 w-4" />
                      {getCartItemCount() > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-amber-600 text-white"
                        >
                          {getCartItemCount()}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 hover:bg-amber-50">
                      <span className="text-amber-700 font-medium">{getUserName()}</span>
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-amber-700 text-white">{user.email.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Non-logged-in view
              <>
                <Link href="/login">
                  <Button variant="outline" className="hover:bg-amber-50 border-amber-200">Login</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-amber-700 text-white hover:bg-amber-800">Register</Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col space-y-4 mt-4">
                {user && (
                  <div className="flex items-center space-x-2 px-2 py-3 bg-amber-50 rounded-md mb-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-amber-700 text-white">{user.email.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{getUserName()}</span>
                  </div>
                )}
              
                <Link href="/">
                  <Button variant="ghost" className="w-full justify-start">
                    Home
                  </Button>
                </Link>                <Link href="/locations">
                  <Button variant="ghost" className="w-full justify-start">
                    Locations
                  </Button>
                </Link>
                
                {user && user.role === 'tourist' && (
                  <Link href="/ai-suggestions">
                    <Button variant="ghost" className="w-full justify-start text-amber-700">
                      AI Suggestions
                    </Button>
                  </Link>
                )}
                
                {user ? (
                  // Logged-in tourist mobile view
                  <>
                    <Link href="/savings">
                      <Button variant="ghost" className="w-full justify-start">
                        Savings
                      </Button>
                    </Link>
                    
                    {user.role === 'tourist' && (
                      <Link href="/my-bookings">
                        <Button variant="ghost" className="w-full justify-start">
                          My Bookings
                        </Button>
                      </Link>
                    )}
                    
                    {user.role === 'tourist' && (
                      <Link href="/cart" className="relative">
                        <Button variant="ghost" className="w-full justify-start relative">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Cart
                          {getCartItemCount() > 0 && (
                            <Badge 
                              variant="secondary" 
                              className="absolute right-2 h-5 w-5 flex items-center justify-center text-xs bg-amber-600 text-white"
                            >
                              {getCartItemCount()}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                    )}
                    
                    <Link href="/profile">
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-600"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </>
                ) : (
                  // Non-logged-in mobile view
                  <>
                    <Link href="/login">
                      <Button variant="outline" className="w-full justify-start border-amber-200 hover:bg-amber-50">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full justify-start bg-amber-700 hover:bg-amber-800 text-white">
                        Register
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}

