"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function MyBookings() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to profile page where bookings are now displayed
    router.replace('/profile')
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-700 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your profile...</p>
      </div>
    </div>
  )
}