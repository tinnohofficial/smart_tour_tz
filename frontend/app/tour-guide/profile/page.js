"use client"

import { useEffect, useState } from "react"
import { MapPin, Award, User, Loader2, Save, Camera, FileText, CheckCircle, AlertCircle, ChevronRight, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUploader } from "../../components/file-uploader"
import { useProfileStore } from "./store"
import { destinationsService } from "@/app/services/api"

export default function TourGuideProfile() {
  const {
    profileData,
    isLoading,
    isSubmitting,
    isUploading,
    error,
    fullName,
    destination_id,
    destination_name,
    destination_region,
    expertise,
    licenseUrl,
    isAvailable,
    fetchProfile,
    updateProfile,
    updateAvailability,
    setLicenseFile
  } = useProfileStore()

  // Local state for destinations
  const [destinations, setDestinations] = useState([])
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const destinationsData = await destinationsService.getAllDestinations()
        setDestinations(destinationsData)
      } catch (error) {
        console.error('Error loading destinations:', error)
      } finally {
        setIsLoadingDestinations(false)
      }
    }
    
    loadDestinations()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = {
      full_name: e.target.fullName.value,
      destination_id: e.target.destination.value || destination_id,
      expertise: e.target.expertise.value,
    }
    await updateProfile(formData)
  }

  const handleAvailabilityToggle = async () => {
    await updateAvailability(!isAvailable)
  }

  const handleFileChange = (files) => {
    if (files.length > 0) {
      setLicenseFile(files[0])
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile data...</p>
        </div>
      </div>
    )
  }

  const isApproved = profileData?.status === 'active'

  const expertiseGeneral = typeof expertise === 'object' && expertise !== null ? 
    expertise.general || "" : 
    typeof expertise === 'string' ? expertise : "";

  return (
    <div className="container px-1">
      {/* Page Header */}
      <div className="bg-amber-700 p-4 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div>
            <h1 className="text-xl font-bold text-white">Tour Guide Profile</h1>
            <p className="text-amber-100 text-sm">Manage your personal information and professional details</p>
          </div>
          
          {isApproved && (
            <div className="flex items-center gap-3 bg-amber-800/40 rounded-lg px-3 py-2">
              <div>
                <span className="text-sm text-white font-medium">Availability Status</span>
                <p className="text-xs text-amber-100">Set your availability for new tours</p>
              </div>
              <Switch 
                checked={isAvailable} 
                onCheckedChange={handleAvailabilityToggle}
                className="data-[state=checked]:bg-yellow-400"
              />
              <span className="text-white text-sm">
                {isAvailable ? "Available" : "Unavailable"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Status Alert */}
      {!isApproved && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200 shadow-sm">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-800 font-semibold">Profile Under Review</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Your profile is currently pending approval. Some features will be available once your profile is approved by our administrators.
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column - Profile Card */}
          <div className="md:col-span-4">
            <Card className="bg-white border-0 py-0 shadow-md overflow-hidden">
              <div className="bg-gradient-to-br from-amber-700 to-amber-800 h-24"></div>
              <div className="px-6 pb-6 -mt-12 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-amber-100 border-4 border-white shadow-md flex items-center justify-center mb-3">
                  {fullName ? (
                    <span className="text-3xl font-semibold text-amber-700">{fullName.charAt(0)}</span>
                  ) : (
                    <Camera className="h-10 w-10 text-amber-600" />
                  )}
                </div>
                
                <h2 className="text-xl font-semibold">{fullName || "Your Name"}</h2>
                
                {(destination_name && destination_region) && (
                  <div className="flex items-center text-gray-600 mt-1 text-sm">
                    <MapPin className="h-3.5 w-3.5 mr-1" />
                    <span>{destination_name}, {destination_region}</span>
                  </div>
                )}
                
                <div className="flex gap-2 mt-4">
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0">Tour Guide</Badge>
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
                    <Building className="h-4 w-4 text-amber-700" />
                    <span className="text-sm font-medium">Experience:</span>
                    <span className="text-sm text-gray-600">{profileData?.years_experience || '0'} years</span>
                  </div>
                  
                  <div className="flex items-center gap-2 py-2 border-t">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">License:</span>
                    <span className="text-sm text-gray-600">{licenseUrl ? 'Uploaded' : 'Not uploaded'}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Profile Form */}
          <div className="md:col-span-8 space-y-6">
            {/* Personal Information Card */}
            <Card className="shadow-sm py-0">
              <CardHeader className="bg-gray-50 border-b p-4 flex flex-row items-start">
                <User className="h-5 w-5 text-amber-700 mt-0.5 mr-2" />
                <div>
                  <CardTitle className="text-base font-semibold">Personal Information</CardTitle>
                  <CardDescription>Your basic contact information</CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name</label>
                    <Input
                      id="fullName"
                      name="fullName"
                      defaultValue={fullName}
                      placeholder="Your full name"
                      className="border-gray-300 focus:border-amber-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="destination" className="text-sm font-medium text-gray-700">Primary Destination</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10" />
                      <Select
                        value={destination_id?.toString() || ""}
                        onValueChange={(value) => {
                          const selectedDest = destinations.find(d => d.id.toString() === value)
                          if (selectedDest) {
                            // Update the hidden input for form submission
                            const hiddenInput = document.getElementById('destination')
                            if (hiddenInput) hiddenInput.value = value
                          }
                        }}
                        disabled={isLoadingDestinations}
                      >
                        <SelectTrigger 
                          className="pl-10 border-gray-300 focus:border-amber-600"
                          id="destination-select"
                        >
                          <SelectValue 
                            placeholder={isLoadingDestinations ? "Loading destinations..." : "Select your primary destination"} 
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {destinations.map((destination) => (
                            <SelectItem key={destination.id} value={destination.id.toString()}>
                              {destination.name} - {destination.region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <input 
                        type="hidden" 
                        id="destination" 
                        name="destination" 
                        defaultValue={destination_id}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Select the destination where you primarily offer tour guide services
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Details Card */}
            <Card className="shadow-sm border-0 py-0">
              <CardHeader className="bg-gray-50 border-b p-4 flex flex-row items-start">
                <Award className="h-5 w-5 text-amber-700 mt-0.5 mr-2" />
                <div>
                  <CardTitle className="text-base font-semibold">Professional Details</CardTitle>
                  <CardDescription>Your expertise and tour guide qualifications</CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label htmlFor="expertise" className="text-sm font-medium text-gray-700">Areas of Expertise</label>
                  <Textarea
                    id="expertise"
                    name="expertise"
                    defaultValue={expertiseGeneral}
                    placeholder="Describe your expertise and experience..."
                    className="min-h-[120px] border-gray-300 focus:border-amber-600"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    List your specialties, certifications, and years of experience in different types of tours
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="license" className="text-sm font-medium text-gray-700">Tour Guide License</label>
                  <FileUploader
                    onChange={handleFileChange}
                    maxFiles={1}
                    acceptedFileTypes="application/pdf,image/*"
                    value={licenseUrl ? [licenseUrl] : []}
                  />
                  <div className="flex items-start gap-2 mt-2 bg-gray-50 p-2 rounded-md">
                    <AlertCircle className="h-4 w-4 text-amber-700 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600">
                      Upload your tour guide license or certification (PDF or image format). This is required for verification.
                    </p>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="bg-gray-50 border-t px-6 py-4">
                <div className="w-full flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-amber-700 hover:bg-amber-800 text-white px-6" 
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
