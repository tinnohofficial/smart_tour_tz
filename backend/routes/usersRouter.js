const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const authenticateToken = require("../middleware/authenticateToken");
const checkRole = require("../middleware/checkRole");
const { body } = require("express-validator");
const { isValidPhoneNumber } = require('libphonenumber-js');

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
    .custom((value) => {
      if (value && !isValidPhoneNumber(value)) {
        throw new Error('Please provide a valid international phone number');
      }
      return true;
    }),

  body("role")
    .isIn(["tourist", "tour_guide", "hotel_manager", "travel_agent"])
    .withMessage("Invalid role selected for registration"),
];

router.post("/register", validateRegistration, usersController.register);
router.post("/login", usersController.login);
router.post("/refresh-token", authenticateToken, usersController.refreshToken);

// F4.1: Update password - migrated from users controller
router.put("/password", authenticateToken, usersController.updatePassword);

// F4.2: Update email
router.put("/email", authenticateToken, usersController.updateEmail);

// F4.3: Update phone number
router.put("/update-phone", authenticateToken, usersController.updatePhone);

// Balance management routes (for tourists only)
router.get("/balance", authenticateToken, checkRole("tourist"), usersController.getBalance);
router.put("/balance", authenticateToken, checkRole("tourist"), usersController.updateBalance);

module.exports = router;