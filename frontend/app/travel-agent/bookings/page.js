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
  Calendar as CalendarIcon,
  Check,
  Car,
  Clock,
  AlertTriangle,
  Ticket,
  Users,
  Plane,
  Train,
  Ship,
  Loader2,
  PackageOpen,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
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
    ticketDetails,
    openTicketDialog,
    closeTicketDialog,
    setTicketDetails,
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
    if (!ticketDetails.departure_date || !ticketDetails.ticket_number) {
      toast.error("Please provide departure date and ticket number.");
      return;
    }

    try {
      await assignTransportTicket(selectedBooking.id, ticketDetails);
      toast.success("Ticket assigned successfully!");
      closeTicketDialog();
    } catch (error) {
      toast.error(`Failed to assign ticket: ${error.message}`);
    }
  };

  const formatDate = formatPrettyDate;

  const renderBookingCard = (booking, isCompleted = false) => (
    <Card key={booking.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden">
      <CardHeader className={cn("pb-3", isCompleted ? "bg-green-50" : "bg-blue-50")}>
        <div className="flex justify-between items-start">
          <div>
            <Badge variant="secondary" className="mb-1 text-xs">Booking #{booking.id}</Badge>
            <CardTitle className="text-lg font-semibold text-gray-800">
              {booking.origin} to {booking.destination}
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Created: {formatDate(booking.created_at)}
            </CardDescription>
          </div>
          <Badge variant={isCompleted ? "default" : "outline"} className={cn(isCompleted ? "bg-green-600 text-white" : "border-yellow-500 text-yellow-700 bg-yellow-50")}>
            {isCompleted ? <Check className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
            {isCompleted ? "Completed" : "Pending"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center">
          <TransportIcon type={booking.transportation_type} />
          <div>
            <p className="text-sm font-medium text-gray-700">{booking.transportation_type || "Transport"}</p>
            <p className="text-xs text-gray-500">Type of transport</p>
          </div>
        </div>

        <div className="flex items-center">
          <Users className="h-5 w-5 text-gray-500 mr-3" />
          <div>
            <p className="text-sm font-medium text-gray-700">{booking.tourist_email || "Customer"}</p>
            <p className="text-xs text-gray-500">Tourist Email</p>
          </div>
        </div>
        
        {isCompleted && booking.item_details && (
          <>
            <Separator />
            <div className="space-y-2 text-xs">
              <h4 className="font-medium text-gray-600 mb-1">Ticket Information:</h4>
              <p><span className="font-semibold">Departure:</span> {formatDate(booking.item_details.departure_date)}</p>
              {booking.item_details.arrival_date && <p><span className="font-semibold">Arrival:</span> {formatDate(booking.item_details.arrival_date)}</p>}
              <p><span className="font-semibold">Ticket No:</span> {booking.item_details.ticket_number}</p>
              {booking.item_details.seat_number && <p><span className="font-semibold">Seat:</span> {booking.item_details.seat_number}</p>}
              {booking.item_details.additional_info && <p><span className="font-semibold">Notes:</span> {booking.item_details.additional_info}</p>}
            </div>
          </>
        )}

      </CardContent>

      {!isCompleted && (
        <CardFooter className="border-t pt-4 flex justify-end bg-gray-50">
          <Button
            onClick={() => openTicketDialog(booking)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Manage Transport Bookings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 rounded-lg p-1">
          <TabsTrigger value="pending" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md">
            Pending ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-md">
            Completed ({completedBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {isLoading && pendingBookings.length === 0 ? (
            <CompactLoader message="Loading pending bookings..." />
          ) : pendingBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingBookings.map(booking => renderBookingCard(booking, false))}
            </div>
          ) : (
            renderEmptyState("pending")
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {isLoading && completedBookings.length === 0 ? (
            <CompactLoader message="Loading completed bookings..." />
          ) : completedBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedBookings.map(booking => renderBookingCard(booking, true))}
            </div>
          ) : (
            renderEmptyState("completed")
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={closeTicketDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Assign Transport Ticket</DialogTitle>
            <DialogDescription>
              Provide ticket details for Booking #{selectedBooking?.id} ({selectedBooking?.origin} to {selectedBooking?.destination}).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="departure_date" className="font-medium">Departure Date*</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !ticketDetails.departure_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {ticketDetails.departure_date
                        ? format(ticketDetails.departure_date, "PPP")
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={ticketDetails.departure_date}
                      onSelect={(date) =>
                        setTicketDetails({ departure_date: date })
                      }
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } // Disable past dates
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="arrival_date" className="font-medium">Arrival Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !ticketDetails.arrival_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {ticketDetails.arrival_date
                        ? format(ticketDetails.arrival_date, "PPP")
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={ticketDetails.arrival_date}
                      onSelect={(date) =>
                        setTicketDetails({ arrival_date: date })
                      }
                      initialFocus
                      disabled={(date) => ticketDetails.departure_date ? date < ticketDetails.departure_date : date < new Date(new Date().setHours(0,0,0,0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="ticket_number" className="font-medium">Ticket Number*</Label>
              <Input
                id="ticket_number"
                value={ticketDetails.ticket_number}
                onChange={(e) =>
                  setTicketDetails({ ticket_number: e.target.value })
                }
                placeholder="e.g., TZA12345"
                className="text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seat_number" className="font-medium">Seat/Cabin Number</Label>
              <Input
                id="seat_number"
                value={ticketDetails.seat_number}
                onChange={(e) =>
                  setTicketDetails({ seat_number: e.target.value })
                }
                placeholder="e.g., 24A, Cabin B"
                className="text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="additional_info" className="font-medium">Additional Information</Label>
              <Input
                id="additional_info"
                value={ticketDetails.additional_info}
                onChange={(e) =>
                  setTicketDetails({ additional_info: e.target.value })
                }
                placeholder="e.g., Gate 7, Platform 2"
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
             <Button
              type="button"
              variant="outline"
              onClick={closeTicketDialog}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignTicket}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}