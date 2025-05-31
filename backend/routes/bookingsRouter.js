const express = require("express");
const router = express.Router();
const bookingsController = require("../controllers/bookingsController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Create a new booking 
router.post(
  "/",
  authenticateToken,
  checkRole("tourist"),
  bookingsController.createBooking,
);

// Process payment for a booking
router.post(
  "/:bookingId/pay",
  authenticateToken,
  checkRole("tourist"),
  bookingsController.processBookingPayment,
);

// Get user's bookings
router.get(
  "/my-bookings",
  authenticateToken,
  checkRole("tourist"),
  bookingsController.getUserBookings,
);

// Get Tour Guide's bookings
router.get(
  "/tour-guide-bookings",
  authenticateToken,
  checkRole("tour_guide", false),
  bookingsController.getTourGuideBookings,
);

// Get Tour Guide's assigned activities
router.get(
  "/tour-guide-assigned",
  authenticateToken,
  checkRole("tour_guide", false),
  bookingsController.getGuideAssignedBookings,
);

// Get Tour Guide's booking details
router.get(
  "/tour-guide-booking/:bookingId",
  authenticateToken,
  checkRole("tour_guide", false),
  bookingsController.getGuideBookingDetails,
);

// Get hotel bookings needing action
router.get(
  "/hotel-bookings-pending",
  authenticateToken,
  checkRole("hotel_manager"),
  bookingsController.getHotelBookingsNeedingAction,
);

// Get completed hotel bookings
router.get(
  "/hotel-bookings-completed",
  authenticateToken,
  checkRole("hotel_manager"),
  bookingsController.getHotelBookingsCompleted,
);

// Confirm room for booking
router.patch(
  "/items/:itemId/confirm-room",
  authenticateToken,
  checkRole("hotel_manager"),
  bookingsController.confirmHotelRoom,
);

// Get transport bookings needing action
router.get(
  "/transport-bookings-pending",
  authenticateToken,
  checkRole("travel_agent"),
  bookingsController.getTransportBookingsNeedingAction,
);

// Get completed transport bookings
router.get(
  "/transport-bookings-completed",
  authenticateToken,
  checkRole("travel_agent"),
  bookingsController.getTransportBookingsCompleted,
);

// Assign ticket for booking
router.patch(
  "/items/:itemId/assign-ticket",
  authenticateToken,
  checkRole("travel_agent"),
  bookingsController.assignTransportTicket,
);

// Admin routes for tour guide assignment
// Get unassigned bookings (bookings without tour guides)
router.get(
  "/unassigned-bookings",
  authenticateToken,
  checkRole("admin"),
  bookingsController.getUnassignedBookings,
);

// Get eligible tour guides for a booking
router.get(
  "/:bookingId/eligible-guides",
  authenticateToken,
  checkRole("admin"),
  bookingsController.getEligibleGuidesForBooking,
);

// Assign tour guide to a booking
router.post(
  "/:bookingId/assign-guide",
  authenticateToken,
  checkRole("admin"),
  bookingsController.assignTourGuide,
);

module.exports = router;
