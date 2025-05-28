"use client"

import { useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, X, AlertTriangle, User, Hotel, Briefcase, FileText } from "lucide-react"

// Import the Zustand store
import { useApplicationsStore } from "./applicationsStore"; // Adjust path if needed
import { formatDate } from "@/app/utils/dateUtils";
import { RoleBadge } from "@/app/components/shared/RoleBadge";

export default function ApplicationsPage() {
  // Select state and actions from the Zustand store
  const {
    applications,
    isLoading,
    error,
    selectedApplication,
    isDetailsOpen,
    isProcessing,
    // Actions
    fetchApplications,
    approveApplication,
    rejectApplication,
    viewApplicationDetails,
    setIsDetailsOpen,
  } = useApplicationsStore();

  // Fetch initial data on component mount
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]); // Depend on the stable fetch function from the store

  // Use shared date formatting utility
  const formatApplicationDate = (dateString) => {
    if (!dateString) return "2025-05-01"; // Default date if none provided
    return new Date(dateString).toLocaleString();
  };

  // --- Render Logic ---
  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Account Applications</h1>
        <p className="text-gray-500 text-sm sm:text-base">Review and manage account applications.</p>
      </div>

      {/* Error Display (reads from store state) */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={fetchApplications} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Applications</CardTitle>
          <CardDescription>Review and approve or reject account applications</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-2">
                 <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                 <p className="text-sm text-gray-500">Loading applications...</p>
              </div>
            </div>
          ) : /* Empty State */
          applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="font-medium">No applications found</h3>
              <p className="text-sm text-gray-500 mt-1">
                There are no pending applications at the moment
              </p>
            </div>
          ) : (
            /* Data Table - Make responsive */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Name</TableHead>
                    <TableHead className="min-w-[180px]">Email</TableHead>
                    <TableHead className="min-w-[100px]">Role</TableHead>
                    <TableHead className="min-w-[120px] hidden sm:table-cell">Submitted</TableHead>
                    <TableHead className="text-right min-w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        <div className="truncate max-w-[120px]">{application.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="truncate max-w-[180px]">{application.email}</div>
                      </TableCell>
                      <TableCell><RoleBadge role={application.role} /></TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(application.submitted_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col sm:flex-row justify-end gap-1 sm:gap-2">
                          {/* Use store action to open details */}
                          <Button variant="outline" className="hover:bg-amber-50 text-xs sm:text-sm" size="sm" onClick={() => viewApplicationDetails(application)}>
                            View Details
                          </Button>
                          {/* Use store action for approve */}
                          <Button
                            variant="outline"
                            className="hover:bg-amber-50 text-xs sm:text-sm"
                            size="sm"
                            onClick={() => approveApplication(application.user_id)}
                            disabled={isProcessing} // Read from store
                          >
                            <CheckCircle className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Application Details</DialogTitle>
            <DialogDescription className="text-sm">
              Review all information provided by the applicant before making a decision.
            </DialogDescription>
          </DialogHeader>

          {/* Read selectedApplication from store */}
          {selectedApplication && (
            <div className="py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedApplication.name}</h3>
                  <p className="text-gray-500 break-all">{selectedApplication.email}</p>
                </div>
                <div><RoleBadge role={selectedApplication.role} /></div>
              </div>

              <div className="space-y-6">
                {/* Tour Guide Details */}
                {selectedApplication.role === "tour_guide" && selectedApplication.details && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                       <div><h4 className="text-sm font-medium text-gray-500 mb-1">Full Name</h4><p className="break-words">{selectedApplication.details.full_name}</p></div>
                       <div><h4 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h4><p className="break-words">{selectedApplication.phone_number}</p></div>
                       <div><h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4><p className="break-words">{selectedApplication.details.location}</p></div>
                    </div>
                    <div><h4 className="text-sm font-medium text-gray-500 mb-1">Areas of Expertise</h4><p className="break-words">{selectedApplication.details.expertise}</p></div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">License Document</h4>
                      <div className="mt-2">
                        <a href={selectedApplication.details.license_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                          <FileText className="h-4 w-4" /> View License Document
                        </a>
                      </div>
                    </div>
                  </>
                )}

                {/* Hotel Manager Details */}
                {selectedApplication.role === "hotel_manager" && selectedApplication.details && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div><h4 className="text-sm font-medium text-gray-500 mb-1">Hotel Name</h4><p>{selectedApplication.details.name}</p></div>
                       <div><h4 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h4><p>{selectedApplication.phone_number}</p></div>
                       <div><h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4><p>{selectedApplication.details.location}</p></div>
                       <div><h4 className="text-sm font-medium text-gray-500 mb-1">Capacity</h4><p>{selectedApplication.details.capacity} rooms</p></div>
                       <div><h4 className="text-sm font-medium text-gray-500 mb-1">Base Price Per Night</h4><p>${selectedApplication.details.base_price_per_night}</p></div>
                    </div>
                    <div><h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4><p>{selectedApplication.details.description}</p></div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Hotel Images</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        {selectedApplication.details.images && selectedApplication.details.images.map((image, index) => ( // Removed types
                          <div key={index} className="relative aspect-video rounded-md overflow-hidden border">
                            <Image src={image || "/placeholder.svg"} alt={`Hotel image ${index + 1}`} className="object-cover w-full h-full" fill />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Travel Agent Details */}
                {selectedApplication.role === "travel_agent" && selectedApplication.details && (
                  <>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div><h4 className="text-sm font-medium text-gray-500 mb-1">Agency Name</h4><p>{selectedApplication.details.name}</p></div>
                       <div><h4 className="text-sm font-medium text-gray-500 mb-1">Phone Number</h4><p>{selectedApplication.phone_number}</p></div>
                       <div><h4 className="text-sm font-medium text-gray-500 mb-1">Contact Email</h4><p>{selectedApplication.details.contact_email}</p></div>
                       <div><h4 className="text-sm font-medium text-gray-500 mb-1">Contact Phone</h4><p>{selectedApplication.details.contact_phone}</p></div>
                    </div>
                    {selectedApplication.details.routes && selectedApplication.details.routes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Transport Routes</h4>
                        <div className="mt-2 space-y-4">
                          {selectedApplication.details.routes.map((route, index) => (
                            <div key={index} className="p-4 border rounded-md">
                               <div className="flex justify-between mb-2">
                                 <span className="font-medium">{route.origin} to {route.destination}</span>
                                 <Badge>{route.transportation_type}</Badge>
                               </div>
                               <div className="text-sm">
                                 <p><span className="text-gray-500">Cost:</span> ${route.cost}</p>
                                 {route.description && (
                                   <p><span className="text-gray-500">Description:</span> {route.description}</p>
                                 )}
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedApplication.details.document_url && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">License Document</h4>
                        <div className="mt-2">
                          {Array.isArray(selectedApplication.details.document_url) ? (
                            selectedApplication.details.document_url.map((doc, index) => (
                              <a key={index} href={doc} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                                <FileText className="h-4 w-4" /> View Document {index + 1}
                              </a>
                            ))
                          ) : (
                            <a href={selectedApplication.details.document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                              <FileText className="h-4 w-4" /> View License Document
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Use store actions for reject/approve */}
          <DialogFooter className="flex justify-between">
             <div className="flex gap-2">
               <Button variant="outline" onClick={() => selectedApplication && rejectApplication(selectedApplication.user_id)} disabled={isProcessing}>
                 <X className="mr-2 h-4 w-4" /> Reject Application
               </Button>
             </div>
             <Button className="text-white bg-amber-700 hover:bg-amber-800" onClick={() => selectedApplication && approveApplication(selectedApplication.user_id)} disabled={isProcessing}>
               <CheckCircle className="mr-2 h-4 w-4" /> Approve Application
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}