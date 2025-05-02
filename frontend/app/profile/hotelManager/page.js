"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { FileUploader } from "../../components/file-uploader"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Hotel, Save, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useHotelManagerProfileStore } from "./store"


export default function HotelManagerProfile() {
  const router = useRouter()
  const {
    hotelName,
    hotelLocation,
    hotelCapacity,
    accommodationCosts,
    hotelFacilities,
    hotelImages,
    isSubmitting,
    isSaved,
    setHotelName,
    setHotelLocation,
    setHotelCapacity,
    setAccommodationCosts,
    setHotelFacilities,
    setHotelImages,
    setIsSubmitting,
    setIsSaved,
    resetForm,
    fetchProfile,
    submitProfile,
    savePartial
  } = useHotelManagerProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);


  const onSubmit = async (event) => {
    event.preventDefault();
    if (!hotelName || !hotelLocation || !hotelCapacity || !accommodationCosts || !hotelFacilities) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (hotelName.length < 2) {
      toast.error("Please enter the hotel name.");
      return;
    }
    if (hotelLocation.length < 2) {
      toast.error("Please enter the hotel location.");
      return;
    }
    if (hotelCapacity.length < 1) {
      toast.error("Please enter the hotel capacity.");
      return;
    }
    if (accommodationCosts.length < 1) {
      toast.error("Please enter accommodation costs.");
      return;
    }
    if (hotelFacilities.length < 2) {
      toast.error("Please describe the hotel facilities.");
      return;
    }

    try {
      await submitProfile();
      toast.success("Your hotel profile is now pending approval by the administrator.");
    } catch (error) {
      toast.error("There was an error saving your hotel profile. Please try again.");
    }
  };

  const onSavePartial = async () => {
    if (!hotelName && !hotelLocation && !hotelCapacity && !accommodationCosts && !hotelFacilities && !hotelImages.length) {
      toast.error("Please fill in at least one field to save progress");
      return;
    }

    try {
      await savePartial();
      toast.success("Your progress has been saved successfully.");
    } catch (error) {
      toast.error("There was an error saving your progress. Please try again.");
    }
  };

  const handleFileChange = (files) => {
    setHotelImages(files); 
  };


  return (
    <div className="container max-w-3xl mx-auto py-10">
      <Button variant="outline" className="mb-6 hover:bg-blue-100" onClick={() => router.push("/dashboard")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      {isSaved && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertTitle className="text-green-800">Profile Submitted</AlertTitle>
          <AlertDescription className="text-green-700">
            Your hotel profile has been submitted and is pending approval by the administrator.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-blue-100 shadow-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Complete Your Hotel Profile</CardTitle>
          <CardDescription>
            Please provide your hotel details, including name, location, facilities, and images
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                <Hotel size={18} />
                <h3>Hotel Information</h3>
              </div>
              <Separator />

              <div className="space-y-2">
                <label htmlFor="hotelName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Hotel Name</label>
                <Input
                  id="hotelName"
                  placeholder="Serengeti Luxury Lodge"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="hotelLocation" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Hotel Location</label>
                <Input
                  id="hotelLocation"
                  placeholder="City, Country"
                  value={hotelLocation}
                  onChange={(e) => setHotelLocation(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="hotelCapacity" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Hotel Capacity</label>
                  <Input
                    id="hotelCapacity"
                    placeholder="Number of rooms/guests"
                    value={hotelCapacity}
                    onChange={(e) => setHotelCapacity(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="accommodationCosts" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Accommodation Costs</label>
                  <Input
                    id="accommodationCosts"
                    placeholder="Price range per night"
                    value={accommodationCosts}
                    onChange={(e) => setAccommodationCosts(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="hotelFacilities" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Hotel Facilities</label>
                <Textarea
                  id="hotelFacilities"
                  placeholder="Pool, Spa, Restaurant, etc."
                  className="min-h-[100px]"
                  value={hotelFacilities}
                  onChange={(e) => setHotelFacilities(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="hotelImages" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Hotel Images</label>
                <FileUploader
                  onChange={handleFileChange}
                  maxFiles={5}
                  acceptedFileTypes="image/*"
                />
                <p className="text-xs text-gray-500">Upload images of your hotel (up to 5 images)</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button type="button" variant="outline" className="flex-1 hover:bg-blue-100" onClick={onSavePartial}>
                <Save className="mr-2 h-4 w-4" /> Save Progress
              </Button>
              <Button type="submit" className="flex-1 text-white bg-blue-600 hover:bg-blue-700" disabled={isSubmitting || isSaved}>
                {isSubmitting ? "Submitting..." : isSaved ? "Submitted" : "Submit Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <p className="text-sm text-gray-500">
            Your hotel profile will be reviewed by an administrator before it becomes active.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}