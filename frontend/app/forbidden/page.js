"use client"

import { Button } from "@/components/ui/button"
import { ShieldAlert, LogIn, Home } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"

function ForbiddenContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || "You don&apos;t have permission to access this page."
  
  useEffect(() => {
    document.title = "Access Denied | Smart Tour Tanzania"
  }, [])
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top red border */}
      <div className="h-1.5 bg-red-600 w-full"></div>
      
      {/* Main content area */}
      <div className="flex flex-col flex-grow items-center justify-center px-6 py-6 bg-gray-50">
        <div className="w-full max-w-2xl mx-auto">
          {/* Top section */}
          <div className="flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-10 mb-8">
            {/* Left: Icon */}
            <div className="bg-white p-6 rounded-full border border-gray-200 shadow-md">
              <ShieldAlert className="h-20 w-20 text-red-600" />
            </div>
            
            {/* Right: Text content */}
            <div className="max-w-lg text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
              <div className="h-1 w-16 bg-red-600 mb-4 hidden md:block"></div>
              <p className="text-lg text-gray-700 mb-3">{message}</p>
              <p className="text-md text-gray-600">
                If you believe this is an error, please contact support or try logging in with the correct account.
              </p>
            </div>
          </div>
          
          {/* Action buttons with clear visual hierarchy */}
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link href="/" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto border border-gray-300 bg-white hover:bg-gray-50 px-5 py-2"
              >
                <Home className="mr-2 h-4 w-4" />
                Return Home
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button 
                className="w-full sm:w-auto text-white bg-blue-600 hover:bg-blue-700 px-5 py-2"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600 mb-2 md:mb-0">
              Smart Tour Tanzania - Secure, Professional Tourism Services
            </p>
            <div className="flex items-center">
              <p className="text-sm text-gray-600">
                Need help? Contact <span className="text-blue-600 font-medium">help@smarttourtanzania.com</span>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function ForbiddenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ForbiddenContent />
    </Suspense>
  )
}