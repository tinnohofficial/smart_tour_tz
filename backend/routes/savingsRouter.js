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

// Confirm Stripe payment
router.post(
  "/confirm-payment",
  authenticateToken,
  checkRole("tourist"),
  savingsController.confirmStripePayment,
);

// Get savings balance
router.get(
  "/balance",
  authenticateToken,
  checkRole("tourist"),
  savingsController.getSavingsBalance,
);

// Get live blockchain balance
router.get(
  "/live-balance",
  authenticateToken,
  checkRole("tourist"),
  savingsController.getLiveBlockchainBalance,
);

module.exports = router;
