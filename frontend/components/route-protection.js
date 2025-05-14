"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

/**
 * A component that handles route protection by checking authentication and role permissions
 * Simplified to rely on token presence and user data in localStorage
 */
export function RouteProtection({ allowedRoles = [], children }) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    function checkAuth() {
      try {
        setIsLoading(true)
        
        // Check if token exists in localStorage
        const token = localStorage.getItem("token")
        if (!token) {
          toast.error("You must be signed in to access this page")
          router.push("/login")
          return
        }

        // Get user data from localStorage
        const storedUserData = localStorage.getItem("userData")
        if (!storedUserData) {
          // If we have a token but no user data, something is wrong
          localStorage.removeItem("token")
          toast.error("Authentication error. Please sign in again.")
          router.push("/login")
          return
        }
        
        const userData = JSON.parse(storedUserData)
        
        // Check if user has one of the allowed roles
        if (allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
          toast.error("You don't have permission to access this page")
          router.push("/forbidden")
          return
        }
        
        // User is authorized, show the content
        setIsAuthorized(true)
      } catch (error) {
        console.error("Authentication error:", error)
        localStorage.removeItem("token")
        localStorage.removeItem("userData")
        toast.error("Authentication error. Please sign in again.")
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [allowedRoles, router])
  
  // While checking authorization, show a loading spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-500">Verifying your access...</p>
        </div>
      </div>
    )
  }
  
  // Only render the children if the user is authorized
  return isAuthorized ? children : null
}