const express = require("express");
const router = express.Router();
const touristController = require("../controllers/touristsController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Tourist views their profile
router.get(
  "/profile",
  authenticateToken,
  checkRole("tourist"),
  touristController.getTouristProfile,
);

// Tourist updates their profile
router.put(
  "/profile",
  authenticateToken,
  checkRole("tourist"),
  touristController.updateTouristProfile,
);

module.exports = router;
