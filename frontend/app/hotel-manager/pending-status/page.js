"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Clock, CheckCircle, XCircle, Building, MapPin, Users, 
  DollarSign, Mail, Phone, Globe, Image as ImageIcon,
  ArrowLeft, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { hotelManagerService, apiUtils } from "@/app/services/api"
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner"
import { formatTZS } from "@/app/utils/currency"

export default function PendingStatusPage() {
  const router = useRouter()
  const [userStatus, setUserStatus] = useState(null)
  const [hotelData, setHotelData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkStatusAndFetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        try {
          const data = await hotelManagerService.getProfile()
          setUserStatus(data.status || 'pending_approval')
          setHotelData(data)
          
          // If user is active, redirect to dashboard
          if (data.status === 'active') {
            router.push('/hotel-manager/dashboard')
            return
          }
          
          // If user hasn't completed profile, redirect to complete profile
          if (data.status === 'pending_profile' || !data.status) {
            router.push('/hotel-manager/complete-profile')
            return
          }
          
        } catch (error) {
          if (error.response?.status === 404) {
            // No profile exists, redirect to complete profile
            router.push('/hotel-manager/complete-profile')
            return
          } else {
            console.error('Error fetching profile:', error)
            setError('Failed to load profile data')
            apiUtils.handleAuthError(error, router)
          }
        }
      } catch (error) {
        console.error("Error checking status:", error)
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    checkStatusAndFetchData()
  }, [router])

  const handleRefresh = () => {
    setIsLoading(true)
    setError(null)
    window.location.reload()
  }

  const getStatusDisplay = () => {
    switch (userStatus) {
      case 'pending_approval':
        return {
          icon: <Clock className="h-8 w-8 text-amber-500" />,
          title: "Application Under Review",
          message: "Your hotel profile has been submitted successfully and is currently being reviewed by our administrators.",
          description: "This process typically takes 1-2 business days. You will receive an email notification once your application has been processed.",
          color: "amber",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200"
        }
      case 'rejected':
        return {
          icon: <XCircle className="h-8 w-8 text-red-500" />,
          title: "Application Rejected",
          message: "We regret to inform you that your hotel profile application has been rejected.",
          description: "Detailed feedback and reasons for rejection have been sent to your registered email address. Please review the feedback and feel free to resubmit your application after addressing the mentioned concerns.",
          color: "red",
          bgColor: "bg-red-50",
          borderColor: "border-red-200"
        }
      default:
        return {
          icon: <Clock className="h-8 w-8 text-gray-500" />,
          title: "Status Unknown",
          message: "Unable to determine your current application status.",
          description: "Please contact support for assistance.",
          color: "gray",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200"
        }
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading application status..." />
  }

  if (error) {
    return (
      <div className="container px-4 mx-auto max-w-4xl py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Data</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div className="container px-4 mx-auto max-w-6xl py-6">
      {/* Status Header */}
      <Card className={`${statusDisplay.bgColor} ${statusDisplay.borderColor} border-2 mb-6`}>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mb-4">
              {statusDisplay.icon}
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{statusDisplay.title}</h1>
            <p className="text-gray-700 mb-3">{statusDisplay.message}</p>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">{statusDisplay.description}</p>
            
            {userStatus === 'pending_approval' && (
              <div className="mt-4">
                <Badge variant="outline" className="bg-white">
                  <Clock className="h-3 w-3 mr-1" />
                  Status: Pending Review
                </Badge>
              </div>
            )}
            
            {userStatus === 'rejected' && (
              <div className="mt-4 space-x-2">
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Status: Rejected
                </Badge>
                <Button 
                  onClick={() => router.push('/hotel-manager/complete-profile')}
                  className="mt-2"
                  size="sm"
                >
                  Resubmit Application
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Preview */}
      {hotelData && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2 text-amber-600" />
                Hotel Information
              </CardTitle>
              <CardDescription>Basic details about your hotel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Hotel Name</label>
                <p className="text-lg font-semibold">{hotelData.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <div className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                  <p>{hotelData.location}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-gray-700 mt-1">{hotelData.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Capacity and Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Capacity & Pricing
              </CardTitle>
              <CardDescription>Hotel capacity and pricing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Room Capacity</label>
                <div className="flex items-center mt-1">
                  <Users className="h-4 w-4 text-gray-400 mr-1" />
                  <p className="text-lg font-semibold">{hotelData.capacity} rooms</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Base Price per Night</label>
                <div className="flex items-center mt-1">
                  <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                  <p className="text-lg font-semibold text-green-600">
                    {formatTZS(hotelData.base_price_per_night)}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Availability</label>
                <Badge variant={hotelData.is_available ? "default" : "secondary"} className="mt-1">
                  {hotelData.is_available ? "Available" : "Not Available"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          {hotelData.images && hotelData.images.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Hotel Images
                </CardTitle>
                <CardDescription>Uploaded images of your hotel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {hotelData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Hotel image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          e.target.src = '/placeholder-image.png'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 text-center space-y-4">
        <Separator />
        <div className="flex justify-center space-x-4">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => router.push('/hotel-manager/password')}
          >
            Change Password
          </Button>
        </div>
        
        <p className="text-sm text-gray-500">
          Need help? Contact our support team at{" "}
          <a href="mailto:support@smarttourtanzania.com" className="text-amber-600 hover:underline">
            support@smarttourtanzania.com
          </a>
        </p>
      </div>
    </div>
  )
}