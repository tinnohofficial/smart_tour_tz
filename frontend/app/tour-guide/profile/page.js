"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { MapPin, Award, Save, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useProfileStore } from "./store"
import { FileUploader } from "../../components/file-uploader"

export default function TourGuideProfile() {
  const {
    full_name,
    location,
    expertise,
    license_document_url,
    available,
    activities,
    isLoading,
    isSubmitting,
    availabilityUpdating,
    fetchProfileData,
    updateProfile,
    toggleAvailability,
    setFullName,
    setLocation,
    setGeneralExpertise,
    setActivityExpertise,
    setLicenseDocument
  } = useProfileStore()

  const form = useForm({
    defaultValues: {
      full_name: "",
      license_document_url: "",
      location: "",
      expertise: {
        general: "",
        activities: []
      },
      available: true,
    }
  })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await fetchProfileData()
        form.reset({
          full_name: profileData.full_name,
          location: profileData.location,
          expertise: profileData.expertise || { general: "", activities: [] },
          license_document_url: profileData.license_document_url ? [profileData.license_document_url] : [],
          available: profileData.available
        })
      } catch (error) {
        toast.error("Failed to load profile data", {
          description: "Please refresh the page and try again."
        })
      }
    }
    loadProfile()
  }, [fetchProfileData, form])

  const onSubmit = async (data) => {
    try {
      await updateProfile({
        ...data,
        expertise: {
          general: data.expertise.general,
          activities: data.expertise.activities
        },
        license_document_url: Array.isArray(data.license_document_url) ? data.license_document_url[0] : data.license_document_url
      })
      toast.success("Profile updated successfully!", {
        description: "Your profile changes have been saved."
      })
    } catch (error) {
      toast.error("Error updating profile", {
        description: "There was an error updating your profile. Please try again."
      })
    }
  }

  const handleAvailabilityToggle = async (available) => {
    try {
      await toggleAvailability(available)
      form.setValue("available", available)
      toast.success(
        available ? "You are now available for tours" : "You are now marked as unavailable",
        {
          description: available
            ? "Tourists can now book tours with you"
            : "You won't receive new tour assignments until you change your status"
        }
      )
    } catch (error) {
      toast.error("Error updating availability", {
        description: "There was an error updating your availability status. Please try again."
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">View and update your tour guide profile information</p>
      </div>

      <div className="mb-6">
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Availability Status</CardTitle>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={form.watch("available")}
                  onCheckedChange={handleAvailabilityToggle}
                  disabled={availabilityUpdating}
                  id="availability"
                />
                <label htmlFor="availability" className="text-sm font-medium">
                  {form.watch("available") ? "Available" : "Unavailable"}
                </label>
              </div>
            </div>
            <CardDescription>
              Toggle your availability to control whether you can be assigned to new tours
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold">Tour Guide Information</CardTitle>
          <CardDescription>Update your personal details, location, and expertise</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Eddie Thinker" {...field} />
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
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                          <Input placeholder="City, Country" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>Enter the location where you provide tour guide services</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                    <Award size={18} />
                    <h3>Activity Expertise</h3>
                  </div>
                  <Separator className="mb-4" />

                  <FormField
                    control={form.control}
                    name="expertise.general"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>General Expertise</FormLabel>
                        <FormControl>
                          <textarea
                            className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Describe your general expertise in tourism and guiding..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Share your overall experience and specialties in tourism
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expertise.activities"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Activity Specializations</FormLabel>
                          <FormDescription>
                            Select the activities you are qualified and experienced to guide
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activities.map((activity) => (
                            <FormField
                              key={activity.id}
                              control={form.control}
                              name="expertise.activities"
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
                                          return checked
                                            ? field.onChange([...field.value, activity.id])
                                            : field.onChange(
                                                field.value?.filter((value) => value !== activity.id)
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="font-medium">
                                        {activity.name}
                                      </FormLabel>
                                      <FormDescription className="text-xs">
                                        {activity.description}
                                      </FormDescription>
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

                <FormField
                  control={form.control}
                  name="license_document_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Documents</FormLabel>
                      <FormControl>
                        <FileUploader
                          onChange={(files) => field.onChange(files)}
                          maxFiles={1}
                          acceptedFileTypes="image/*,application/pdf"
                          value={field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload your tour guide license or certification (PDF or images)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full text-white bg-blue-600 hover:bg-blue-700" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
