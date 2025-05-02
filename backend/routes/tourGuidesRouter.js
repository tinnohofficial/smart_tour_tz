const express = require("express");
const router = express.Router();
const tourGuideController = require("../controllers/tourGuidesController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Tour Guide submits or updates profile (F2.1)
router.post(
  "/profile",
  authenticateToken,
  checkRole("tour_guide", false),
  tourGuideController.submitTourGuideProfile,
);

// Tour Guide views their profile details
router.get(
  "/profile",
  authenticateToken,
  checkRole("tour_guide", false),
  tourGuideController.getGuideProfile,
);

// Tour Guide updates profile
router.put(
  "/profile",
  authenticateToken,
  checkRole("tour_guide"),
  tourGuideController.updateGuideProfile,
);

// Tour Guide updates availability status
router.patch(
  "/availability",
  authenticateToken,
  checkRole("tour_guide"),
  tourGuideController.updateAvailability,
);

module.exports = router;
