// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const adminController = require("./controller");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Protect all admin routes
router.use(authenticateToken, checkRole("admin"));

router.get("/applications/pending", adminController.getPendingApplications);
router.patch(
  "/applications/:userId/status",
  adminController.updateApplicationStatus,
); // PATCH or PUT for updates

router.post("/destinations", adminController.createDestination);
router.put("/destinations/:destinationId", adminController.updateDestination);
router.delete(
  "/destinations/:destinationId",
  adminController.deleteDestination,
);

module.exports = router;
