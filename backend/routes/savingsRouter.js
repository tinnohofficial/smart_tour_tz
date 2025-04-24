const express = require("express");
const router = express.Router();
const savingsController = require("../controllers/savingsController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// Deposit funds into savings account
router.post(
  "/deposit",
  authenticateToken,
  checkRole("tourist"),
  savingsController.depositFunds,
);

// Get savings balance
router.get(
  "/balance",
  authenticateToken,
  checkRole("tourist"),
  savingsController.getSavingsBalance,
);

module.exports = router;
