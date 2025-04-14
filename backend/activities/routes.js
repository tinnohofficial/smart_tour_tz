const express = require("express");
const router = express.Router();
const activitiesController = require("./controller");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Public routes
// Get activities for a destination (F6.6)
router.get("/", activitiesController.getActivities);

// Get detailed activity info
router.get("/:activityId", activitiesController.getActivityById);

// Tour guide routes (F6.9)
// Get activities created by the authenticated tour guide
router.get(
  "/tour-guide/my-activities",
  authenticateToken,
  checkRole("tour_guide"),
  activitiesController.getTourGuideActivities
);

// Create a new activity
router.post(
  "/",
  authenticateToken,
  checkRole("tour_guide"),
  activitiesController.createActivity
);

// Update an activity
router.put(
  "/:activityId",
  authenticateToken,
  checkRole("tour_guide"),
  activitiesController.updateActivity
);

// Delete an activity
router.delete(
  "/:activityId",
  authenticateToken,
  checkRole("tour_guide"),
  activitiesController.deleteActivity
);

module.exports = router;