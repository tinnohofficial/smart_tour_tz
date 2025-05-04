"use client"

import { useEffect } from "react"
import { MapPin, Award, User, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { FileUploader } from "../../components/file-uploader"
import { useProfileStore } from "./store"

export default function TourGuideProfile() {
  const {
    profileData,
    isLoading,
    isSubmitting,
    isUploading,
    error,
    fullName,
    location,
    expertise,
    licenseUrl,
    isAvailable,
    fetchProfile,
    updateProfile,
    updateAvailability,
    setLicenseFile
  } = useProfileStore()

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = {
      full_name: e.target.fullName.value,
      location: e.target.location.value,
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
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Smart Tour Tanzania...</p>
        </div>
      </div>
    )
  }

  const isApproved = profileData?.status === 'active'

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500">Manage your tour guide profile and availability</p>
      </div>

      {/* Profile Status Alert */}
      {!isApproved && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <AlertTitle className="text-yellow-800">Profile Under Review</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Your profile is currently pending approval. Some features will be available once your profile is approved.
          </AlertDescription>
        </Alert>
      )}

      {/* Availability Card - Only shown for approved profiles */}
      {isApproved && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Availability Status</CardTitle>
                <CardDescription>Control your availability for new tour assignments</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={isAvailable}
                  onCheckedChange={handleAvailabilityToggle}
                />
                <span className="text-sm font-medium">
                  {isAvailable ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your tour guide details and expertise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <User className="h-5 w-5" />
                <h3 className="font-medium">Basic Information</h3>
              </div>
              <Separator />
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
                  <Input
                    id="fullName"
                    name="fullName"
                    defaultValue={fullName}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="location"
                      name="location"
                      className="pl-10"
                      defaultValue={location}
                      placeholder="City, Country"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Expertise Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Award className="h-5 w-5" />
                <h3 className="font-medium">Professional Details</h3>
              </div>
              <Separator />

              <div className="space-y-2">
                <label htmlFor="expertise" className="text-sm font-medium">Areas of Expertise</label>
                <Textarea
                  id="expertise"
                  name="expertise"
                  defaultValue={expertise?.general || ""}
                  placeholder="Describe your expertise and experience..."
                  className="min-h-[120px]"
                />
                <p className="text-sm text-gray-500">
                  List your specialties, certifications, and years of experience in different types of tours
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="license" className="text-sm font-medium">Tour Guide License</label>
                <FileUploader
                  onChange={handleFileChange}
                  maxFiles={1}
                  acceptedFileTypes="application/pdf,image/*"
                  value={licenseUrl ? [licenseUrl] : []}
                />
                <p className="text-sm text-gray-500">
                  Upload your tour guide license or certification (PDF or image)
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button type="submit" className="text-white bg-blue-600 hover:bg-blue-700" disabled={isSubmitting || isUploading}>
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
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
