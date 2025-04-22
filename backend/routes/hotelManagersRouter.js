const express = require("express");
const router = express.Router();
const hotelManagersController = require("../controllers/hotelManagersController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Hotel Manager submits or updates profile (F2.2)
router.post(
  "/profile",
  authenticateToken,
  checkRole("hotel_manager"),
  hotelManagersController.submitHotelManagerProfile,
);

// Hotel Manager views their hotel details
router.get(
  "/profile",
  authenticateToken,
  checkRole("hotel_manager"),
  hotelManagersController.getHotelDetails,
);

// Hotel Manager updates their profile (F4.2)
router.put(
  "/profile",
  authenticateToken,
  checkRole("hotel_manager"),
  hotelManagersController.updateHotelProfile,
);

module.exports = router;
