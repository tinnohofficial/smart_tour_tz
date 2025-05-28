const express = require("express");
const router = express.Router();
const transportOriginsController = require("../controllers/transportOriginsController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Get all transport origins (public access for booking flow)
router.get(
  "/",
  transportOriginsController.getAllOrigins
);

// Get transport origin by ID
router.get(
  "/:originId",
  transportOriginsController.getOriginById
);

// Admin only routes
// Create new transport origin
router.post(
  "/",
  authenticateToken,
  checkRole("admin"),
  transportOriginsController.createOrigin
);

// Update transport origin
router.put(
  "/:originId",
  authenticateToken,
  checkRole("admin"),
  transportOriginsController.updateOrigin
);

// Delete transport origin
router.delete(
  "/:originId",
  authenticateToken,
  checkRole("admin"),
  transportOriginsController.deleteOrigin
);

module.exports = router;
