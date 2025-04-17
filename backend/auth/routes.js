const express = require("express");
const router = express.Router();
const authController = require("./controller");
const passwordController = require("./password");
const { validateRegistration } = require('./validation');
const authenticateToken = require("../middleware/authenticateToken");

router.post("/register", validateRegistration, authController.register);
router.post("/login", authController.login);

// F4.1: Update password - migrated from users controller
router.put(
  "/password",
  authenticateToken,
  passwordController.updatePassword
);

module.exports = router;