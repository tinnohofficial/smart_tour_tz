const express = require("express");
const router = express.Router();
const applicationsController = require("../controllers/applicationsController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

router.use(authenticateToken, checkRole("admin"));

router.get(
  "/pending",
  applicationsController.getPendingApplications,
);
router.patch(
  "/:userId/status",
  applicationsController.updateApplicationStatus,
);

module.exports = router;
