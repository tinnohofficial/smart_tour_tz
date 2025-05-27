"use client"

import { useEffect, useState, useCallback } from "react"
import { MapPin, Briefcase, Loader2, Save, Camera, CheckCircle, AlertCircle, Car, Plus, Trash2, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { FileUploader } from "../../components/file-uploader"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function TravelAgentProfile() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [documentUrl, setDocumentUrl] = useState([])
  const [name, setName] = useState("")
  const [routes, setRoutes] = useState([])
  const [isApproved, setIsApproved] = useState(false)

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

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Authentication Error: You must be logged in.')
        router.push('/login')
        return
      }

      const response = await fetch(`${API_URL}/travel-agents/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
        setName(data.name || "")
        
        // Process routes to ensure schedule_details is properly formatted
        const processedRoutes = (data.routes || []).map(route => {
          // Format any objects in description field
          let formattedDescription = route.description;
          if (route.description && typeof route.description === 'object') {
            // If description looks like schedule_details
            if (route.description.frequency !== undefined || route.description.departure_time !== undefined) {
              formattedDescription = `${route.description.frequency || ''} ${route.description.departure_time ? `at ${route.description.departure_time}` : ''}`.trim();
            } else {
              // For other objects, stringify them safely
              formattedDescription = JSON.stringify(route.description);
            }
          }

          // If schedule_details is present, ensure it's properly handled
          if (route.schedule_details && typeof route.schedule_details === 'object') {
            return {
              ...route,
              description: formattedDescription,
              // Store schedule_details but don't render it directly
              schedule_details_formatted: `${route.schedule_details.frequency || ''} ${route.schedule_details.departure_time ? `at ${route.schedule_details.departure_time}` : ''}`.trim()
            };
          }
          
          return {
            ...route,
            description: formattedDescription
          };
        });
        
        setRoutes(processedRoutes)
        setDocumentUrl(data.document_url ? 
          (Array.isArray(data.document_url) ? data.document_url : [data.document_url]) : 
          [])
        setIsApproved(data.status === 'active')
        setIsSaved(true)
      } else if (response.status === 404) {
        // New profile
        setIsSaved(false)
      } else if (response.status === 401) {
        toast.error('Authentication Error: Session expired.')
        localStorage.removeItem('token')
        router.push('/login')
        return
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      toast.error("Failed to load profile data")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Upload any new documents first
      setIsUploading(true)
      const uploadedDocUrls = []
      
      for (const docFile of documentUrl) {
        if (docFile instanceof File) {
          try {
            const formData = new FormData()
            formData.append("file", docFile)
            
            const response = await fetch("/api/upload-url", {
              method: "POST",
              body: formData,
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || "Failed to upload file")
            }

            const { url } = await response.json()
            uploadedDocUrls.push(url)
          } catch (error) {
            console.error('Upload Error:', error)
            toast.error(`Failed to upload document: ${docFile.name}`)
            setIsSubmitting(false)
            setIsUploading(false)
            return
          }
        } else {
          uploadedDocUrls.push(docFile) // Keep existing URLs
        }
      }
      setIsUploading(false)

      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Authentication Error: You must be logged in.')
        setIsSubmitting(false)
        return
      }

      // Prepare data for submission using the correct field names
      const profileData = {
        name: name,
        document_url: uploadedDocUrls,
        routes: routes
      }

      const method = isSaved ? 'PUT' : 'POST'
      const response = await fetch(`${API_URL}/travel-agents/profile`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save profile')
      }

      const responseData = await response.json()
      setIsSaved(true)
      setProfileData(responseData)
      setDocumentUrl(uploadedDocUrls)
      
      toast.success('Profile saved successfully!', {
        description: isSaved ? 'Your profile has been updated.' : 'Your profile is now pending approval by the administrator.',
      })

    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Error saving profile', {
        description: error.message || 'There was an error saving your profile. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
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

    setRoutes([
      ...routes,
      {
        ...newRoute,
        price: parseFloat(newRoute.price),
        // Add empty schedule_details_formatted to maintain consistent structure
        schedule_details_formatted: ''
      }
    ])

    // Reset the form
    setNewRoute({
      origin: '',
      destination: '',
      transport_type: 'bus',
      price: '',
      description: ''
    })
  }

  const removeRoute = (index) => {
    setRoutes(routes.filter((_, i) => i !== index))
  }

  const handleFileChange = (files) => {
    setDocumentUrl(files)
  }

  const getTransportIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'air': return <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path><path d="M14.05 2a9 9 0 0 1 8 7.94"></path><path d="M14.05 6A5 5 0 0 1 18 10"></path></svg>;
      case 'ferry': return <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"></path></svg>;
      case 'train': return <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="2" x2="9" y2="4"></line><line x1="15" y1="2" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="22"></line><line x1="15" y1="20" x2="15" y2="22"></line><line x1="20" y1="9" x2="22" y2="9"></line><line x1="20" y1="15" x2="22" y2="15"></line><line x1="2" y1="9" x2="4" y2="9"></line><line x1="2" y1="15" x2="4" y2="15"></line></svg>;
      case 'bus': return <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>;
      default: return <Car className="h-4 w-4" />;
    }
  }

  const safeRenderText = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'object') {
      // If it looks like a schedule_details object
      if (value.frequency !== undefined || value.departure_time !== undefined) {
        return `${value.frequency || ''} ${value.departure_time ? `at ${value.departure_time}` : ''}`.trim();
      }
      // Otherwise stringify
      return JSON.stringify(value);
    }
    
    return value;
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading travel agency profile data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-1">
      {/* Page Header */}
      <div className="bg-amber-700 p-4 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Travel Agency Profile</h1>
            <p className="text-amber-100 text-sm">Manage your agency information and transport routes</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column - Agency Preview Card */}
          <div className="md:col-span-4">
            <Card className="bg-white border-0 py-0 shadow-md overflow-hidden">
              <div className="bg-gradient-to-br from-amber-700 to-amber-800 h-24"></div>
              <div className="px-6 pb-6 -mt-12 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-amber-100 border-4 border-white shadow-md flex items-center justify-center mb-3">
                  {name ? (
                    <span className="text-3xl font-semibold text-amber-700">{name.charAt(0)}</span>
                  ) : (
                    <Briefcase className="h-10 w-10 text-amber-600" />
                  )}
                </div>
                
                <h2 className="text-xl font-semibold">{name || "Agency Name"}</h2>
                
                <div className="flex gap-2 mt-4">
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0">Travel Agency</Badge>
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
                    <Car className="h-4 w-4 text-amber-700" />
                    <span className="text-sm font-medium">Routes:</span>
                    <span className="text-sm text-gray-600">{routes?.length || 0} transport routes</span>
                  </div>
                  
                  <div className="flex items-center gap-2 py-2 border-t">
                    <UploadCloud className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Documents:</span>
                    <span className="text-sm text-gray-600">{documentUrl?.length || 0} uploaded</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Profile Form */}
          <div className="md:col-span-8 space-y-6">
            {/* Agency Information Card */}
            <Card className="shadow-sm py-0">
              <CardHeader className="bg-gray-50 border-b p-4 flex flex-row items-start">
                <Briefcase className="h-5 w-5 text-amber-700 mt-0.5 mr-2" />
                <div>
                  <CardTitle className="text-base font-semibold">Agency Information</CardTitle>
                  <CardDescription>Basic information about your travel agency</CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">Agency Name</label>
                    <Input
                      id="name"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Safari Adventures"
                      className="border-gray-300 focus:border-amber-600"
                    />
                  </div>
                  
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-700" />
                    <AlertDescription className="text-amber-700 text-sm">
                      Contact information from your account will be used for agency communication.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <label htmlFor="documentUrl" className="text-sm font-medium text-gray-700">Legal Documents</label>
                    <FileUploader
                      onChange={handleFileChange}
                      maxFiles={3}
                      acceptedFileTypes="application/pdf,image/*"
                      value={documentUrl}
                    />
                    <div className="flex items-start gap-2 mt-2 bg-gray-50 p-2 rounded-md">
                      <Camera className="h-4 w-4 text-amber-700 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">
                        Upload your business license and other legal documents (PDF or images).
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transport Routes Card */}
            <Card className="shadow-sm py-0">
              <CardHeader className="bg-gray-50 border-b p-4 flex flex-row items-start">
                <Car className="h-5 w-5 text-amber-700 mt-0.5 mr-2" />
                <div>
                  <CardTitle className="text-base font-semibold">Transport Routes</CardTitle>
                  <CardDescription>Add or modify your transportation services</CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Routes list */}
                {routes.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">Current Routes ({routes.length})</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {routes.map((route, index) => (
                        <div key={index} className="border rounded-md p-4 relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() => removeRoute(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Origin</p>
                              <p className="font-medium">{route.origin}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Destination</p>
                              <p className="font-medium">{route.destination}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div className="flex items-center">
                              <div className="mr-2 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                {getTransportIcon(route.transport_type)}
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Type</p>
                                <p className="font-medium capitalize">{route.transport_type || 'Car'}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Price</p>
                              <p className="font-medium">${parseFloat(route.price).toFixed(2)}</p>
                            </div>
                          </div>
                          
                          {/* Show schedule details if present */}
                          {route.schedule_details_formatted && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">Schedule</p>
                              <p className="text-sm">{route.schedule_details_formatted}</p>
                            </div>
                          )}
                          
                          {route.description && (
                            <div className="mt-3 border-t pt-2">
                              <p className="text-xs text-gray-500">Description</p>
                              <p className="text-sm">{safeRenderText(route.description)}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border rounded-md bg-gray-50">
                    <Car className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No routes added yet</p>
                    <p className="text-sm text-gray-400">Add your first transport route below</p>
                  </div>
                )}

                {/* Add new route form */}
                <div className="border rounded-md p-4 mt-6 bg-white">
                  <h3 className="text-sm font-medium mb-4 flex items-center">
                    <Plus className="h-4 w-4 mr-1 text-amber-700" />
                    Add New Transport Route
                  </h3>
                  
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
                    className="w-full mt-2 bg-gray-100 hover:bg-gray-200 text-gray-800"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Route
                  </Button>
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