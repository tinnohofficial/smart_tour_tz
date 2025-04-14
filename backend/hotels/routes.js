const express = require("express");
const router = express.Router();
const hotelController = require("./controller");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Hotel Manager submits or updates profile (F2.2)
router.post(
  "/profile",
  authenticateToken,
  checkRole("hotel_manager"),
  hotelController.submitHotelManagerProfile
);

// Hotel Manager views their hotel details
router.get(
  "/me",
  authenticateToken,
  checkRole("hotel_manager"),
  hotelController.getHotelDetails
);

// API endpoints for hotels available to tourists (F6.5)
router.get(
  "/",
  (req, res, next) => {
    // Public endpoint - no auth required
    next();
  },
  require("../destinations/controller").getHotels
);

// Hotel Manager views bookings needing action (F6.10)
router.get(
  "/bookings",
  authenticateToken, 
  checkRole("hotel_manager"),
  hotelController.getBookingsNeedingAction
);

// Hotel Manager confirms room for booking (F6.11)
router.patch(
  "/bookings/items/:itemId/confirm-room",
  authenticateToken,
  checkRole("hotel_manager"),
  hotelController.confirmRoom
);

module.exports = router;