"use client"

import { useEffect } from "react"
import Image from "next/image"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Search, Plus, Edit, Trash, AlertTriangle, Loader2, MapPin, ImageIcon } from "lucide-react"
import { useDestinationsStore } from "./destinationsStore";
import { formatDate } from "@/app/utils/dateUtils" 

export default function DestinationsPage() {
  // Select state and actions from the Zustand store
  const {
    filteredDestinations,
    searchTerm,
    isLoading,
    isSubmitting,
    isUploading,
    error,
    isAddDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    selectedDestination,
    previewUrl,
    formData,
    // Actions
    fetchDestinations,
    setSearchTerm,
    setIsAddDialogOpen,
    setIsEditDialogOpen,
    setIsDeleteDialogOpen,
    setFormDataField,
    handleFileChange, 
    resetFormAndFile,
    addDestination,
    prepareEditDialog,
    updateDestination,
    prepareDeleteDialog,
    deleteDestination,
  } = useDestinationsStore();

  // Fetch initial data on component mount
  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]); 

  // --- Event Handlers that call store actions ---
  const onInputChange = (e) => { 
    const { name, value } = e.target;
    setFormDataField(name, value); // Use store action to update specific field
  };

  const onFileChange = (e) => {
      handleFileChange(e.target.files?.[0]); // Pass file to store action
  };

  const onAddSubmit = (e) => { 
    e.preventDefault();
    addDestination(); // Call store action
  };

  const onUpdateSubmit = (e) => {
    e.preventDefault();
    updateDestination(); // Call store action
  };

  const onEditClick = (destination) => { 
      prepareEditDialog(destination); // Call store action
  };

  const onDeleteClick = (destination) => { 
      prepareDeleteDialog(destination); // Call store action
  };

  // --- Helper Functions ---
  // Use shared formatDate utility

  // --- Render Logic ---
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold pb-2 tracking-tight">Destinations</h1>
        <p className="text-gray-600">Manage tourist destinations in the system.</p>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="border border-red-500" variant="outline">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search destinations..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetFormAndFile(); // Reset form on close
        }}>
          <DialogTrigger asChild>
            {/* Reset form when opening Add dialog */}
            <Button className="border border-blue-200 hover:bg-blue-50" onClick={() => { resetFormAndFile(); setIsAddDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Destination
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Destination</DialogTitle>
              <DialogDescription>
                Enter the details for the new destination. Click save when you&apos;re done.
              </DialogDescription>
            </DialogHeader>
            {/* Add Form */}
            <form onSubmit={onAddSubmit}>
              <div className="grid gap-4 py-4">
                 {/* Name Input */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right"> Name </Label>
                  <Input id="name" name="name" value={formData.name} onChange={onInputChange} className="col-span-3" required />
                </div>
                 {/* Region Input */}
                 <div className="grid grid-cols-4 items-center gap-4">
                   <Label htmlFor="region" className="text-right"> Region </Label>
                   <Input id="region" name="region" value={formData.region} onChange={onInputChange} className="col-span-3" required />
                 </div>
                 {/* Cost Input */}
                 <div className="grid grid-cols-4 items-center gap-4">
                   <Label htmlFor="cost" className="text-right"> Cost (USD) </Label>
                   <Input 
                     id="cost" 
                     name="cost" 
                     type="number" 
                     min="0"
                     step="0.01"
                     placeholder="0.00"
                     value={formData.cost} 
                     onChange={onInputChange} 
                     className="col-span-3" 
                   />
                 </div>
                 {/* Description Textarea */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2"> Description </Label>
                  <Textarea id="description" name="description" value={formData.description} onChange={onInputChange} className="col-span-3" rows={4} required />
                </div>
                 {/* Image Upload / URL Input */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="image" className="text-right pt-2"> Image </Label>
                  <div className="col-span-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input id="image" type="file" accept="image/*" onChange={onFileChange} className="cursor-pointer" />
                      </div>
                      {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    {/* Image Preview */}
                    {previewUrl ? (
                      <div className="relative mt-2 h-40 w-full overflow-hidden rounded-md border">
                        <Image src={previewUrl} alt="Preview" className="h-full w-full object-cover" fill />
                      </div>
                    ) : (
                       <div className="flex h-40 w-full items-center justify-center rounded-md border border-dashed border-blue-200">
                         <div className="flex flex-col items-center gap-1 text-gray-500">
                           <ImageIcon className="h-8 w-8" /> <span className="text-xs">No image selected</span>
                         </div>
                       </div>
                    )}
                    <p className="text-xs text-gray-500">Upload an image here.</p>
                  </div>
                </div>

              </div>
              <DialogFooter>
                <Button type="button" className="border border-blue-200 hover:bg-blue-50" variant="outline" onClick={() => setIsAddDialogOpen(false)}> Cancel </Button>
                <Button type="submit" className="border border-blue-200 hover:bg-blue-50" disabled={isSubmitting || isUploading}>
                  {isUploading ? 'Uploading...' : isSubmitting ? 'Saving...' : 'Save Destination'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Destinations</CardTitle>
          <CardDescription>View and manage all tourist destinations</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading ? (
             <div className="flex items-center justify-center p-8"><div className="flex flex-col items-center gap-2"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div><p className="text-sm text-gray-500">Loading destinations...</p></div></div>
          ) : /* Empty State */
          filteredDestinations.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-8 text-center"><MapPin className="h-10 w-10 text-gray-500 mb-2" /><h3 className="font-medium">No destinations found</h3><p className="text-sm text-gray-500 mt-1">{searchTerm ? "Try a different search term" : "Add your first destination to get started"}</p></div>
          ) : (
            /* Data Table */
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  {/* <TableHead>Region</TableHead> */}
                  <TableHead>Description</TableHead>
                  <TableHead>Cost (USD)</TableHead>
                  {/* <TableHead>Created</TableHead> */}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDestinations.map((destination) => (
                  <TableRow key={destination.id}>
                    <TableCell>
                      <div className="h-12 w-20 overflow-hidden rounded-md">
                        {destination.image_url ? (
                          <div key={`img-url-${destination.id}`} className="relative h-full w-full">
                            <Image src={destination.image_url} alt={destination.name} className="h-full w-full object-cover" fill />
                          </div>
                        ) : (
                          <div key={`img-placeholder-${destination.id}`} className="flex h-full w-full items-center justify-center bg-gray-500"><ImageIcon className="h-6 w-6 text-gray-500" /></div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{destination.name}</TableCell>
                    {/* <TableCell>{destination.region}</TableCell> */}
                    <TableCell className="max-w-xs truncate">{destination.description}</TableCell>
                    <TableCell>${destination.cost ? parseFloat(destination.cost).toFixed(2) : '0.00'}</TableCell>
                    {/* <TableCell>{formatDate(destination.created_at)}</TableCell> */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Edit Button */}
                        <Button key={`edit-${destination.id}`} variant="outline" className="hover:bg-blue-50" size="sm" onClick={() => onEditClick(destination)}> <Edit className="h-4 w-4" /> </Button>
                        {/* Delete Button */}
                        <Button key={`delete-${destination.id}`} variant="outline" className="hover:bg-blue-50" size="sm" onClick={() => onDeleteClick(destination)}> <Trash className="h-4 w-4" /> </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Destination Dialog */}
       <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
           setIsEditDialogOpen(open);
           if (!open) resetFormAndFile(); 
       }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Destination</DialogTitle>
            <DialogDescription>Update the details for this destination. Click save when you&apos;re done.</DialogDescription>
          </DialogHeader>
          {/* Edit Form */}
           <form onSubmit={onUpdateSubmit}>
             <div className="grid gap-4 py-4">
               {/* Name Input */}
               <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="edit-name" className="text-right"> Name </Label>
                 <Input id="edit-name" name="name" value={formData.name} onChange={onInputChange} className="col-span-3" required />
               </div>
               {/* Region Input */}
               <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="edit-region" className="text-right"> Region </Label>
                 <Input id="edit-region" name="region" value={formData.region} onChange={onInputChange} className="col-span-3" required />
               </div>
               {/* Cost Input */}
               <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="edit-cost" className="text-right"> Cost (USD) </Label>
                 <Input 
                   id="edit-cost" 
                   name="cost" 
                   type="number" 
                   min="0"
                   step="0.01"
                   placeholder="0.00"
                   value={formData.cost} 
                   onChange={onInputChange} 
                   className="col-span-3" 
                 />
               </div>
               {/* Description Textarea */}
               <div className="grid grid-cols-4 items-start gap-4">
                 <Label htmlFor="edit-description" className="text-right pt-2"> Description </Label>
                 <Textarea id="edit-description" name="description" value={formData.description} onChange={onInputChange} className="col-span-3" rows={4} required />
               </div>
               {/* Image Upload / URL Input */}
               <div className="grid grid-cols-4 items-start gap-4">
                 <Label htmlFor="edit-image" className="text-right pt-2"> Image </Label>
                 <div className="col-span-3 space-y-2">
                   <div className="flex items-center gap-2">
                     <div className="relative flex-1">
                       <Input id="edit-image" type="file" accept="image/*" onChange={onFileChange} className="cursor-pointer" />
                     </div>
                     {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                   </div>
                   {/* Image Preview */}
                   {previewUrl ? (
                     <div className="relative mt-2 h-40 w-full overflow-hidden rounded-md border">
                       <Image src={previewUrl} alt="Preview" className="h-full w-full object-cover" fill />
                     </div>
                   ) : (
                     <div className="flex h-40 w-full items-center justify-center rounded-md border border-dashed"><div className="flex flex-col items-center gap-1 text-muted-foreground"><ImageIcon className="h-8 w-8" /> <span className="text-xs">No image selected</span></div></div>
                   )}
                   <p className="text-xs text-gray-500">Upload a new image</p>
                 </div>
               </div>
              
             </div>
             <DialogFooter>
               <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}> Cancel </Button>
               <Button type="submit" disabled={isSubmitting || isUploading}>
                  {isUploading ? 'Uploading...' : isSubmitting ? 'Updating...' : 'Update Destination'}
               </Button>
             </DialogFooter>
           </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the destination
              {selectedDestination && ` "${selectedDestination.name}"`} and remove it from the system.
              <br /><br />
              <strong>Note:</strong> Destinations with associated activities cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-red-50" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteDestination} // Call store action
              disabled={isSubmitting} // Read from store
              className="text-white bg-red-600 hover:bg-red-500"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : ( "Delete" )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}