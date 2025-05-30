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
import { destinationsService, uploadService, transportService } from "@/app/services/api"

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

  // New state for destinations
  const [destinations, setDestinations] = useState([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  const [newRoute, setNewRoute] = useState({
    origin_name: '',
    destination_id: '',
    transportation_type: 'bus',
    cost: '',
    description: '',
    route_details: ''
  })

  // Fetch destinations on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true)
      try {
        const destinationsData = await destinationsService.getAllDestinations()
        setDestinations(destinationsData)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load destinations')
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

      // Load profile data and routes separately
      const [profileResponse, routesData] = await Promise.all([
        fetch(`${API_URL}/travel-agents/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        transportService.getAgencyRoutes()
      ])

      if (profileResponse.ok) {
        const data = await profileResponse.json()
        setProfileData(data)
        setName(data.name || "")
        setDocumentUrl(data.document_url ?
          (Array.isArray(data.document_url) ? data.document_url : [data.document_url]) :
          [])
        setIsApproved(data.status === 'active')
        setIsSaved(true)
      } else if (profileResponse.status === 404) {
        // New profile
        setIsSaved(false)
      } else if (profileResponse.status === 401) {
        toast.error('Authentication Error: Session expired.')
        localStorage.removeItem('token')
        router.push('/login')
        return
      }

      // Process routes to ensure route_details is properly formatted
      const processedRoutes = (routesData || []).map(route => {
        let formattedRouteDetails = route.route_details;
        if (route.route_details && typeof route.route_details === 'object') {
          formattedRouteDetails = JSON.stringify(route.route_details, null, 2);
        }

        return {
          ...route,
          origin: route.origin_name,
          destination: route.destination_name,
          route_details_formatted: formattedRouteDetails || ''
        };
      });

      setRoutes(processedRoutes)

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
          // Existing document URL
          uploadedDocUrls.push(docFile)
        }
      }
      setIsUploading(false)

      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Authentication Error: You must be logged in.')
        setIsSubmitting(false)
        return
      }

      const submitData = {
        name: name,
        document_url: uploadedDocUrls,
        contact_email: profileData?.contact_email || '',
        contact_phone: profileData?.contact_phone || ''
      }

      const method = isSaved ? 'PUT' : 'POST'
      const response = await fetch(`${API_URL}/travel-agents/profile`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
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

  const handleAddRoute = async () => {
    if (!newRoute.origin_name || !newRoute.destination_id || !newRoute.cost) {
      toast.error("Origin, destination, and cost are required for a route")
      return
    }

    if (newRoute.origin_name.trim() === "") {
      toast.error("Origin name cannot be empty")
      return
    }

    if (parseFloat(newRoute.cost) <= 0) {
      toast.error("Cost must be a positive number")
      return
    }

    // Parse route_details if provided
    let route_details = null
    if (newRoute.route_details && newRoute.route_details.trim()) {
      try {
        route_details = JSON.parse(newRoute.route_details)
      } catch (e) {
        toast.error("Route details must be valid JSON format")
        return
      }
    }

    try {
      setIsSubmitting(true)
      
      // Create route through transport API
      const routeData = {
        origin_name: newRoute.origin_name.trim(),
        destination_id: parseInt(newRoute.destination_id),
        transportation_type: newRoute.transportation_type,
        cost: parseFloat(newRoute.cost),
        description: newRoute.description,
        route_details
      }

      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/transports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(routeData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create route')
      }

      const createdRoute = await response.json()
      
      // Find destination name for display
      const destinationName = destinations.find(d => d.id.toString() === newRoute.destination_id)?.name || 'Unknown'

      // Add to local routes for display
      setRoutes([
        ...routes,
        {
          ...createdRoute,
          origin: newRoute.origin_name,
          destination: destinationName,
          route_details_formatted: newRoute.route_details || ''
        }
      ])

      // Reset the form
      setNewRoute({
        origin_name: '',
        destination_id: '',
        transportation_type: 'bus',
        cost: '',
        description: '',
        route_details: ''
      })

      toast.success('Route added successfully!')
      
    } catch (error) {
      console.error('Error adding route:', error)
      toast.error('Failed to add route: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeRoute = async (index) => {
    const route = routes[index]
    if (!route.id) {
      // If route doesn't have an ID, just remove from local state
      setRoutes(routes.filter((_, i) => i !== index))
      return
    }

    try {
      setIsSubmitting(true)
      
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/transports/${route.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete route')
      }

      setRoutes(routes.filter((_, i) => i !== index))
      toast.success('Route removed successfully!')
      
    } catch (error) {
      console.error('Error removing route:', error)
      toast.error('Failed to remove route: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
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
    } else if (typeof text === 'object' && text !== null) {
      return JSON.stringify(text, null, 2);
    } else {
      return String(text || '');
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-600" />
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Travel Agent Profile</h1>
            <p className="text-gray-600">Manage your travel agency information and transport routes</p>
          </div>

          {/* Status Alert */}
          {!isApproved && isSaved && (
            <div className="mx-6 mt-6">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Pending Approval</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  Your profile is currently under review by our administrators. 
                  You will be notified once your account is approved and you can start accepting bookings.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {isApproved && (
            <div className="mx-6 mt-6">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Profile Approved</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your travel agency profile has been approved! You can now accept bookings and manage your routes.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Agency Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Agency Information
                </CardTitle>
                <CardDescription>
                  Provide details about your travel agency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Agency Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your agency name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Business Documents
                </CardTitle>
                <CardDescription>
                  Upload business registration and licensing documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader
                  onChange={handleFileChange}
                  maxFiles={3}
                  acceptedFileTypes="application/pdf,image/*"
                  value={documentUrl}
                />
                <div className="flex items-start gap-2 mt-2 bg-amber-50 p-3 rounded-md">
                  <Camera className="h-4 w-4 text-amber-700 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    Upload your business license and other legal documents (PDF or images).
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Transport Routes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Transport Routes
                </CardTitle>
                <CardDescription>
                  Add transport routes that your agency offers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Route Form */}
                <div className="p-4 border border-dashed border-gray-300 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">Add New Route</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="origin">Origin*</Label>
                      <Input
                        type="text"
                        placeholder="Enter origin city/location"
                        value={newRoute.origin_name}
                        onChange={(e) => setNewRoute({...newRoute, origin_name: e.target.value})}
                        disabled={isLoadingData}
                        className="w-full"
                      />
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
                    <div className="space-y-2">
                      <Label htmlFor="transportation_type">Transportation Type*</Label>
                      <Select
                        value={newRoute.transportation_type}
                        onValueChange={(value) => setNewRoute({...newRoute, transportation_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bus">Bus</SelectItem>
                          <SelectItem value="car">Car</SelectItem>
                          <SelectItem value="air">Air</SelectItem>
                          <SelectItem value="train">Train</SelectItem>
                          <SelectItem value="ferry">Ferry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cost">Cost (TZS)*</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter cost"
                        value={newRoute.cost}
                        onChange={(e) => setNewRoute({...newRoute, cost: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      placeholder="Describe this transport route (optional)"
                      value={newRoute.description}
                      onChange={(e) => setNewRoute({...newRoute, description: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="route_details">Route Details (JSON format - optional)</Label>
                    <Textarea
                      placeholder='{"departure_times": ["08:00", "14:00"], "booking_info": "Book 24h in advance"}'
                      value={newRoute.route_details}
                      onChange={(e) => setNewRoute({...newRoute, route_details: e.target.value})}
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleAddRoute}
                    className="bg-amber-600 hover:bg-amber-700"
                    disabled={isSubmitting || isLoadingData}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Route
                  </Button>
                </div>

                {/* Existing Routes */}
                {routes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Current Routes</h4>
                    <div className="space-y-3">
                      {routes.map((route, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {getTransportIcon(route.transportation_type)}
                                <span className="font-medium text-gray-900">
                                  {route.origin} → {route.destination}
                                </span>
                                <Badge variant="secondary" className="capitalize">
                                  {route.transportation_type}
                                </Badge>
                                <Badge variant="outline">
                                  TZS {route.cost?.toLocaleString()}
                                </Badge>
                              </div>
                              {route.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {safeRenderText(route.description)}
                                </p>
                              )}
                              {route.route_details_formatted && (
                                <details className="text-sm">
                                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                                    Route Details
                                  </summary>
                                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                    {route.route_details_formatted}
                                  </pre>
                                </details>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRoute(index)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t">
              <Button 
                type="submit" 
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-2" 
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