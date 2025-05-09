"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUploader } from "../../components/file-uploader"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Briefcase, Save, ArrowLeft, Loader2, Plus, Trash2, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTravelAgentProfileStore } from "./store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function TravelAgentProfile() {
  const router = useRouter()
  const {
    name,
    routes,
    documentUrl,
    isSubmitting,
    isUploading,
    isSaved,
    setName,
    setRoutes,
    setDocumentUrl,
    addRoute,
    updateRoute,
    removeRoute,
    fetchProfile,
    submitProfile,
    savePartial
  } = useTravelAgentProfileStore()

  const [newRoute, setNewRoute] = useState({
    origin: '',
    destination: '',
    transport_type: 'bus',
    price: '',
    description: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const onSubmit = async (event) => {
    event.preventDefault()

    if (!name) {
      toast.error("Company name is required")
      return
    }

    if (routes.length === 0) {
      toast.error("Please add at least one transport route")
      return
    }

    if (documentUrl.length === 0) {
      toast.error("Please upload at least one legal document")
      return
    }

    await submitProfile()
  }

  const handleAddRoute = () => {
    if (!newRoute.origin || !newRoute.destination || !newRoute.price) {
      toast.error("Origin, destination, and price are required for a route")
      return
    }

    // Validate price is a number
    if (isNaN(parseFloat(newRoute.price))) {
      toast.error("Price must be a valid number")
      return
    }

    addRoute({
      ...newRoute,
      price: parseFloat(newRoute.price)
    })

    // Reset the form
    setNewRoute({
      origin: '',
      destination: '',
      transport_type: 'bus',
      price: '',
      description: ''
    })
  }

  const handleFileChange = (files) => {
    setDocumentUrl(files)
  }

  return (
    <div className="container max-w-3xl mx-auto py-10">
      <Button variant="outline" className="mb-6 hover:bg-blue-100" onClick={() => router.push("/travel-agent/dashboard")}>
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
            Please provide your company details, transport routes, and legal documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600 font-medium mb-2">
                <Briefcase size={18} />
                <h3>Basic Information</h3>
              </div>
              <Separator />

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Company Name*</label>
                <Input
                  id="name"
                  placeholder="Safari Adventures"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              

              <div className="space-y-2 mt-6">
                <label htmlFor="documentUrl" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Legal Documents*</label>
                <FileUploader
                  onChange={handleFileChange}
                  maxFiles={3}
                  acceptedFileTypes="application/pdf,image/*"
                  value={documentUrl}
                />
                <p className="text-xs text-gray-500">
                  Upload your business license and other legal documents (PDF or images)
                </p>
              </div>

              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-2 text-blue-600 font-medium">
                  <Plus size={18} />
                  <h3>Transport Routes</h3>
                </div>
                <Separator />

                {/* Transport routes list */}
                {routes.length > 0 && (
                  <div className="space-y-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-700">Saved Routes</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {routes.map((route, index) => (
                        <div key={index} className="border rounded-md p-4 bg-gray-50 relative">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute top-2 right-2 h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                            onClick={() => removeRoute(index)}
                          >
                            <Trash2 size={16} />
                          </Button>
                          <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                              <span className="text-xs text-gray-500">Origin:</span>
                              <p className="text-sm font-medium">{route.origin}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Destination:</span>
                              <p className="text-sm font-medium">{route.destination}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                              <span className="text-xs text-gray-500">Type:</span>
                              <p className="text-sm font-medium capitalize">{route.transport_type}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Price:</span>
                              <p className="text-sm font-medium">${parseFloat(route.price).toFixed(2)}</p>
                            </div>
                          </div>
                          {route.description && (
                            <div>
                              <span className="text-xs text-gray-500">Description:</span>
                              <p className="text-sm">{route.description}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add new route form */}
                <div className="border rounded-md p-4 bg-white">
                  <h4 className="text-sm font-medium mb-4">Add New Transport Route</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="origin">Origin*</Label>
                      <Input
                        id="origin"
                        placeholder="e.g., Dar es Salaam"
                        value={newRoute.origin}
                        onChange={(e) => setNewRoute({...newRoute, origin: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destination">Destination*</Label>
                      <Input
                        id="destination"
                        placeholder="e.g., Zanzibar"
                        value={newRoute.destination}
                        onChange={(e) => setNewRoute({...newRoute, destination: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="transport_type">Transport Type*</Label>
                      <Select 
                        value={newRoute.transport_type}
                        onValueChange={(value) => setNewRoute({...newRoute, transport_type: value})}
                      >
                        <SelectTrigger id="transport_type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="air">Air</SelectItem>
                          <SelectItem value="bus">Bus</SelectItem>
                          <SelectItem value="train">Train</SelectItem>
                          <SelectItem value="ferry">Ferry</SelectItem>
                          <SelectItem value="car">Car</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (USD)*</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="e.g., 50"
                        value={newRoute.price}
                        onChange={(e) => setNewRoute({...newRoute, price: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <Label htmlFor="description">Route Description</Label>
                    <Input
                      id="description"
                      placeholder="Any additional details about this transport route"
                      value={newRoute.description}
                      onChange={(e) => setNewRoute({...newRoute, description: e.target.value})}
                    />
                  </div>

                  <Button 
                    type="button" 
                    onClick={handleAddRoute}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Route
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button type="button" variant="outline" className="flex-1 hover:bg-blue-100" onClick={savePartial}>
                <Save className="mr-2 h-4 w-4" /> Save Progress
              </Button>
              <Button 
                type="submit" 
                className="flex-1 text-white bg-blue-600 hover:bg-blue-700" 
                disabled={isSubmitting || isUploading}
              >
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