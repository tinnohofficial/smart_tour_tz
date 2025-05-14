"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function AuthCheck() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl") || "/"
  const requiredRolesStr = searchParams.get("requiredRoles") || ""
  const requiredRoles = requiredRolesStr.split(",").filter(Boolean)
  
  useEffect(() => {
    async function checkAuth() {
      // Check if we have a token in localStorage
      const token = localStorage.getItem("token")
      
      // If no token, redirect to login
      if (!token) {
        toast.error("Authentication required. Please sign in.")
        router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
        return
      }
      
      try {
        // Verify token with backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!response.ok) {
          // Token is invalid or expired
          localStorage.removeItem("token")
          localStorage.removeItem("userData")
          toast.error("Your session has expired. Please sign in again.")
          router.push("/session-expired")
          return
        }
        
        // Get user data from response
        const userData = await response.json()
        
        // Store the latest user data
        localStorage.setItem("userData", JSON.stringify(userData))
        
        // Check if user has the required role
        if (requiredRoles.length > 0 && !requiredRoles.includes(userData.role)) {
          toast.error("You don't have permission to access this page.")
          router.push("/forbidden")
          return
        }
        
        // Check if account is active
        if (userData.status !== 'active') {
          // Special case for profile pages - allow pending users to access their profile
          if (userData.status.startsWith('pending_') && returnUrl.includes('/profile')) {
            // Allow access to profile
            router.push(returnUrl)
          } else {
            // Redirect to pending approval page
            router.push("/pending-approval")
          }
          return
        }
        
        // All checks passed, redirect to the original URL
        router.push(returnUrl)
        
      } catch (error) {
        console.error("Auth verification error:", error)
        toast.error("Authentication error. Please sign in again.")
        localStorage.removeItem("token")
        localStorage.removeItem("userData")
        router.push("/login")
      }
    }
    
    checkAuth()
  }, [router, returnUrl, requiredRoles])
  
  // Show loading spinner while checking authentication
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <p className="text-gray-500">Verifying your authentication...</p>
      </div>
    </div>
  )
}