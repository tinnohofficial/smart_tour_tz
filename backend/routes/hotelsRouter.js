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
  hotelsController.createHotel,
);

// Hotel manager routes - update hotel by id with authorization check
router.put(
  "/:id",
  authenticateToken,
  checkRole("hotel_manager"),
  hotelsController.updateHotel,
);

// Hotel manager profile routes
router.get(
  "/manager/profile",
  authenticateToken,
  checkRole("hotel_manager"),
  hotelsController.getManagerProfile,
);

router.put(
  "/manager/profile",
  authenticateToken,
  checkRole("hotel_manager"),
  hotelsController.updateManagerProfile,
);

module.exports = router;
