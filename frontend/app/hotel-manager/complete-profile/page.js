"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Hotel, Building, Loader2, ChevronRight, CheckCircle2, Camera, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileUploader } from "../../components/file-uploader"
import { toast } from "sonner"
import { hotelManagerService, uploadService } from "@/app/services/api"
import { RouteProtection } from "@/components/route-protection"

export default function HotelManagerCompleteProfile() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [hotelImages, setHotelImages] = useState([])
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    capacity: "",
    basePricePerNight: ""
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (files) => {
    setHotelImages(files)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Please enter your hotel name")
      return
    }
    
    if (!formData.location.trim()) {
      toast.error("Please enter your hotel location")
      return
    }
    
    if (!formData.description.trim()) {
      toast.error("Please provide a hotel description")
      return
    }
    
    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      toast.error("Please enter a valid room capacity")
      return
    }
    
    if (!formData.basePricePerNight || parseFloat(formData.basePricePerNight) <= 0) {
      toast.error("Please enter a valid price per night")
      return
    }

    if (hotelImages.length === 0) {
      toast.error("Please upload at least one hotel image")
      return
    }

    setIsSubmitting(true)

    try {
      // Upload hotel images first
      setIsUploading(true)
      const uploadedImageUrls = []
      
      for (const imageFile of hotelImages) {
        const { url } = await uploadService.uploadImage(imageFile)
        uploadedImageUrls.push(url)
      }
      setIsUploading(false)

      // Create hotel profile
      const profileData = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        description: formData.description.trim(),
        capacity: parseInt(formData.capacity),
        base_price_per_night: parseFloat(formData.basePricePerNight),
        images: uploadedImageUrls
      }

      await hotelManagerService.createProfile(profileData)

      toast.success("Hotel profile completed successfully!", {
        description: "Your hotel is now under review by administrators."
      })

      // Redirect to dashboard after successful submission
      router.push("/hotel-manager/dashboard")

    } catch (error) {
      console.error("Profile submission error:", error)
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      })
      
      // Show more specific error messages
      if (error.response?.status === 404) {
        toast.error("Profile creation endpoint not found. Please contact support.")
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to create a profile. Please check your account status.")
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || "Invalid data provided. Please check your inputs.")
      } else {
        toast.error(error.message || "Failed to complete profile. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
    }
  }

  return (
    <RouteProtection allowedRoles={['hotel_manager']}>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Hotel className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Hotel Profile</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Welcome to Smart Tour Tanzania! Please provide your hotel details to complete your registration. 
              Your hotel will be reviewed by our administrators before it becomes available for bookings.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-sm font-medium text-green-600">Account Created</span>
              </div>
              <div className="w-8 h-1 bg-amber-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">2</span>
                </div>
                <span className="ml-2 text-sm font-medium text-amber-600">Complete Profile</span>
              </div>
              <div className="w-8 h-1 bg-gray-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 text-sm font-medium">3</span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-500">Admin Approval</span>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Building className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800">Important Information</AlertTitle>
            <AlertDescription className="text-amber-700">
              After completing your hotel profile, it will be submitted for review. Your hotel will be available 
              for tourist bookings once approved by our administrators. This typically takes 1-2 business days.
            </AlertDescription>
          </Alert>

          {/* Profile Completion Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Hotel className="h-5 w-5 text-amber-600 mr-2" />
                Hotel Information
              </CardTitle>
              <CardDescription>
                Please provide accurate information about your hotel as this will be shown to tourists
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Hotel Name *
                    </label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="The Grand Hotel"
                      className="border-gray-300 focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="location" className="text-sm font-medium text-gray-700">
                      Location *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="pl-10 border-gray-300 focus:border-amber-500"
                        placeholder="City, Region, Tanzania"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Capacity and Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="capacity" className="text-sm font-medium text-gray-700">
                      Room Capacity *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => handleInputChange("capacity", e.target.value)}
                        className="pl-10 border-gray-300 focus:border-amber-500"
                        placeholder="Number of rooms"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="basePricePerNight" className="text-sm font-medium text-gray-700">
                      Base Price Per Night (TZS) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="basePricePerNight"
                        type="number"
                        min="0"
                        step="1000"
                        value={formData.basePricePerNight}
                        onChange={(e) => handleInputChange("basePricePerNight", e.target.value)}
                        className="pl-10 border-gray-300 focus:border-amber-500"
                        placeholder="240000"
                        required
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Standard room rate per night in Tanzanian Shillings
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Hotel Description *
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe your hotel, amenities, unique features, services offered, room types available, etc."
                    className="min-h-[120px] border-gray-300 focus:border-amber-500"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Include information about amenities, services, room types, and what makes your hotel special
                  </p>
                </div>

                {/* Hotel Images */}
                <div className="space-y-2">
                  <label htmlFor="images" className="text-sm font-medium text-gray-700">
                    Hotel Images *
                  </label>
                  <FileUploader
                    onChange={handleFileChange}
                    maxFiles={5}
                    acceptedFileTypes="image/*"
                    value={hotelImages}
                    uploadPrompt="Upload hotel images (rooms, lobby, facilities, etc.)"
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Required:</strong> Please upload high-quality images of your hotel including 
                      exterior, rooms, lobby, dining areas, and facilities. Maximum 5 images.
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-gray-50 border-t">
                <div className="w-full flex flex-col sm:flex-row gap-3 sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/hotel-manager/dashboard")}
                    disabled={isSubmitting}
                  >
                    Complete Later
                  </Button>
                  
                  <Button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={isSubmitting || isUploading}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isUploading ? "Uploading..." : "Submitting..."}
                      </>
                    ) : (
                      <>
                        Complete Profile
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>

          {/* Next Steps Info */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              After submission, you'll be redirected to your dashboard where you can monitor your application status.
            </p>
          </div>
        </div>
      </div>
    </RouteProtection>
  )
}