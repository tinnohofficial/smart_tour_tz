const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticateToken = require("../middleware/authenticateToken");
const { body } = require("express-validator");

validateRegistration = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  // .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter')
  // .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body("phone_number")
    .optional({ checkFalsy: true })
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),

  body("role")
    .isIn(["tourist", "tour_guide", "hotel_manager", "travel_agent"])
    .withMessage("Invalid role selected for registration"),
];

router.post("/register", validateRegistration, authController.register);
router.post("/login", authController.login);

// F4.1: Update password - migrated from users controller
router.put("/password", authenticateToken, authController.updatePassword);

module.exports = router;
