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

// Connect wallet
router.post(
  "/connect-wallet",
  authenticateToken,
  checkRole("tourist"),
  savingsController.connectWallet,
);

// Disconnect wallet
router.post(
  "/disconnect-wallet",
  authenticateToken,
  checkRole("tourist"),
  savingsController.disconnectWallet,
);

// Get conversion rates
router.get(
  "/conversion-rates",
  authenticateToken,
  savingsController.getConversionRates,
);

// Get network info
router.get(
  "/network-info",
  authenticateToken,
  savingsController.getNetworkInfo,
);

// Process automatic crypto payment
router.post(
  "/crypto-payment",
  authenticateToken,
  checkRole("tourist"),
  savingsController.processAutomaticCryptoPayment,
);

module.exports = router;
