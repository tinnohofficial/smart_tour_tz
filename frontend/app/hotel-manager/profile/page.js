"use client"

import { useEffect } from "react"
import { MapPin, Hotel, Loader2, Save, Camera, CheckCircle, AlertCircle, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileUploader } from "../../components/file-uploader"
import { useProfileStore } from "./store"

export default function HotelManagerProfile() {
  const {
    profileData,
    isLoading,
    isSubmitting,
    isUploading,
    error,
    hotelName,
    hotelLocation,
    hotelDescription,
    hotelCapacity,
    accommodationCosts,
    hotelImages,
    isApproved,
    fetchProfile,
    updateProfile,
    setHotelImages
  } = useProfileStore()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

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
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hotel profile data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-1">
      {/* Page Header */}
      <div className="bg-blue-600 p-4 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Hotel Profile</h1>
            <p className="text-blue-100 text-sm">Manage your hotel's information and accommodation details</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column - Hotel Preview Card */}
          <div className="md:col-span-4">
            <Card className="bg-white border-0 py-0 shadow-md overflow-hidden">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 h-24"></div>
              <div className="px-6 pb-6 -mt-12 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-white shadow-md flex items-center justify-center mb-3">
                  {hotelName ? (
                    <span className="text-3xl font-semibold text-blue-700">{hotelName.charAt(0)}</span>
                  ) : (
                    <Building className="h-10 w-10 text-blue-400" />
                  )}
                </div>
                
                <h2 className="text-xl font-semibold">{hotelName || "Hotel Name"}</h2>
                
                {hotelLocation && (
                  <div className="flex items-center text-gray-600 mt-1 text-sm">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    <span>{hotelLocation}</span>
                  </div>
                )}
                
                <div className="flex gap-2 mt-4">
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Hotel</Badge>
                  {isApproved ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0">
                      Pending
                    </Badge>
                  )}
                </div>

                <div className="w-full mt-6">
                  <div className="flex items-center gap-2 py-2 border-t">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Capacity:</span>
                    <span className="text-sm text-gray-600">{hotelCapacity || '0'} rooms</span>
                  </div>
                  
                  <div className="flex items-center gap-2 py-2 border-t">
                    <Hotel className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Price per night:</span>
                    <span className="text-sm text-gray-600">${accommodationCosts || '0'}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Profile Form */}
          <div className="md:col-span-8 space-y-6">
            {/* Hotel Information Card */}
            <Card className="shadow-sm py-0">
              <CardHeader className="bg-gray-50 border-b p-4 flex flex-row items-start">
                <Building className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <CardTitle className="text-base font-semibold">Hotel Information</CardTitle>
                  <CardDescription>Basic information about your hotel</CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label htmlFor="hotelName" className="text-sm font-medium text-gray-700">Hotel Name</label>
                    <Input
                      id="hotelName"
                      name="hotelName"
                      defaultValue={hotelName}
                      placeholder="The Grand Hotel"
                      className="border-gray-300 focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="hotelLocation" className="text-sm font-medium text-gray-700">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="hotelLocation"
                        name="hotelLocation"
                        className="pl-10 border-gray-300 focus:border-blue-400"
                        defaultValue={hotelLocation}
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="hotelCapacity" className="text-sm font-medium text-gray-700">Room Capacity</label>
                      <Input
                        id="hotelCapacity"
                        name="hotelCapacity"
                        type="number"
                        min="1"
                        defaultValue={hotelCapacity}
                        placeholder="Number of rooms"
                        className="border-gray-300 focus:border-blue-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="accommodationCosts" className="text-sm font-medium text-gray-700">Price Per Night ($)</label>
                      <Input
                        id="accommodationCosts"
                        name="accommodationCosts"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={accommodationCosts}
                        placeholder="99.99"
                        className="border-gray-300 focus:border-blue-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="hotelDescription" className="text-sm font-medium text-gray-700">Hotel Description</label>
                    <Textarea
                      id="hotelDescription"
                      name="hotelDescription"
                      defaultValue={hotelDescription}
                      placeholder="Describe your hotel, its amenities and unique features..."
                      className="min-h-[120px] border-gray-300 focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="hotelImages" className="text-sm font-medium text-gray-700">Hotel Images</label>
                    <FileUploader
                      onChange={handleFileChange}
                      maxFiles={5}
                      acceptedFileTypes="image/*"
                      value={hotelImages ? hotelImages : []}
                    />
                    <div className="flex items-start gap-2 mt-2 bg-gray-50 p-2 rounded-md">
                      <Camera className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">
                        Upload images of your hotel (rooms, lobby, facilities, etc.). Maximum 5 images.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="bg-gray-50 border-t px-6 py-4">
                <div className="w-full flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6" 
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
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}