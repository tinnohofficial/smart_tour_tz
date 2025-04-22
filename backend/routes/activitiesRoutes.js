const express = require("express");
const router = express.Router();
const activitiesController = require("../controllers/activitiesController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

router.get("/", activitiesController.getActivities);

router.get("/:activityId", activitiesController.getActivityById);

// Get activities created by the authenticated tour guide
router.get(
  "/tour-guide/my-activities",
  authenticateToken,
  checkRole("tour_guide"),
  activitiesController.getTourGuideActivities,
);

// Create a new activity
router.post(
  "/",
  authenticateToken,
  checkRole("tour_guide"),
  activitiesController.createActivity,
);

// Update an activity
router.put(
  "/:activityId",
  authenticateToken,
  checkRole("tour_guide"),
  activitiesController.updateActivity,
);

// Delete an activity
router.delete(
  "/:activityId",
  authenticateToken,
  checkRole("tour_guide"),
  activitiesController.deleteActivity,
);

module.exports = router;
