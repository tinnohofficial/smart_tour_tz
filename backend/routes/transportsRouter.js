const express = require("express");
const router = express.Router();
const transportsController = require("../controllers/transportsController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Get all transports
router.get("/", transportsController.getTransports);

// Get routes for authenticated travel agent
router.get(
  "/my-routes",
  authenticateToken,
  checkRole("travel_agent"),
  transportsController.getAgencyRoutes
);

// Get transport by ID
router.get("/:transportId", transportsController.getTransportById);

// Create a new transport - only travel agent can create
router.post(
  "/",
  authenticateToken,
  checkRole("travel_agent"),
  transportsController.createTransport,
);

// Update a transport - only travel agent can update
router.put(
  "/:transportId",
  authenticateToken,
  checkRole("travel_agent"),
  transportsController.updateTransport,
);

// Delete a transport - only travel agent can delete
router.delete(
  "/:transportId",
  authenticateToken,
  checkRole("travel_agent"),
  transportsController.deleteTransport,
);

module.exports = router;