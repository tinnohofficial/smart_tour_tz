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

// Profile endpoints for current user
router.post(
  "/profile",
  authenticateToken,
  checkRole("travel_agent", false),
  travelAgentsController.createTravelAgency,
);

router.get(
  "/profile",
  authenticateToken,
  checkRole("travel_agent", false),
  (req, res) => {
    // Redirect to get agency by user ID
    req.params.id = req.user.id;
    travelAgentsController.getAgency(req, res);
  }
);

router.put(
  "/profile",
  authenticateToken,
  checkRole("travel_agent"),
  (req, res) => {
    // Redirect to update agency by user ID
    req.params.id = req.user.id;
    travelAgentsController.updateTravelAgentProfile(req, res);
  }
);

module.exports = router;
