const express = require("express");
const router = express.Router();
const tourGuideController = require("../controllers/tourGuidesController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Tour Guide creates their profile
router.post(
  "/",
  authenticateToken,
  checkRole("tour_guide", false),
  tourGuideController.createTourGuide,
);

// Get tour guide details by ID
router.get(
  "/:id",
  authenticateToken,
  checkRole("tour_guide", false),
  tourGuideController.getTourGuide,
);

// Tour Guide updates their profile (including availability)
router.put(
  "/:id",
  authenticateToken,
  checkRole("tour_guide", false),
  tourGuideController.updateGuideProfile,
);

// Tour guide manager profile routes
router.get(
  "/manager/profile",
  authenticateToken,
  checkRole("tour_guide", false),
  tourGuideController.getManagerProfile,
);

router.put(
  "/manager/profile",
  authenticateToken,
  checkRole("tour_guide", false),
  tourGuideController.updateManagerProfile,
);

module.exports = router;
