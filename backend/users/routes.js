const express = require("express");
const router = express.Router();
const userProfileController = require("./controller");
// Import other user-related controllers
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole"); // Adjust if combined middleware

// Endpoint for currently logged-in user to get their profile
router.get("/me", authenticateToken, (req, res) => {
  // Fetch detailed profile based on req.user.role and req.user.id
  // Example: if (req.user.role === 'tourist') { fetch tourist data } ...
  res.json(req.user); // Send back basic info for now
});

// Profile Completion Routes (protected)
router.post(
  "/me/profile/tour-guide",
  authenticateToken,
  checkRole("tour_guide"),
  userProfileController.completeTourGuideProfile,
);
// Add similar routes for hotel manager and travel agent profiles

// Add routes for updating profile details, changing password etc.

module.exports = router;
