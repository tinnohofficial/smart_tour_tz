const express = require("express");
const router = express.Router();
const travelAgentsController = require("../controllers/travelAgentsController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Travel Agent creates their agency
router.post(
  "/",
  authenticateToken,
  checkRole("travel_agent", false),
  travelAgentsController.createTravelAgency,
);

// Get agency details by ID
router.get(
  "/:id",
  authenticateToken,
  checkRole("travel_agent", false),
  travelAgentsController.getAgency,
);

// Travel Agent updates their agency
router.put(
  "/:id",
  authenticateToken,
  checkRole("travel_agent"),
  travelAgentsController.updateTravelAgentProfile,
);

module.exports = router;
