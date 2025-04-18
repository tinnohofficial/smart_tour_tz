"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { FileUploader } from "../../components/file-uploader"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Briefcase, Save, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { create } from 'zustand'

// Zustand store for TravelAgentProfile
const useTravelAgentProfileStore = create((set) => ({
  companyName: "",
  travelRoutes: "",
  legalDocuments: [], 
  isSubmitting: false,
  isSaved: false,

  setCompanyName: (companyName) => set({ companyName }),
  setTravelRoutes: (travelRoutes) => set({ travelRoutes }),
  setLegalDocuments: (legalDocuments) => set({ legalDocuments }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setIsSaved: (isSaved) => set({ isSaved }),

  resetForm: () => set({ 
    companyName: "",
    travelRoutes: "",
    legalDocuments: [],
    isSubmitting: false,
    isSaved: false,
  }),
}));


export default function TravelAgentProfile() {
  const router = useRouter()
  const {
    companyName,
    travelRoutes,
    legalDocuments,
    isSubmitting,
    isSaved,
    setCompanyName,
    setTravelRoutes,
    setLegalDocuments,
    setIsSubmitting,
    setIsSaved,
    resetForm
  } = useTravelAgentProfileStore(); 


  const onSubmit = async (event) => {
    event.preventDefault(); 
    setIsSubmitting(true); 

    if (!companyName || !travelRoutes) {
      toast.error("Please fill in all fields.");
      setIsSubmitting(false);
      return;
    }
    if (companyName.length < 2) {
      toast.error("Please enter the company name.");
      setIsSubmitting(false);
      return;
    }
    if (travelRoutes.length < 2) {
      toast.error("Please enter your travel routes with pricing.");
      setIsSubmitting(false);
      return;
    }


    try {
      // i will send this data to the API
      console.log("Travel Agent Profile data:", { companyName, travelRoutes, legalDocuments });

      // i will remove this once i finish my testing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsSaved(true); 
      toast.success("Your travel agency profile is now pending approval by the administrator.");
      resetForm(); 
    } catch (error) {
      toast.error("There was an error saving your profile. Please try again.");
    } finally {
      setIsSubmitting(false); 
    }
  };

  const onSavePartial = () => {
    //  i will implement partial save of data
    console.log("Saving partial data:", { companyName, travelRoutes, legalDocuments });

    toast.success("Your travel agency information has been saved. You can complete it later.");
  };

  const handleFileChange = (files) => {
    setLegalDocuments(files); 
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
            Your travel agency profile has been submitted and is pending approval by the administrator.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-blue-100 shadow-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Complete Your Travel Agency Profile</CardTitle>
          <CardDescription>
            Please provide your company details, travel routes with pricing, and legal documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                <Briefcase size={18} />
                <h3>Travel Agency Information</h3>
              </div>
              <Separator />

              <div className="space-y-2">
                <label htmlFor="companyName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Company Name</label>
                <Input
                  id="companyName"
                  placeholder="Safari Adventures"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="travelRoutes" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Travel Routes with Pricing</label>
                <Textarea
                  id="travelRoutes"
                  placeholder="Describe your travel routes and pricing structure"
                  className="min-h-[150px]"
                  value={travelRoutes}
                  onChange={(e) => setTravelRoutes(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="legalDocuments" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Legal Documents</label>
                <FileUploader
                  onChange={handleFileChange}
                  maxFiles={3}
                  acceptedFileTypes="application/pdf,image/*"
                />
                <p className="text-xs text-gray-500">
                  Upload your business license and other legal documents (PDF or images)
                </p>
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
            Your travel agency profile will be reviewed by an administrator before it becomes active.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}