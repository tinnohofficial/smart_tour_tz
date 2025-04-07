// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
// Add /refresh-token, /forgot-password, /reset-password endpoints if needed

module.exports = router;
