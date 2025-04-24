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
  checkRole("tour_guide"),
  bookingsController.getTourGuideBookings,
);

// Get Tour Guide's assigned activities
router.get(
  "/tour-guide-assigned",
  authenticateToken,
  checkRole("tour_guide"),
  bookingsController.getGuideAssignedBookings,
);

// Get hotel bookings needing action
router.get(
  "/hotel-bookings-pending",
  authenticateToken,
  checkRole("hotel_manager"),
  bookingsController.getHotelBookingsNeedingAction,
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

// Cancel a booking
router.post(
  "/:bookingId/cancel",
  authenticateToken,
  checkRole("tourist"),
  bookingsController.cancelBooking,
);

module.exports = router;
