const express = require("express");
const router = express.Router();
const tourGuideController = require("../controllers/tourGuidesController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Tour Guide submits or updates profile (F2.1)
router.post(
  "/profile",
  authenticateToken,
  checkRole("tour_guide"),
  tourGuideController.submitTourGuideProfile,
);

// Tour Guide views their profile details
router.get(
  "/me",
  authenticateToken,
  checkRole("tour_guide"),
  tourGuideController.getGuideProfile,
);

// Tour Guide updates profile
router.put(
  "/me",
  authenticateToken,
  checkRole("tour_guide"),
  tourGuideController.updateGuideProfile,
);

// Tour Guide sees assigned bookings
router.get(
  "/bookings",
  authenticateToken,
  checkRole("tour_guide"),
  tourGuideController.getAssignedBookings,
);

module.exports = router;
