"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  PenLine,
  Trash2,
  Car,
  Plane,
  Ship,
  Train,
  Bus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRoutesStore } from "./store";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatTZS } from "@/app/utils/currency";
import { destinationsService } from "@/app/services/api";

import { Switch } from "@/components/ui/switch";

export default function TravelAgentRoutes() {
  const router = useRouter();
  const {
    routes,
    isLoading,
    fetchRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
  } = useRoutesStore();

  // New state for destinations
  const [destinations, setDestinations] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeForm, setRouteForm] = useState({
    origin_name: "",
    destination_id: "",
    transportation_type: "bus",
    cost: "",
    description: "",
  });

  // Fetch origins and destinations on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const destinationsData = await destinationsService.getAllDestinations();
        setDestinations(destinationsData);
      } catch (error) {
        console.error("Error fetching destinations:", error);
        toast.error("Failed to load destinations");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
    fetchRoutes();
  }, [fetchRoutes]);

  const handleOpenCreateDialog = () => {
    setRouteForm({
      origin_name: "",
      destination_id: "",
      transportation_type: "bus",
      cost: "",
      description: "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (route) => {
    console.log("Edit dialog route data:", route);
    console.log("Transportation type:", route.transportation_type);
    setSelectedRoute(route);
    const formData = {
      origin_name: route.origin_name || "",
      destination_id: route.destination_id?.toString() || "",
      transportation_type: route.transportation_type || "bus",
      cost: route.cost?.toString() || "",
      description: route.description || "",
    };
    console.log("Form data being set:", formData);
    setRouteForm(formData);
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (route) => {
    setSelectedRoute(route);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateRoute = async () => {
    if (
      !routeForm.origin_name ||
      !routeForm.destination_id ||
      !routeForm.cost
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (routeForm.origin_name.trim() === "") {
      toast.error("Origin name cannot be empty");
      return;
    }

    try {
      await createRoute({
        origin_name: routeForm.origin_name.trim(),
        destination_id: parseInt(routeForm.destination_id),
        transportation_type: routeForm.transportation_type,
        cost: parseFloat(routeForm.cost),
        description: routeForm.description,
      });
      toast.success("Route created successfully");
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error(`Failed to create route: ${error.message}`);
    }
  };

  const handleUpdateRoute = async () => {
    if (
      !routeForm.origin_name ||
      !routeForm.destination_id ||
      !routeForm.cost
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (routeForm.origin_name.trim() === "") {
      toast.error("Origin name cannot be empty");
      return;
    }

    try {
      await updateRoute(selectedRoute.id, {
        origin_name: routeForm.origin_name.trim(),
        destination_id: parseInt(routeForm.destination_id),
        transportation_type: routeForm.transportation_type,
        cost: parseFloat(routeForm.cost),
        description: routeForm.description,
      });
      toast.success("Route updated successfully");
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error(`Failed to update route: ${error.message}`);
    }
  };

  const handleDeleteRoute = async () => {
    try {
      await deleteRoute(selectedRoute.id);
      toast.success("Route deleted successfully");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error(`Failed to delete route: ${error.message}`);
    }
  };

  // Helper function to safely render description or schedule details
  const renderDescription = (route) => {
    // If we have schedule_details_formatted from backend, use it
    if (route.schedule_details_formatted) {
      return route.schedule_details_formatted;
    }

    // If we have schedule_details as an object, format it
    if (route.schedule_details && typeof route.schedule_details === "object") {
      const { frequency, departure_time } = route.schedule_details;
      return `${frequency || ""} ${departure_time ? `at ${departure_time}` : ""}`.trim();
    }

    // If description is an object that looks like schedule_details
    if (route.description && typeof route.description === "object") {
      if (
        route.description.frequency !== undefined ||
        route.description.departure_time !== undefined
      ) {
        const { frequency, departure_time } = route.description;
        return `${frequency || ""} ${departure_time ? `at ${departure_time}` : ""}`.trim();
      }
      // For other objects, stringify them safely
      return JSON.stringify(route.description);
    }

    // If it's a plain string or other primitive, return as is
    return route.description;
  };

  const getTransportIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "air":
        return <Plane className="h-5 w-5" />;
      case "ferry":
        return <Ship className="h-5 w-5" />;
      case "train":
        return <Train className="h-5 w-5" />;
      case "bus":
        return <Bus className="h-5 w-5" />;
      default:
        return <Car className="h-5 w-5" />;
    }
  };

  if (isLoadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transport data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Transport Routes</h1>
        <Button
          onClick={handleOpenCreateDialog}
          className="bg-amber-700 hover:bg-amber-800 text-white"
        >
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getTransportIcon(route.transportation_type)}
                    <CardTitle className="text-lg truncate">
                      {route.origin_name || route.from_location} →{" "}
                      {route.destination_name || route.to_location}
                    </CardTitle>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          route.available
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {route.available ? "Available" : "Unavailable"}
                      </span>
                      <Switch
                        checked={route.available || false}
                        onCheckedChange={async (checked) => {
                          try {
                            await updateRoute(route.id, {
                              available: checked,
                            });
                          } catch (err) {
                            // Error handled in store
                          }
                        }}
                        aria-label={
                          route.available
                            ? "Mark as unavailable"
                            : "Mark as available"
                        }
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cost:</span>
                    <span className="font-semibold">
                      {formatTZS(route.cost)}
                    </span>
                  </div>

                  {renderDescription(route) && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                      <span className="text-gray-600">Details: </span>
                      <span>{renderDescription(route)}</span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-3 gap-2">
                <div className="flex-1"></div>
                {/* <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEditDialog(route)}
                  className="flex-1"
                >
                  <PenLine className="h-4 w-4 mr-1" />
                  Edit
                </Button> */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenDeleteDialog(route)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
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
            <p className="text-gray-400 text-sm mt-1 mb-4">
              Create your first transport route to start accepting bookings
            </p>
            <Button
              onClick={handleOpenCreateDialog}
              className="bg-amber-700 hover:bg-amber-800"
            >
              <Plus className="h-4 w-4 mr-2" /> Create Route
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Route Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Transport Route</DialogTitle>
            <DialogDescription>
              Add a new transport route to your agency offerings
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origin">Origin</Label>
                <Input
                  id="origin"
                  type="text"
                  placeholder="Enter origin city/location"
                  value={routeForm.origin_name}
                  onChange={(e) =>
                    setRouteForm({ ...routeForm, origin_name: e.target.value })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="destination">Destination*</Label>
                <Select
                  value={routeForm.destination_id}
                  onValueChange={(value) =>
                    setRouteForm({ ...routeForm, destination_id: value })
                  }
                >
                  <SelectTrigger id="destination">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {destinations.map((destination) => (
                        <SelectItem
                          key={destination.id}
                          value={destination.id.toString()}
                        >
                          {destination.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transportation_type">Transport Type*</Label>
                <Select
                  value={routeForm.transportation_type}
                  onValueChange={(value) => {
                    console.log(
                      "Create form transport type changed to:",
                      value,
                    );
                    setRouteForm({ ...routeForm, transportation_type: value });
                  }}
                >
                  <SelectTrigger id="transportation_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="train">Train</SelectItem>
                      <SelectItem value="ferry">Ferry</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cost">Cost (TZS)*</Label>
                <Input
                  id="cost"
                  type="number"
                  value={routeForm.cost}
                  onChange={(e) =>
                    setRouteForm({ ...routeForm, cost: e.target.value })
                  }
                  placeholder="e.g., 120000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Route Description</Label>
              <Textarea
                id="description"
                value={routeForm.description}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, description: e.target.value })
                }
                placeholder="Additional information about this transport route, schedule details, etc."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRoute}
              className="bg-amber-700 hover:bg-amber-800"
            >
              Create Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Route Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
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
                  type="text"
                  placeholder="Enter origin city/location"
                  value={routeForm.origin_name}
                  onChange={(e) =>
                    setRouteForm({ ...routeForm, origin_name: e.target.value })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="edit-destination">Destination*</Label>
                <Select
                  value={routeForm.destination_id}
                  onValueChange={(value) =>
                    setRouteForm({ ...routeForm, destination_id: value })
                  }
                >
                  <SelectTrigger id="edit-destination">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {destinations.map((destination) => (
                        <SelectItem
                          key={destination.id}
                          value={destination.id.toString()}
                        >
                          {destination.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-transportation_type">
                  Transport Type*
                </Label>
                <Select
                  key={`edit-transport-${selectedRoute?.id || "new"}`}
                  value={routeForm.transportation_type}
                  onValueChange={(value) => {
                    console.log("Edit form transport type changed to:", value);
                    setRouteForm({ ...routeForm, transportation_type: value });
                  }}
                >
                  <SelectTrigger id="edit-transportation_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="air">Air</SelectItem>
                      <SelectItem value="train">Train</SelectItem>
                      <SelectItem value="ferry">Ferry</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-cost">Cost (TZS)*</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  value={routeForm.cost}
                  onChange={(e) =>
                    setRouteForm({ ...routeForm, cost: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Route Description</Label>
              <Textarea
                id="edit-description"
                value={routeForm.description}
                onChange={(e) =>
                  setRouteForm({ ...routeForm, description: e.target.value })
                }
                placeholder="Additional information about this transport route, schedule details, etc."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRoute}
              className="bg-amber-700 hover:bg-amber-800 text-white"
            >
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
              Are you sure you want to delete this transport route? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedRoute && (
            <div className="py-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium">
                  {selectedRoute.origin_name || selectedRoute.from_location} →{" "}
                  {selectedRoute.destination_name || selectedRoute.to_location}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedRoute.transportation_type} •{" "}
                  {formatTZS(selectedRoute.cost)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDeleteRoute} variant="destructive">
              Delete Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
