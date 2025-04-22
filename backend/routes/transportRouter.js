const express = require("express");
const router = express.Router();
const transportController = require("../controllers/transportController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Travel Agent submits or updates profile (F2.3)
router.post(
  "/profile",
  authenticateToken,
  checkRole("travel_agent"),
  transportController.submitTravelAgentProfile,
);

// Travel Agent views their agency details
router.get(
  "/me",
  authenticateToken,
  checkRole("travel_agent"),
  transportController.getAgencyDetails,
);

// Travel Agent updates their profile (F4.2)
router.put(
  "/me",
  authenticateToken,
  checkRole("travel_agent"),
  transportController.updateTravelAgentProfile,
);

// Travel Agent adds a new transport route
router.post(
  "/routes",
  authenticateToken,
  checkRole("travel_agent"),
  transportController.addTransportRoute,
);

// Travel Agent updates an existing route
router.put(
  "/routes/:routeId",
  authenticateToken,
  checkRole("travel_agent"),
  transportController.updateTransportRoute,
);

// API endpoints for transport routes available to tourists (F6.3)
router.get(
  "/routes",
  (req, res, next) => {
    // Public endpoint - no auth required
    next();
  },
  transportController.getTransportRoutes,
);

// Travel Agent views bookings needing action (F6.8)
router.get(
  "/bookings",
  authenticateToken,
  checkRole("travel_agent"),
  transportController.getBookingsNeedingAction,
);

// Travel Agent assigns ticket for booking (F6.9)
router.patch(
  "/bookings/items/:itemId/assign-ticket",
  authenticateToken,
  checkRole("travel_agent"),
  transportController.assignTicket,
);

module.exports = router;
