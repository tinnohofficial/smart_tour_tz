const express = require("express");
const router = express.Router();
const savingsController = require("../controllers/savingsController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Create savings account
router.post(
  "/",
  authenticateToken,
  checkRole("tourist"),
  savingsController.createSaving,
);

// Update savings account
router.put(
  "/",
  authenticateToken,
  checkRole("tourist"),
  savingsController.updateSaving,
);

module.exports = router;