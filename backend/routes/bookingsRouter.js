const express = require("express");
const router = express.Router();
const bookingsController = require("../controllers/bookingsController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Create a new booking (F6.7)
router.post(
  "/",
  authenticateToken,
  checkRole("tourist"),
  bookingsController.createBooking,
);

// Process payment for a booking (F5.4/F5.5)
router.post(
  "/:bookingId/payment",
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

module.exports = router;
