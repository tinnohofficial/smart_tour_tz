"use client"

import { useEffect } from "react" 

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, Plus, Edit, Trash, AlertTriangle, Loader2, MapPin } from "lucide-react"
import { useActivitiesStore } from "./activitiesStore" 

export default function ActivitiesPage() {
  const {
    filteredActivities,
    destinations,
    searchTerm,
    isLoading,
    isSubmitting,
    error,
    isAddDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    selectedActivity,
    formData,
    // Actions
    setSearchTerm,
    setIsAddDialogOpen,
    setIsEditDialogOpen,
    setIsDeleteDialogOpen,
    setFormData,
    fetchActivities,
    fetchDestinations,
    addActivity,
    prepareEditDialog,
    updateActivity,
    prepareDeleteDialog,
    deleteActivity,
    resetForm,
  } = useActivitiesStore(); 

  // Fetch initial data on component mount
  useEffect(() => {
    fetchActivities();
    fetchDestinations();
  }, [fetchActivities, fetchDestinations]);

  // --- Event Handlers ---
  const handleInputChange = (e) => { 
    const { name, value } = e.target;
    setFormData({ [name]: value });
  };

  const handleSelectChange = (value) => { 
    setFormData({ destination_id: value });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addActivity();
  };

  const handleUpdateSubmit = (e) => { 
    e.preventDefault();
    updateActivity(); 
  };

  const handleEditClick = (activity) => { 
      prepareEditDialog(activity); 
  };

  const handleDeleteClick = (activity) => { 
      prepareDeleteDialog(activity); 
  };

  // --- Helper Functions ---
  const getDestinationName = (destinationId) => { 
    const destination = destinations.find((dest) => dest.id === destinationId);
    return destination ? destination.name : "Unknown";
  };

  const formatDate = (dateString) => { 
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
        <p className="text-gray-600">Manage tourist activities in the system.</p>
      </div>

      {/* Error display could be handled via toasts, or kept here if needed */}
      {error && !isLoading && ( 
        <Alert variant="outline" className="border border-red-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          {/* Display error from store state */}
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search activities..."
            className="pl-8"
            value={searchTerm} // Read from store
            onChange={(e) => setSearchTerm(e.target.value)} // Use store action
          />
        </div>
        {/* Add Dialog - controlled by store state/actions */}
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm(); // Reset form on close
        }}>
          <DialogTrigger asChild>
            <Button className="border border-blue-200 hover:bg-blue-50" onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Activity</DialogTitle>
              <DialogDescription>
                Enter the details for the new activity. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            {/* Add Form - uses store state/actions */}
            <form onSubmit={handleAddSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right"> Name </Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="col-span-3"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="destination" className="text-right"> Destination </Label>
                  <div className="col-span-3">
                    <Select value={formData.destination_id} onValueChange={handleSelectChange}>
                      <SelectTrigger> <SelectValue placeholder="Select a destination" /> </SelectTrigger>
                      <SelectContent>
                        {destinations.map((destination) => (
                          <SelectItem key={destination.id} value={destination.id.toString()}>
                            {destination.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right"> Price ($) </Label>
                  <Input id="price" name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleInputChange} className="col-span-3"/>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2"> Description </Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} className="col-span-3" rows={4}/>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" className="hover:bg-blue-50" onClick={() => setIsAddDialogOpen(false)}> Cancel </Button>
                <Button type="submit" variant="outline" className="hover:bg-blue-50" disabled={isSubmitting}>
                  {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>) : ("Save Activity")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Activities</CardTitle>
          <CardDescription>View and manage all tourist activities</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading ? (
             <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                <p className="text-sm text-gray-500">Loading activities...</p>
              </div>
            </div>
          ) : /* Empty State */
          filteredActivities.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-8 text-center">
              <MapPin className="h-10 w-10 text-gray-500 mb-2" />
              <h3 className="font-medium">No activities found</h3>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm ? "Try a different search term" : "Add your first activity to get started"}
              </p>
            </div>
          ) : (
             /* Data Table */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.name}</TableCell>
                    <TableCell>{getDestinationName(activity.destination_id)}</TableCell>
                    <TableCell>
                      ${activity.price ? Number(activity.price).toFixed(2) : '0.00'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{activity.description}</TableCell>
                    <TableCell>{formatDate(activity.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" className='hover:bg-blue-50' size="sm" onClick={() => handleEditClick(activity)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className='hover:bg-blue-50' size="sm" onClick={() => handleDeleteClick(activity)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Activity Dialog */}
       <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
           setIsEditDialogOpen(open);
           if (!open) resetForm(); 
       }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>Update the details for this activity. Click save when you're done.</DialogDescription>
          </DialogHeader>
          {/* Edit Form  */}
          <form onSubmit={handleUpdateSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right"> Name </Label>
                <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} className="col-span-3"/>
              </div>
              {/* Destination cannot be edited */}
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="edit-destination-display" className="text-right"> Destination </Label>
                 <Input id="edit-destination-display" value={selectedActivity ? getDestinationName(selectedActivity.destination_id) : ''} className="col-span-3" disabled />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-price" className="text-right"> Price ($) </Label>
                <Input id="edit-price" name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleInputChange} className="col-span-3"/>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-description" className="text-right pt-2"> Description </Label>
                <Textarea id="edit-description" name="description" value={formData.description} onChange={handleInputChange} className="col-span-3" rows={4}/>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="border border-blue-200 hover:bg-blue-50" onClick={() => setIsEditDialogOpen(false)}> Cancel </Button>
              <Button type="submit" variant="outline" className="border border-blue-200 hover:bg-blue-50" disabled={isSubmitting}>
                {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>) : ("Update Activity")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - controlled by store state/actions */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the activity
              {selectedActivity && ` "${selectedActivity.name}"`} and remove it from the system.
              <br /><br />
              <strong>Note:</strong> Activities that are part of active bookings cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-red-50" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel> 
            <AlertDialogAction
              onClick={deleteActivity} 
              disabled={isSubmitting}
              className="bg-red-600 text-white hover:bg-red-500" 
            >
              {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>) : ("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}