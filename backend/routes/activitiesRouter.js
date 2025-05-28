const express = require("express");
const router = express.Router();
const activitiesController = require("../controllers/activitiesController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Get all activities (optional filter by destination_id)
router.get("/", activitiesController.getActivities);

// Get activities with enhanced scheduling information
router.get("/scheduling", activitiesController.getActivitiesWithScheduling);

// Get activity availability
router.get("/:activityId/availability", activitiesController.getActivityAvailability);

// Get activity by ID
router.get("/:activityId", activitiesController.getActivityById);

// Create a new activity - only admin can create
router.post(
  "/",
  authenticateToken,
  checkRole("admin"),
  activitiesController.createActivity,
);

// Update an activity - only admin can update
router.put(
  "/:activityId",
  authenticateToken,
  checkRole("admin"),
  activitiesController.updateActivity,
);

// Delete an activity - only admin can delete
router.delete(
  "/:activityId",
  authenticateToken,
  checkRole("admin"),
  activitiesController.deleteActivity,
);

module.exports = router;