const express = require("express");
const router = express.Router();
const touristController = require("./controller");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Tourist views their profile
router.get(
  "/me",
  authenticateToken,
  checkRole("tourist"),
  touristController.getTouristProfile
);

// Tourist updates their profile
router.put(
  "/me",
  authenticateToken,
  checkRole("tourist"),
  touristController.updateTouristProfile
);

// Tourist views their bookings
router.get(
  "/bookings",
  authenticateToken,
  checkRole("tourist"),
  touristController.getTouristBookings
);

// Tourist views their savings account
router.get(
  "/savings",
  authenticateToken,
  checkRole("tourist"),
  touristController.getSavingsAccount
);

module.exports = router;