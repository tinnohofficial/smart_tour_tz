const express = require("express");
const router = express.Router();
const activitiesController = require("../controllers/activitiesController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Get all activities (optional filter by destination_id)
router.get("/", activitiesController.getActivities);

// Get activities by destination
router.get("/destination/:destinationId", activitiesController.getActivitiesByDestination);

// Get activity by ID
router.get("/:id", activitiesController.getActivityById);

// Create a new activity - only admin can create
router.post(
  "/",
  authenticateToken,
  checkRole("admin"),
  activitiesController.createActivity,
);

// Update an activity - only admin can update
router.put(
  "/:id",
  authenticateToken,
  checkRole("admin"),
  activitiesController.updateActivity,
);

// Delete an activity - only admin can delete
router.delete(
  "/:id",
  authenticateToken,
  checkRole("admin"),
  activitiesController.deleteActivity,
);

module.exports = router;