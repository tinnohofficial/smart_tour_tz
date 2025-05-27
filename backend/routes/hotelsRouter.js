const express = require("express");
const router = express.Router();
const hotelsController = require("../controllers/hotelsController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Public routes - any user can access
router.get("/", hotelsController.getAllHotels);
router.get("/:id", hotelsController.getHotelById);

// Hotel manager routes - only accessible to hotel managers
router.post(
  "/",
  authenticateToken,
  checkRole("hotel_manager", false),
  hotelsController.createHotel
);

// Hotel manager profile routes - these should map to the same functionality
router.post(
  "/manager/profile",
  authenticateToken,
  checkRole("hotel_manager", false),
  hotelsController.createHotel  // Same functionality for profile creation
);

router.get(
  "/manager/profile",
  authenticateToken,
  checkRole("hotel_manager", false),
  hotelsController.getHotelByManagerId
);

router.put(
  "/manager/profile",
  authenticateToken,
  checkRole("hotel_manager"),
  hotelsController.updateHotelByManagerId
);

module.exports = router;

