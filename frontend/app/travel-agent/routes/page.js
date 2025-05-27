"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, PenLine, Trash2, Car, Plane, Ship, Train, Bus } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter, 
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRoutesStore } from "./store"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export default function TravelAgentRoutes() {
  const router = useRouter()
  const { 
    routes, 
    isLoading,
    fetchRoutes,
    createRoute,
    updateRoute,
    deleteRoute
  } = useRoutesStore()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [routeForm, setRouteForm] = useState({
    origin: "",
    destination: "",
    transportation_type: "bus",
    cost: "",
    description: ""
  })

  useEffect(() => {
    fetchRoutes()
  }, [fetchRoutes])

  const handleOpenCreateDialog = () => {
    setRouteForm({
      origin: "",
      destination: "",
      transportation_type: "bus",
      cost: "",
      description: ""
    })
    setIsCreateDialogOpen(true)
  }

  const handleOpenEditDialog = (route) => {
    setSelectedRoute(route)
    setRouteForm({
      origin: route.origin,
      destination: route.destination,
      transportation_type: route.transportation_type || "bus",
      cost: route.cost.toString(),
      description: route.description || ""
    })
    setIsEditDialogOpen(true)
  }

  const handleOpenDeleteDialog = (route) => {
    setSelectedRoute(route)
    setIsDeleteDialogOpen(true)
  }

  const handleCreateRoute = async () => {
    if (!routeForm.origin || !routeForm.destination || !routeForm.cost) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      await createRoute({
        ...routeForm,
        cost: parseFloat(routeForm.cost)
      })
      toast.success("Route created successfully")
      setIsCreateDialogOpen(false)
    } catch (error) {
      toast.error(`Failed to create route: ${error.message}`)
    }
  }

  const handleUpdateRoute = async () => {
    if (!routeForm.origin || !routeForm.destination || !routeForm.cost) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      await updateRoute(selectedRoute.id, {
        ...routeForm,
        cost: parseFloat(routeForm.cost)
      })
      toast.success("Route updated successfully")
      setIsEditDialogOpen(false)
    } catch (error) {
      toast.error(`Failed to update route: ${error.message}`)
    }
  }

  const handleDeleteRoute = async () => {
    try {
      await deleteRoute(selectedRoute.id)
      toast.success("Route deleted successfully")
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.error(`Failed to delete route: ${error.message}`)
    }
  }

  // Helper function to safely render description or schedule details
  const renderDescription = (route) => {
    // If we have schedule_details_formatted from backend, use it
    if (route.schedule_details_formatted) {
      return route.schedule_details_formatted;
    }
    
    // If we have schedule_details as an object, format it
    if (route.schedule_details && typeof route.schedule_details === 'object') {
      const { frequency, departure_time } = route.schedule_details;
      return `${frequency || ''} ${departure_time ? `at ${departure_time}` : ''}`.trim();
    }
    
    // If description is an object that looks like schedule_details
    if (route.description && typeof route.description === 'object') {
      if (route.description.frequency !== undefined || route.description.departure_time !== undefined) {
        const { frequency, departure_time } = route.description;
        return `${frequency || ''} ${departure_time ? `at ${departure_time}` : ''}`.trim();
      }
      // For other objects, stringify them safely
      return JSON.stringify(route.description);
    }
    
    // If it's a plain string or other primitive, return as is
    return route.description;
  }

  const getTransportIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'air': return <Plane className="h-5 w-5" />;
      case 'ferry': return <Ship className="h-5 w-5" />;
      case 'train': return <Train className="h-5 w-5" />;
      case 'bus': return <Bus className="h-5 w-5" />;
      default: return <Car className="h-5 w-5" />;
    }
  }

  const getTransportTypeBadge = (type) => {
    const types = {
      'air': { bg: 'bg-amber-100', text: 'text-amber-800' },
      'ferry': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
      'train': { bg: 'bg-purple-100', text: 'text-purple-800' },
      'bus': { bg: 'bg-green-100', text: 'text-green-800' },
      'car': { bg: 'bg-orange-100', text: 'text-orange-800' }
    }
    
    const style = types[type?.toLowerCase()] || types.car
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {type || 'Car'}
      </span>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Transport Routes</h1>
        <Button 
          onClick={handleOpenCreateDialog}
          className="bg-amber-700 hover:bg-amber-800">
          <Plus className="h-4 w-4 mr-2" /> Add New Route
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transport routes...</p>
        </div>
      ) : routes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route) => (
            <Card key={route.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="p-2 bg-amber-50 rounded-md mr-3">
                      {getTransportIcon(route.transportation_type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{route.origin} to {route.destination}</CardTitle>
                      <CardDescription className="mt-1">
                        {getTransportTypeBadge(route.transportation_type)}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-semibold">${parseFloat(route.cost).toFixed(2)}</span>
                  </div>
                  
                  {/* Use the helper function to safely render description */}
                  {(route.description || route.schedule_details) && (
                    <div>
                      <span className="text-gray-500">Details:</span>
                      <p className="text-sm mt-1">{renderDescription(route)}</p>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="border-t pt-4 flex justify-end gap-2 bg-gray-50">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleOpenEditDialog(route)}>
                  <PenLine className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleOpenDeleteDialog(route)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center">
            <Car className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">No transport routes available</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">Create your first transport route to start accepting bookings</p>
            <Button onClick={handleOpenCreateDialog} className="bg-amber-700 hover:bg-amber-800">
              <Plus className="h-4 w-4 mr-2" /> Create Route
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Route Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Transport Route</DialogTitle>
            <DialogDescription>
              Add a new transport route to your agency offerings
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origin">Origin*</Label>
                <Input
                  id="origin"
                  value={routeForm.origin}
                  onChange={(e) => setRouteForm({...routeForm, origin: e.target.value})}
                  placeholder="e.g., Dar es Salaam"
                />
              </div>
              <div>
                <Label htmlFor="destination">Destination*</Label>
                <Input
                  id="destination"
                  value={routeForm.destination}
                  onChange={(e) => setRouteForm({...routeForm, destination: e.target.value})}
                  placeholder="e.g., Zanzibar"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transportation_type">Transport Type*</Label>
                <Select
                  value={routeForm.transportation_type}
                  onValueChange={(value) => setRouteForm({...routeForm, transportation_type: value})}
                >
                  <SelectTrigger id="transportation_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="train">Train</SelectItem>
                      <SelectItem value="ferry">Ferry</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cost">Cost (USD)*</Label>
                <Input
                  id="cost"
                  type="number"
                  value={routeForm.cost}
                  onChange={(e) => setRouteForm({...routeForm, cost: e.target.value})}
                  placeholder="e.g., 50"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={routeForm.description}
                onChange={(e) => setRouteForm({...routeForm, description: e.target.value})}
                placeholder="Additional information about this transport route"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRoute} 
              className="bg-amber-700 hover:bg-amber-800">
              Create Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Route Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Transport Route</DialogTitle>
            <DialogDescription>
              Update the details of this transport route
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-origin">Origin*</Label>
                <Input
                  id="edit-origin"
                  value={routeForm.origin}
                  onChange={(e) => setRouteForm({...routeForm, origin: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-destination">Destination*</Label>
                <Input
                  id="edit-destination"
                  value={routeForm.destination}
                  onChange={(e) => setRouteForm({...routeForm, destination: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-transportation_type">Transport Type*</Label>
                <Select
                  value={routeForm.transportation_type}
                  onValueChange={(value) => setRouteForm({...routeForm, transportation_type: value})}
                >
                  <SelectTrigger id="edit-transportation_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="train">Train</SelectItem>
                      <SelectItem value="ferry">Ferry</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-cost">Cost (USD)*</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  value={routeForm.cost}
                  onChange={(e) => setRouteForm({...routeForm, cost: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={routeForm.description}
                onChange={(e) => setRouteForm({...routeForm, description: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRoute} 
              className="bg-amber-700 hover:bg-amber-800">
              Update Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Transport Route</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this route from {selectedRoute?.origin} to {selectedRoute?.destination}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteRoute} 
              variant="destructive">
              Delete Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}