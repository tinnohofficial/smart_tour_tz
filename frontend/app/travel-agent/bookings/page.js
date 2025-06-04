"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check,
  Clock,
  Ticket,
  Users,
  Loader2,
  PackageOpen,
  Upload,
  FileText,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useBookingsStore } from "./store";
import { Badge } from "@/components/ui/badge";
import { TransportIconWithMargin as TransportIcon } from "@/app/components/shared/TransportIcon";
import { formatPrettyDate } from "@/app/utils/dateUtils";
import { CompactLoader } from "@/app/components/shared/LoadingSpinner";

export default function TravelAgentBookings() {
  const router = useRouter();
  const {
    pendingBookings,
    completedBookings,
    isLoading,
    fetchPendingBookings,
    fetchCompletedBookings,
    assignTransportTicket,
    selectedBooking,
    isDialogOpen,
    ticketFile,
    openTicketDialog,
    closeTicketDialog,
    setTicketFile,
    activeTab, // Get activeTab from store
    setActiveTab, // Get setActiveTab from store
  } = useBookingsStore();

  useEffect(() => {
    if (activeTab === "pending") {
      fetchPendingBookings();
    } else {
      fetchCompletedBookings();
    }
  }, [activeTab, fetchPendingBookings, fetchCompletedBookings]);

  const handleAssignTicket = async () => {
    if (!ticketFile) {
      toast.error("Please upload a ticket PDF file.");
      return;
    }

    // Validate file type
    if (ticketFile.type !== 'application/pdf') {
      toast.error("Please upload a PDF file only.");
      return;
    }

    try {
      await assignTransportTicket(selectedBooking.id, ticketFile);
      toast.success("Ticket assigned successfully!");
      closeTicketDialog();
    } catch (error) {
      toast.error(`Failed to assign ticket: ${error.message}`);
    }
  };

  const formatDate = formatPrettyDate;

  const renderBookingCard = (booking, isCompleted = false) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden">
      <CardHeader className={cn("pb-3", isCompleted ? "bg-green-50" : "bg-amber-50")}>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <Badge variant="secondary" className="mb-1 text-xs">Booking #{booking.id}</Badge>
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 truncate">
              {booking.origin_name} to {booking.destination_name}
            </CardTitle>
          </div>
          <Badge variant={isCompleted ? "default" : "outline"} className={cn(
            "flex-shrink-0",
            isCompleted ? "bg-green-600 text-white" : "border-yellow-500 text-yellow-700 bg-yellow-50"
          )}>
            {isCompleted ? <Check className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
            {isCompleted ? "Completed" : "Pending"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center">
          <TransportIcon type={booking.transportation_type} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-700 truncate">{booking.transportation_type || "Transport"}</p>
            <p className="text-xs text-gray-500">Type of transport</p>
          </div>
        </div>

        <div className="flex items-center">
          <Users className="h-5 w-5 text-gray-500 mr-3 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-700 truncate">{booking.tourist_name || "Customer"}</p>
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center gap-1">
                <span>📧</span>
                <span className="truncate">{booking.tourist_email}</span>
              </div>
              {booking.tourist_phone && (
                <div className="flex items-center gap-1">
                  <span>📞</span>
                  <span>{booking.tourist_phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {isCompleted && booking.item_details && (
          <>
            <Separator />
            <div className="space-y-2 text-xs">
              <h4 className="font-medium text-gray-600 mb-1">Ticket Information:</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-red-600" />
                  <a 
                    href={booking.item_details.ticket_pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Download Ticket PDF
                  </a>
                </div>
                <p className="text-gray-500">
                  Assigned: {formatDate(booking.item_details.assigned_at)}
                </p>
              </div>
            </div>
          </>
        )}

      </CardContent>

      {!isCompleted && (
        <CardFooter className="border-t pt-4 flex justify-end bg-gray-50">
          <Button
            onClick={() => openTicketDialog(booking)}
            className="bg-amber-700 hover:bg-amber-800 text-white"
            size="sm"
          >
            <Ticket className="h-4 w-4 mr-2" />
            Assign Ticket
          </Button>
        </CardFooter>
      )}
    </Card>
  );

  const renderEmptyState = (tab) => (
    <Card className="col-span-full">
      <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center text-center">
        {tab === "pending" ? (
          <PackageOpen className="h-16 w-16 text-gray-300 mb-4" />
        ) : (
          <Check className="h-16 w-16 text-gray-300 mb-4" />
        )}
        <p className="text-lg font-medium text-gray-600">
          No {tab} transport bookings
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {tab === "pending" 
            ? "New bookings will appear here when tourists book your routes."
            : "Processed bookings will appear here."}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Transport Bookings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 rounded-lg p-1">
          <TabsTrigger value="pending" className="data-[state=active]:bg-amber-700 data-[state=active]:text-white rounded-md text-xs sm:text-sm">
            Pending ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-md text-xs sm:text-sm">
            Completed ({completedBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {isLoading && pendingBookings.length === 0 ? (
            <CompactLoader message="Loading pending bookings..." />
          ) : pendingBookings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {pendingBookings.map((booking, index) => (
                <div key={`pending-${booking.id}-${booking.booking_id || index}`}>
                  {renderBookingCard(booking, false)}
                </div>
              ))}
            </div>
          ) : (
            renderEmptyState("pending")
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {isLoading && completedBookings.length === 0 ? (
            <CompactLoader message="Loading completed bookings..." />
          ) : completedBookings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {completedBookings.map((booking, index) => (
                <div key={`completed-${booking.id}-${booking.booking_id || index}`}>
                  {renderBookingCard(booking, true)}
                </div>
              ))}
            </div>
          ) : (
            renderEmptyState("completed")
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={closeTicketDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold">Upload Transport Ticket</DialogTitle>
            <DialogDescription className="text-sm">
              Upload a PDF ticket for Booking #{selectedBooking?.id} ({selectedBooking?.origin_name} to {selectedBooking?.destination_name}).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label htmlFor="ticket_file" className="font-medium text-sm">Ticket PDF File*</Label>
              <div className="flex flex-col gap-3">
                <Input
                  id="ticket_file"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setTicketFile(e.target.files?.[0] || null)}
                  className="text-sm cursor-pointer"
                />
                {ticketFile && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 truncate">
                      {ticketFile.name}
                    </span>
                    <span className="text-xs text-green-600 ml-auto">
                      {(ticketFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Please upload a PDF file containing the transport ticket details.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between">
             <Button
              type="button"
              variant="outline"
              onClick={closeTicketDialog}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignTicket}
              disabled={isLoading || !ticketFile}
              className="bg-amber-700 hover:bg-amber-800 text-white w-full sm:w-auto order-1 sm:order-2"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Upload className="mr-2 h-4 w-4" />
              Upload Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}