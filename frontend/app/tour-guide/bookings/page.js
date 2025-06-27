"use client";

import { useEffect, useState } from "react";

import {
  CalendarDays,
  Users,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBookingsStore } from "./store";
import { format } from "date-fns";

export default function TourGuideBookings() {
  const { tours, isLoading, statusFilter, setStatusFilter, fetchTours } =
    useBookingsStore();

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  // Get booking status based on dates
  const getBookingStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "current";
    return "completed";
  };

  // Filter tours based on status
  const filteredTours = tours.filter((tour) => {
    if (statusFilter === "all") return true;
    const status = getBookingStatus(tour.startDate, tour.endDate);
    return status === statusFilter;
  });

  // Get counts for each status
  const statusCounts = {
    current: tours.filter(
      (tour) => getBookingStatus(tour.startDate, tour.endDate) === "current",
    ).length,
    upcoming: tours.filter(
      (tour) => getBookingStatus(tour.startDate, tour.endDate) === "upcoming",
    ).length,
    completed: tours.filter(
      (tour) => getBookingStatus(tour.startDate, tour.endDate) === "completed",
    ).length,
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your tours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Tours</h1>
        <p className="text-muted-foreground">Manage your tour assignments</p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-sm">
                Current Tours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-full">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statusCounts.current}</p>
                  <p className="text-sm text-muted-foreground">Active now</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-sm">
                Upcoming Tours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-full">
                  <CalendarDays className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statusCounts.upcoming}</p>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card> */}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-sm">
                Completed Tours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Star className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statusCounts.completed}</p>
                  <p className="text-sm text-muted-foreground">Finished</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tours List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <CardTitle>Tour Assignments</CardTitle>
                <CardDescription>
                  View and manage your assigned tours
                </CardDescription>
              </div>
              <Tabs
                defaultValue="current"
                className="w-full md:w-auto"
                onValueChange={setStatusFilter}
              >
                <TabsList className="grid w-full md:w-auto grid-cols-3">
                  <TabsTrigger value="current">Current</TabsTrigger>
                  {/* <TabsTrigger value="upcoming">Upcoming</TabsTrigger> */}
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredTours.length === 0 ? (
                <div className="text-center py-10">
                  <div className="flex flex-col items-center gap-2">
                    <CalendarDays className="h-8 w-8 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">No tours found</h3>
                    <p className="text-muted-foreground">
                      No tours match the selected status
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredTours.map((tour) => {
                    const currentStatus = getBookingStatus(
                      tour.startDate,
                      tour.endDate,
                    );

                    return (
                      <div
                        key={tour.id}
                        className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm"
                      >
                        {/* Tour Details */}
                        <div className="flex flex-col min-w-0">
                          <div className="flex flex-col xl:flex-row justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3">
                                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0" />
                                <h3 className="font-semibold text-lg truncate">
                                  {tour.destination}
                                </h3>
                                <Badge
                                  variant={
                                    currentStatus === "current"
                                      ? "destructive"
                                      : currentStatus === "upcoming"
                                        ? "default"
                                        : "secondary"
                                  }
                                  className="text-xs whitespace-nowrap"
                                >
                                  {currentStatus.charAt(0).toUpperCase() +
                                    currentStatus.slice(1)}
                                </Badge>
                              </div>

                              <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                                <div className="flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">
                                    {format(new Date(tour.startDate), "PPP")} -{" "}
                                    {format(new Date(tour.endDate), "PPP")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 flex-shrink-0" />
                                  <span>
                                    {tour.duration} day
                                    {tour.duration !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Activities */}
                          {tour.activities && tour.activities.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Star className="h-4 w-4" />
                                Tour Activities
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {tour.activities.map((activity, index) => (
                                  <div
                                    key={index}
                                    className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
                                  >
                                    <div className="text-sm font-medium text-amber-900">
                                      {activity.name}
                                    </div>
                                    {activity.description && (
                                      <div className="text-xs text-amber-700 mt-1">
                                        {activity.description}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tourist Contact */}
                          <div className="pt-4 border-t">
                            <h4 className="text-sm font-medium mb-2">
                              Tourist Contact
                            </h4>
                            <div className="flex items-center gap-3 bg-muted/50 px-4 py-3 rounded-md">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-sm">
                                  {tour.tourist_name
                                    ? tour.tourist_name.charAt(0).toUpperCase()
                                    : tour.tourist_email
                                        ?.charAt(0)
                                        .toUpperCase() || "T"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                {tour.tourist_name && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm font-medium text-gray-700">
                                      {tour.tourist_name}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground truncate">
                                    {tour.tourist_email || "No email provided"}
                                  </span>
                                </div>
                                {tour.tourist_phone &&
                                  tour.tourist_phone !== "Not provided" && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-sm text-muted-foreground">
                                        {tour.tourist_phone}
                                      </span>
                                    </div>
                                  )}
                              </div>

                              {/* Contact Actions */}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  asChild
                                >
                                  <a href={`mailto:${tour.tourist_email}`}>
                                    Email
                                  </a>
                                </Button>
                                {tour.tourist_phone &&
                                  tour.tourist_phone !== "Not provided" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs"
                                      asChild
                                    >
                                      <a href={`tel:${tour.tourist_phone}`}>
                                        Call
                                      </a>
                                    </Button>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
