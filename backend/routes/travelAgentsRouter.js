const express = require("express");
const router = express.Router();
const travelAgentsController = require("../controllers/travelAgentsController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Travel Agent submits or updates profile (F2.3)
router.post(
  "/profile",
  authenticateToken,
  checkRole("travel_agent"),
  travelAgentsController.submitTravelAgentProfile,
);

// Travel Agent views their agency details
router.get(
  "/profile",
  authenticateToken,
  checkRole("travel_agent"),
  travelAgentsController.getAgencyDetails,
);

// Travel Agent updates their profile (F4.2)
router.put(
  "/profile",
  authenticateToken,
  checkRole("travel_agent"),
  travelAgentsController.updateTravelAgentProfile,
);

module.exports = router;
