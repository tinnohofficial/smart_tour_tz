"use client"

import { useEffect } from "react" // Keep useEffect for initial fetch trigger
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { FileUploader } from "../../components/file-uploader" // Adjust path if needed
import { toast } from "sonner" // Import from sonner
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { User, Save, ArrowLeft, MapPin, Award, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { useTourGuideProfileStore } from './store'

// Tour guide profile schema (keep Zod for validation)
const tourGuideSchema = z.object({
  full_name: z.string().min(2, { message: "Please enter your full name" }),
  location: z.string().min(2, { message: "Please enter your location" }),
  expertise: z.string().min(2, { message: "Please enter your areas of expertise" }),
  license_document_url: z.string().optional().nullable(), // Allow null/optional
  activity_expertise: z.array(z.number()).min(1, { message: "Please select at least one activity" }),
})

export default function TourGuideProfile() {
  const router = useRouter()

  const {
    isSubmitting,
    isSaved,
    activities,
    isLoading,
    profileStatus,
    licenseFile,
    isUploading,
    fetchInitialData,
    setLicenseFile,
    submitProfile,
    fetchedProfileData,
  } = useTourGuideProfileStore()

  const form = useForm({
    resolver: zodResolver(tourGuideSchema),
    defaultValues: {
      full_name: "",
      location: "",
      expertise: "",
      license_document_url: "",
      activity_expertise: [],
    },
  })

  // Fetch initial data on mount
  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  // Reset form when fetched profile data changes
  useEffect(() => {
    if (fetchedProfileData) {
      form.reset({
        full_name: fetchedProfileData.full_name || "",
        location: fetchedProfileData.location || "",
        expertise: fetchedProfileData.expertise?.general || fetchedProfileData.expertise || "",
        license_document_url: fetchedProfileData.license_document_url || "",
        activity_expertise: Array.isArray(fetchedProfileData.activity_expertise)
          ? fetchedProfileData.activity_expertise
          : [],
      })
    }
  }, [fetchedProfileData, form])

  // Handle file selection
  const handleFileChange = (files) => {
    if (files.length > 0) {
      setLicenseFile(files[0])
    } else {
      setLicenseFile(null)
    }
  }

  // Handle form submission
  const onSubmit = async (data) => {
    await submitProfile(data)
  }

  // Save draft locally
  const onSavePartial = () => {
    const currentData = form.getValues()
    localStorage.setItem("tourGuideProfileDraft", JSON.stringify(currentData))
    toast.info("Progress saved", {
      description: "Your profile information has been saved locally. You can complete it later.",
    })
  }

  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-10 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading profile data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto py-10">
      <Button variant="outline" className="mb-6" onClick={() => router.push("/tour-guide/dashboard")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      {/* Profile Status Alerts */}
      {profileStatus === "pending_approval" && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <AlertTitle className="text-yellow-800">Profile Pending Approval</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Your profile has been submitted and is pending approval by the administrator.
          </AlertDescription>
        </Alert>
      )}
      {profileStatus === "rejected" && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertTitle className="text-red-800">Profile Rejected</AlertTitle>
          <AlertDescription className="text-red-700">
            Your profile has been rejected. Please update your information and submit again.
          </AlertDescription>
        </Alert>
      )}
      {profileStatus === "active" && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <AlertTitle className="text-green-800">Profile Active</AlertTitle>
          <AlertDescription className="text-green-700">
            Your profile is active. You can update your information at any time.
          </AlertDescription>
        </Alert>
      )}
      {profileStatus === 'error' && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Loading Error</AlertTitle>
          <AlertDescription>
            There was an issue loading your profile data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-primary/10 shadow-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Complete Your Tour Guide Profile</CardTitle>
          <CardDescription>
            Please provide your personal details, license documentation, location, and expertise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-medium mb-2">
                  <User size={18} />
                  <h3>Tour Guide Information</h3>
                </div>
                <Separator />
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input placeholder="City, Country" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>Enter the location where you provide tour guide services</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expertise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Areas of Expertise</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Wildlife, History, Adventure, etc."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe your expertise, experience, and specialties as a tour guide
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="license_document_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Documents</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <FileUploader
                            onChange={handleFileChange}
                            maxFiles={1}
                            acceptedFileTypes="application/pdf,image/*"
                          />
                          {/* Show current document URL if exists and no new file is staged */}
                          {field.value && !licenseFile && (
                            <div className="text-sm text-muted-foreground mt-2">
                              Current document:{" "}
                              <a
                                href={field.value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary underline"
                              >
                                View Document
                              </a>
                            </div>
                          )}
                          {/* Show newly selected file name */}
                          {licenseFile && (
                            <div className="text-sm text-muted-foreground mt-2">
                              Staged file: {licenseFile.name}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>Upload your tour guide license or certification (PDF or images)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Activity Expertise Section */}
              <div className="pt-4">
                <div className="flex items-center gap-2 text-primary font-medium mb-2">
                  <Award size={18} />
                  <h3>Activity Expertise</h3>
                </div>
                <Separator className="mb-4" />
                <FormField
                  control={form.control}
                  name="activity_expertise"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Select Activities</FormLabel>
                        <FormDescription>
                          Choose the activities you are qualified to guide tourists through
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activities.map((activity) => (
                          <FormField
                            key={activity.id}
                            control={form.control}
                            name="activity_expertise"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={activity.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(activity.id)}
                                      onCheckedChange={(checked) => {
                                        const currentValues = field.value || []
                                        return checked
                                          ? field.onChange([...currentValues, activity.id])
                                          : field.onChange(currentValues?.filter((value) => value !== activity.id))
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-medium">{activity.name}</FormLabel>
                                    <FormDescription className="text-xs">{activity.description}</FormDescription>
                                  </div>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button type="button" variant="outline" className="flex-1" onClick={onSavePartial}>
                  <Save className="mr-2 h-4 w-4" /> Save Progress
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting || isUploading}>
                  {isSubmitting || isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isUploading ? "Uploading..." : "Submitting..."}
                    </>
                  ) : isSaved ? (
                    "Update Profile"
                  ) : (
                    "Submit Profile"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <p className="text-sm text-muted-foreground">
            {profileStatus !== "active" && profileStatus !== 'error'
              ? "Your profile will be reviewed by an administrator before it becomes active."
              : profileStatus === "active"
              ? "Your profile is active. You can update your information at any time."
              : ""}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}