"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { FileUploader } from "../../components/file-uploader"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { User, Save, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {create} from 'zustand'


const useTourGuideProfileStore = create((set) => ({
  fullName: "",
  location: "",
  expertise: "",
  licenseDocuments: [],
  isSubmitting: false,
  isSaved: false,

  setFullName: (fullName) => set({ fullName }),
  setLocation: (location) => set({ location }),
  setExpertise: (expertise) => set({ expertise }),
  setLicenseDocuments: (licenseDocuments) => set({ licenseDocuments }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setIsSaved: (isSaved) => set({ isSaved }),

  resetForm: () => set({ // Optional: Reset form fields
    fullName: "",
    location: "",
    expertise: "",
    licenseDocuments: [],
    isSubmitting: false,
    isSaved: false,
  }),
}));


export default function TourGuideProfile() {
  const router = useRouter()
  const {
    fullName,
    location,
    expertise,
    licenseDocuments,
    isSubmitting,
    isSaved,
    setFullName,
    setLocation,
    setExpertise,
    setLicenseDocuments,
    setIsSubmitting,
    setIsSaved,
    resetForm
  } = useTourGuideProfileStore(); // Use Zustand store


  const onSubmit = async (event) => {
    event.preventDefault(); 
    setIsSubmitting(true); 

    if (!fullName || !location || !expertise) {
      toast.error("Please fill in all fields.");
      setIsSubmitting(false);
      return;
    }
    if (fullName.length < 2) {
      toast.error("Please enter your full name.");
      setIsSubmitting(false);
      return;
    }
    if (location.length < 2) {
      toast.error("Please enter your location.");
      setIsSubmitting(false);
      return;
    }
    if (expertise.length < 2) {
      toast.error("Please enter your areas of expertise.");
      setIsSubmitting(false);
      return;
    }


    try {
      // i will send this data to the API
      console.log("Tour Guide Profile data:", { fullName, location, expertise, licenseDocuments });

      // Here i will call an api 
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsSaved(true); 
      toast.success("Your profile is now pending approval by the administrator.");
      resetForm(); 
    } catch (error) {
      toast.error("There was an error saving your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSavePartial = () => {
    // i will implement partial save of data
    console.log("Saving partial data:", { fullName, location, expertise, licenseDocuments });

    toast.success("Your profile information has been saved. You can complete it later.");
  };

  const handleFileChange = (files) => {
    setLicenseDocuments(files); 
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
            Your profile has been submitted and is pending approval by the administrator.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-blue-100 shadow-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Complete Your Tour Guide Profile</CardTitle>
          <CardDescription>
            Please provide your personal details, license documentation, location, and expertise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                <User size={18} />
                <h3>Tour Guide Information</h3>
              </div>
              <Separator />

              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Full Name</label>
                <Input
                  id="fullName"
                  placeholder="Eddie Thinker"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Location</label>
                <Input
                  id="location"
                  placeholder="City, Country"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="expertise" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Areas of Expertise</label>
                <Textarea
                  id="expertise"
                  placeholder="Wildlife, History, Adventure, etc."
                  className="min-h-[100px]"
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="licenseDocuments" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">License Documents</label>
                <FileUploader
                  onChange={handleFileChange}
                  maxFiles={3}
                  acceptedFileTypes="application/pdf,image/*"
                />
                <p className="text-xs text-gray-500">Upload your tour guide license or certification (PDF or images)</p>
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
            Your profile will be reviewed by an administrator before it becomes active.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}