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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { transportOriginsService, destinationsService, uploadService } from "@/app/services/api"

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

  // New state for origins and destinations
  const [origins, setOrigins] = useState([])
  const [destinations, setDestinations] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  const [newRoute, setNewRoute] = useState({
    origin_id: '',
    destination_id: '',
    transportation_type: 'bus',
    cost: '',
    description: '',
    route_details: ''
  })

  // Fetch origins and destinations on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true)
      try {
        const [originsData, destinationsData] = await Promise.all([
          transportOriginsService.getAllOrigins(),
          destinationsService.getAllDestinations()
        ])
        setOrigins(originsData)
        setDestinations(destinationsData)
      } catch (error) {
        console.error('Error fetching origins and destinations:', error)
        toast.error('Failed to load origins and destinations')
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [])

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

        // Process routes to ensure route_details is properly formatted
        const processedRoutes = (data.routes || []).map(route => {
          // Format route_details if it's an object
          let formattedRouteDetails = route.route_details;
          if (route.route_details && typeof route.route_details === 'object') {
            formattedRouteDetails = JSON.stringify(route.route_details, null, 2);
          }

          return {
            ...route,
            route_details_formatted: formattedRouteDetails || ''
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
            const { url } = await uploadService.uploadDocument(docFile)
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

      // Prepare data for submission with parsed route_details
      const processedRoutes = routes.map(route => {
        let route_details = null;
        if (route.route_details) {
          try {
            // Try to parse as JSON if it's a string
            route_details = typeof route.route_details === 'string'
              ? JSON.parse(route.route_details)
              : route.route_details;
          } catch (e) {
            // If parsing fails, keep as string
            route_details = route.route_details;
          }
        }

        return {
          origin_id: route.origin_id,
          destination_id: route.destination_id,
          transportation_type: route.transportation_type,
          cost: route.cost,
          description: route.description,
          route_details
        };
      });

      const profileData = {
        name: name,
        document_url: uploadedDocUrls,
        routes: processedRoutes
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
    if (!newRoute.origin_id || !newRoute.destination_id || !newRoute.cost) {
      toast.error("Origin, destination, and cost are required for a route")
      return
    }

    if (newRoute.origin_id === newRoute.destination_id) {
      toast.error("Origin and destination cannot be the same")
      return
    }

    // Validate cost is a number
    if (isNaN(parseFloat(newRoute.cost))) {
      toast.error("Cost must be a valid number")
      return
    }

    // Parse route_details if provided
    let route_details = null;
    if (newRoute.route_details.trim()) {
      try {
        route_details = JSON.parse(newRoute.route_details);
      } catch (e) {
        toast.error("Route details must be valid JSON format")
        return
      }
    }

    // Find origin and destination names for display
    const originName = origins.find(o => o.id.toString() === newRoute.origin_id)?.name || 'Unknown'
    const destinationName = destinations.find(d => d.id.toString() === newRoute.destination_id)?.name || 'Unknown'

    setRoutes([
      ...routes,
      {
        ...newRoute,
        origin: originName, // Keep for display compatibility
        destination: destinationName, // Keep for display compatibility
        cost: parseFloat(newRoute.cost),
        route_details,
        route_details_formatted: newRoute.route_details || ''
      }
    ])

    // Reset the form
    setNewRoute({
      origin_id: '',
      destination_id: '',
      transportation_type: 'bus',
      cost: '',
      description: '',
      route_details: ''
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

  // Helper function to safely render text content
  const safeRenderText = (text) => {
    if (typeof text === 'string') {
      return text;
    }
    return JSON.stringify(text);
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-white">Travel Agent Profile</h1>
                <p className="text-amber-100">Manage your agency information and transport routes</p>
              </div>
            </div>
          </div>

          {/* Status Alert */}
          {!isApproved && isSaved && (
            <div className="mx-6 mt-6">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-700" />
                <AlertTitle className="text-yellow-800">Profile Under Review</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  Your profile is currently being reviewed by our administrators. You'll be notified once it's approved.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {isApproved && (
            <div className="mx-6 mt-6">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-700" />
                <AlertTitle className="text-green-800">Profile Approved</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your travel agency profile has been approved! You can now receive booking requests.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Agency Information */}
            <Card>
              <CardHeader className="bg-gray-50 border-b">
                <div>
                  <CardTitle className="text-base font-semibold">Agency Information</CardTitle>
                  <CardDescription>Basic information about your travel agency</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Agency Name*</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    placeholder="Enter your travel agency name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
              </CardContent>
            </Card>

            {/* Transport Routes */}
            <Card>
              <CardHeader className="bg-gray-50 border-b">
                <div>
                  <CardTitle className="text-base font-semibold">Transport Routes</CardTitle>
                  <CardDescription>Add or modify your transportation services</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Existing routes display */}
                {routes.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-4">Current Routes ({routes.length})</h3>
                    <div className="space-y-3">
                      {routes.map((route, index) => (
                        <div key={route.id || `route-${index}`} className="border rounded-md p-4 bg-white hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-100">
                                {getTransportIcon(route.transportation_type)}
                              </div>
                              <div>
                                <h4 className="font-medium">{route.origin} → {route.destination}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="bg-blue-50 border-blue-200">
                                    {route.transportation_type}
                                  </Badge>
                                  <span className="text-sm text-gray-600">${route.cost}</span>
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRoute(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {route.description && (
                            <div className="mt-3 border-t pt-2">
                              <p className="text-xs text-gray-500">Description</p>
                              <p className="text-sm">{safeRenderText(route.description)}</p>
                            </div>
                          )}

                          {route.route_details && (
                            <div className="mt-3 border-t pt-2">
                              <p className="text-xs text-gray-500 mb-2">Route Details</p>
                              <div className="bg-gray-50 p-3 rounded text-sm font-mono text-gray-700 overflow-x-auto">
                                {typeof route.route_details === 'object' 
                                  ? JSON.stringify(route.route_details, null, 2)
                                  : route.route_details
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
                      <Select
                        value={newRoute.origin_id}
                        onValueChange={(value) => setNewRoute({...newRoute, origin_id: value})}
                        disabled={isLoadingData}
                      >
                        <SelectTrigger id="origin">
                          <SelectValue placeholder={isLoadingData ? "Loading origins..." : "Select origin location"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {origins.map((origin) => (
                              <SelectItem key={origin.id} value={origin.id.toString()}>
                                {origin.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destination">Destination*</Label>
                      <Select
                        value={newRoute.destination_id}
                        onValueChange={(value) => setNewRoute({...newRoute, destination_id: value})}
                        disabled={isLoadingData}
                      >
                        <SelectTrigger id="destination">
                          <SelectValue placeholder={isLoadingData ? "Loading destinations..." : "Select destination"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {destinations.map((destination) => (
                              <SelectItem key={destination.id} value={destination.id.toString()}>
                                {destination.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="transport_type">Transport Type*</Label>
                      <Select 
                        value={newRoute.transportation_type}
                        onValueChange={(value) => setNewRoute({...newRoute, transportation_type: value})}
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
                        value={newRoute.cost}
                        onChange={(e) => setNewRoute({...newRoute, cost: e.target.value})}
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

                  <div className="space-y-2 mb-4">
                    <Label htmlFor="route_details">Detailed Route Information (JSON)</Label>
                    <Textarea
                      id="route_details"
                      placeholder={`{
  "legs": [
    {
      "departure": "Manchester Airport",
      "arrival": "Doha International",
      "carrier": "Qatar Airways",
      "departure_time": "14:30",
      "arrival_time": "23:45",
      "flight_number": "QR23",
      "duration_hours": 7.5
    },
    {
      "departure": "Doha International",
      "arrival": "Kilimanjaro Airport", 
      "carrier": "Qatar Airways",
      "departure_time": "02:15",
      "arrival_time": "08:30",
      "flight_number": "QR1463",
      "duration_hours": 4.5
    }
  ],
  "total_duration": "24.5 hours",
  "booking_instructions": "Check-in 3 hours before departure. Layover in Doha.",
  "included_services": ["meals", "baggage", "seat_selection"]
}`}
                      value={newRoute.route_details}
                      onChange={(e) => setNewRoute({...newRoute, route_details: e.target.value})}
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <div className="flex items-start gap-2 mt-2 bg-blue-50 p-3 rounded-md">
                      <MapPin className="h-4 w-4 text-blue-700 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Multi-leg Route Support</p>
                        <p>Use JSON format to specify complex routes with multiple transportation legs, carrier details, timing, and special instructions. This gives you complete flexibility to describe your transport service.</p>
                      </div>
                    </div>
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
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t">
              <Button 
                type="submit" 
                className="bg-amber-700 hover:bg-amber-800 text-white px-8 py-2" 
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
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}