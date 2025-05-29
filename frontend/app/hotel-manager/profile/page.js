"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Hotel, Loader2, Save, Camera, CheckCircle, AlertCircle, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileUploader } from "../../components/file-uploader"
import { useProfileStore } from "./store"
import { formatTZS } from "@/app/utils/currency"
import { hotelManagerService, apiUtils } from "@/app/services/api"

export default function HotelManagerProfile() {
  const router = useRouter()
  const [userStatus, setUserStatus] = useState(null)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  
  const {
    profileData,
    isLoading,
    isSubmitting,
    isUploading,
    hotelName,
    hotelLocation,
    hotelDescription,
    hotelCapacity,
    accommodationCosts,
    hotelImages,
    isApproved,
    fetchProfile,
    updateProfile,
    setHotelImages,
    isAvailable,
    toggleAvailability
  } = useProfileStore()

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        try {
          const data = await hotelManagerService.getProfile()
          setUserStatus(data.status || 'pending_profile')
            
          // Only allow access if user is active
          if (data.status !== 'active') {
            if (data.status === 'pending_profile' || !data.status) {
              router.push('/hotel-manager/complete-profile')
            } else {
              router.push('/hotel-manager/pending-status')
            }
            return
          }
            
          // User is active, fetch profile data
          fetchProfile()
        } catch (error) {
          if (error.response?.status === 404) {
            router.push('/hotel-manager/complete-profile')
            return
          } else {
            console.error('Error fetching profile:', error)
            apiUtils.handleAuthError(error, router)
            return
          }
        }
      } catch (error) {
        console.error("Error checking access:", error)
        router.push('/login')
      } finally {
        setIsCheckingAccess(false)
      }
    }

    checkAccess()
  }, [fetchProfile, router])

  // Show loading while checking access
  if (isCheckingAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking access...</p>
        </div>
      </div>
    )
  }

  // Don't render profile if user is not active
  if (userStatus !== 'active') {
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = {
      hotelName: e.target.hotelName.value,
      hotelLocation: e.target.hotelLocation.value,
      hotelDescription: e.target.hotelDescription.value,
      hotelCapacity: e.target.hotelCapacity.value,
      accommodationCosts: e.target.accommodationCosts.value,
    }
    await updateProfile(formData)
  }

  const handleFileChange = (files) => {
    setHotelImages(files)
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hotel profile data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-amber-700 p-6 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Hotel Profile</h1>
            <p className="text-amber-100">Manage your hotel information</p>
          </div>
          {isApproved && (
            <div className="flex items-center gap-3">
              <span className="text-amber-100 text-sm">Status:</span>
              <Badge 
                className={`${
                  isAvailable 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                } border-0`}
              >
                {isAvailable ? 'Available' : 'Unavailable'}
              </Badge>
              <Button
                onClick={toggleAvailability}
                disabled={isSubmitting}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  isAvailable ? 'Make Unavailable' : 'Make Available'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Availability Alert */}
      {!isAvailable && isApproved && (
        <Alert className="border-amber-200 bg-amber-50 mb-6">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Hotel Currently Unavailable</AlertTitle>
          <AlertDescription className="text-amber-700">
            Your hotel is currently marked as unavailable for new bookings. Tourists cannot book rooms until you mark it as available again.
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Hotel className="h-6 w-6 text-amber-700" />
              <div>
                <CardTitle className="text-xl">Hotel Information</CardTitle>
                <CardDescription>Update your hotel details and amenities</CardDescription>
              </div>
              {isApproved && (
                <Badge className="bg-green-100 text-green-700 border-0 ml-auto">
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="hotelName" className="text-sm font-medium text-gray-700">Hotel Name *</label>
                <Input
                  id="hotelName"
                  name="hotelName"
                  defaultValue={hotelName}
                  placeholder="The Grand Hotel"
                  className="border-gray-300 focus:border-amber-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="hotelLocation" className="text-sm font-medium text-gray-700">Location *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="hotelLocation"
                    name="hotelLocation"
                    className="pl-10 border-gray-300 focus:border-amber-600"
                    defaultValue={hotelLocation}
                    placeholder="City, Tanzania"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="hotelCapacity" className="text-sm font-medium text-gray-700">Room Capacity *</label>
                <Input
                  id="hotelCapacity"
                  name="hotelCapacity"
                  type="number"
                  min="1"
                  defaultValue={hotelCapacity}
                  placeholder="Number of rooms"
                  className="border-gray-300 focus:border-amber-600"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="accommodationCosts" className="text-sm font-medium text-gray-700">Price Per Night (TZS) *</label>
                <Input
                  id="accommodationCosts"
                  name="accommodationCosts"
                  type="number"
                  min="0"
                  step="1000"
                  defaultValue={accommodationCosts}
                  placeholder="240000"
                  className="border-gray-300 focus:border-amber-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="hotelDescription" className="text-sm font-medium text-gray-700">Hotel Description *</label>
              <Textarea
                id="hotelDescription"
                name="hotelDescription"
                defaultValue={hotelDescription}
                placeholder="Describe your hotel, its amenities and unique features..."
                className="min-h-[120px] border-gray-300 focus:border-amber-600"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="hotelImages" className="text-sm font-medium text-gray-700">Hotel Images</label>
              <FileUploader
                onChange={handleFileChange}
                maxFiles={5}
                acceptedFileTypes="image/*"
                value={hotelImages || []}
              />
              <p className="text-sm text-gray-500">Upload high-quality images of your hotel. Maximum 5 images.</p>
            </div>
          </CardContent>
          
          <CardFooter className="bg-gray-50 border-t">
            <Button 
              type="submit" 
              className="bg-amber-700 hover:bg-amber-800 text-white ml-auto" 
              disabled={isSubmitting || isUploading}
            >
              {(isSubmitting || isUploading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Uploading..." : "Saving..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}