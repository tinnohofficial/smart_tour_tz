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
    .isLength({ min: 13, max: 13 })
    .withMessage("Phone number must be in format +255XXXXXXXXX (13 characters)")
    .matches(/^\+255\d{9}$/)
    .withMessage("Phone number must start with +255 followed by 9 digits"),

  body("role")
    .isIn(["tourist", "tour_guide", "hotel_manager", "travel_agent"])
    .withMessage("Invalid role selected for registration"),
];

router.post("/register", validateRegistration, authController.register);
router.post("/login", authController.login);

// F4.1: Update password - migrated from users controller
router.put("/password", authenticateToken, authController.updatePassword);

// F4.2: Update email
router.put("/email", authenticateToken, authController.updateEmail);

// F4.3: Update phone number
router.put("/phone", authenticateToken, authController.updatePhone);

module.exports = router;
