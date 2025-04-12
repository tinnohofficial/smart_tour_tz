const express = require("express");
const router = express.Router();
const authController = require("./controller");
const { validateRegistration } = require('./validation');

router.post("/register", validateRegistration, authController.register);
router.post("/login", authController.login);

module.exports = router;