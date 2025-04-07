// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Protect all admin routes
router.use(authenticateToken, checkRole("admin"));

router.get("/applications/pending", adminController.getPendingApplications);
router.patch(
  "/applications/:userId/status",
  adminController.updateApplicationStatus,
); // PATCH or PUT for updates

module.exports = router;
