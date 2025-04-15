const express = require("express");
const router = express.Router();
const userProfileController = require("./controller");
// Import other user-related controllers
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole"); // Adjust if combined middleware

router.get("/me", authenticateToken, userProfileController.getMyProfile);

// F2.1 Profile Completion for Tour Guide (already implemented)
router.post(
  "/me/profile/tour-guide",
  authenticateToken,
  checkRole("tour_guide"),
  userProfileController.completeTourGuideProfile,
);

// F2.2 Profile Completion for Hotel Manager
router.post(
  "/me/profile/hotel-manager",
  authenticateToken,
  checkRole("hotel_manager"),
  userProfileController.completeHotelManagerProfile,
);

// F2.3 Profile Completion for Travel Agent
router.post(
  "/me/profile/travel-agent",
  authenticateToken,
  checkRole("travel_agent"),
  userProfileController.completeTravelAgentProfile,
);

// F4.1 Update authentication credentials
router.put(
  "/me/password",
  authenticateToken,
  userProfileController.updatePassword,
);

// F4.2 Update profile details based on role
router.put(
  "/me/profile/:role",
  authenticateToken,
  userProfileController.updateProfileDetails,
);

module.exports = router;
