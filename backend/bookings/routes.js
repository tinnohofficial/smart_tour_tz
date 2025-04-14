const express = require("express");
const router = express.Router();
const bookingsController = require("./controller");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Create a new booking (F6.7)
router.post(
  "/",
  authenticateToken,
  checkRole("tourist"),
  bookingsController.createBooking
);

// Process payment for a booking (F5.4/F5.5)
router.post(
  "/:bookingId/payment",
  authenticateToken,
  checkRole("tourist"),
  bookingsController.processBookingPayment
);

// Get user's bookings
router.get(
  "/my-bookings",
  authenticateToken,
  checkRole("tourist"),
  bookingsController.getUserBookings
);

// Get Tour Guide's bookings
router.get(
  "/tour-guide-bookings",
  authenticateToken,
  checkRole("tour_guide"),
  bookingsController.getTourGuideBookings
);

module.exports = router;