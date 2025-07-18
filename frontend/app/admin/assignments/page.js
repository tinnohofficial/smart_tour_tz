"use client"

// Keep useEffect for initial fetch
import { useEffect } from "react"
import { Label } from "@/components/ui/label" // Keep Label import
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Badge } from "@/components/ui/badge"
// Removed useToast hook import
import { Calendar, MapPin, AlertTriangle, Loader2, CheckCircle } from "lucide-react"


// Import the Zustand store
import { useAssignmentsStore } from "./assignmentsStore"; // Adjust path if needed
import { formatDate, formatDateRange } from "@/app/utils/dateUtils";

export default function AssignmentsPage() {
  // Select state and actions from the Zustand store
  const {
    bookings,
    isLoading,
    isSubmitting,
    error,
    isAssignDialogOpen,
    selectedBooking,
    eligibleGuides,
    selectedGuideId,
    // Actions
    fetchUnassignedBookings,
    prepareAssignDialog,
    assignGuide,
    setIsAssignDialogOpen,
    setSelectedGuideId,
    clearEligibleGuides // Added for explicit cleanup on dialog close
  } = useAssignmentsStore();

  // Fetch initial data on component mount
  useEffect(() => {
    fetchUnassignedBookings();
  }, [fetchUnassignedBookings]); // Depend on the stable fetch function from the store

  // Use shared utilities
  const formatDateRangeShared = formatDateRange;

  // --- Render Logic ---
  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tour Guide Assignments</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Assign tour guides to confirmed bookings.</p>
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
        <Button variant="outline" onClick={fetchUnassignedBookings} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unassigned Bookings</CardTitle>
          <CardDescription>Bookings that need a tour guide assignment</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
               <div className="flex flex-col items-center gap-2">
                 <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                 <p className="text-sm text-muted-foreground">Loading bookings...</p>
               </div>
            </div>
          ) : /* Empty State */
          bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="font-medium">No unassigned bookings</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All bookings have been assigned to tour guides
              </p>
            </div>
          ) : (
            /* Data Table - Make responsive */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">Tourist</TableHead>
                    <TableHead className="min-w-[150px]">Destination</TableHead>
                    <TableHead className="min-w-[130px] hidden sm:table-cell">Date Range</TableHead>
                    <TableHead className="min-w-[120px] hidden lg:table-cell">Activities</TableHead>
                    <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        <div className="truncate max-w-[120px]">{booking.tourist_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center min-w-0">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground flex-shrink-0" />
                          <span className="truncate max-w-[130px]">{booking.destination_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-xs sm:text-sm">{formatDateRange(booking.start_date, booking.end_date)}</div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {(booking.activities || []).slice(0, 2).map((activity, index) => (
                            <Badge key={`activity-${booking.id}-${index}`} variant="outline" className="text-xs">{activity}</Badge>
                          ))}
                          {booking.activities && booking.activities.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{booking.activities.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Use store action to prepare dialog and fetch guides */}
                        <Button 
                          onClick={() => prepareAssignDialog(booking)} 
                          disabled={isSubmitting}
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          Assign Guide
                        </Button>
                      </TableCell>
                    </TableRow>                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Guide Dialog (controlled by store state) */}
      <Dialog open={isAssignDialogOpen} onOpenChange={(isOpen) => {
        setIsAssignDialogOpen(isOpen);
        if (!isOpen) {
            // Clear guides when dialog closes manually
            clearEligibleGuides();
        }
      }}>
        <DialogContent className="sm:max-w-lg mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Assign Tour Guide</DialogTitle>
            <DialogDescription className="text-sm">Select a tour guide to assign to this booking.</DialogDescription>
          </DialogHeader>

          {/* Read selectedBooking from store */}
          {selectedBooking && (
            <div className="py-4">
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Booking Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Tourist:</span> {selectedBooking.tourist_name}</div>
                  <div><span className="text-muted-foreground">Destination:</span> {selectedBooking.destination_name}</div>
                  <div><span className="text-muted-foreground">Date Range:</span> {formatDateRangeShared(selectedBooking.start_date, selectedBooking.end_date)}</div>
                  <div><span className="text-muted-foreground">Status:</span> {selectedBooking.status}</div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-muted-foreground">Activities:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(selectedBooking.activities || []).map((activity, index) => (
                      <Badge key={`dialog-activity-${selectedBooking.id}-${index}`} variant="outline">{activity}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="guide-select">Select Tour Guide</Label>
                  {/* Select uses store state/action */}
                  <Select value={selectedGuideId} onValueChange={setSelectedGuideId}>
                    <SelectTrigger id="guide-select" className="w-full mt-1">
                      <SelectValue placeholder="Select a tour guide" />
                    </SelectTrigger>
                    <SelectContent>
                      {isSubmitting ? (
                        <SelectItem value="loading" disabled>
                          Loading eligible guides...
                        </SelectItem>
                      ) : eligibleGuides.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No eligible guides available
                        </SelectItem>
                      ) : (
                        // Read eligibleGuides from store
                        (eligibleGuides || []).map((guide) => (
                          <SelectItem key={guide.id} value={guide.id.toString()}>
                            {guide.full_name} - {guide.destination_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                 {/* Display details of the selected guide */}
                 {selectedGuideId && eligibleGuides.length > 0 && (
                   <div className="p-4 bg-muted rounded-lg">
                     <h3 className="font-medium mb-2 text-sm sm:text-base">Guide Details</h3>
                     {/* Find and display selected guide details */}
                     {(() => {
                       const guide = (eligibleGuides || []).find(g => g.id.toString() === selectedGuideId);
                       if (!guide) {
                         return (
                           <div className="text-sm text-muted-foreground">
                             Guide details not found.
                           </div>
                         );
                       }
                       return (
                          <div key={guide.id} className="space-y-2 text-sm">
                            <div><span className="text-muted-foreground">Guide:</span> {guide.full_name}</div>
                            <div><span className="text-muted-foreground">Location:</span> {guide.destination_name}</div>
                            <div>
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Available
                              </Badge>
                            </div>
                          </div>
                       );
                     })()}
                   </div>
                 )}


              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} className="w-full sm:w-auto order-2 sm:order-1"> Cancel </Button>
            {/* Use store action for assigning */}
            <Button 
              onClick={assignGuide} 
              disabled={isSubmitting || !selectedGuideId} 
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {isSubmitting ? (
                 <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning...</>
              ) : (
                 <>Assign Guide</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}