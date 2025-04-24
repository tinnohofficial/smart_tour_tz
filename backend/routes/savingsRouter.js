const express = require("express");
const router = express.Router();
const savingsController = require("../controllers/savingsController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");

// F5.2: Configure web3 wallet address for crypto payments
router.put(
  "/wallet",
  authenticateToken,
  checkRole("tourist"),
  savingsController.configureWalletAddress,
);

// F5.3: Deposit fiat funds for future trips
router.post(
  "/deposit/fiat",
  authenticateToken,
  checkRole("tourist"),
  savingsController.depositFiatFunds,
);

// F5.5: Deposit crypto funds for future trips
router.post(
  "/deposit/crypto",
  authenticateToken,
  checkRole("tourist"),
  savingsController.depositCryptoFunds,
);

// Get savings balance
router.get(
  "/balance",
  authenticateToken,
  checkRole("tourist"),
  savingsController.getSavingsBalance,
);

module.exports = router;
