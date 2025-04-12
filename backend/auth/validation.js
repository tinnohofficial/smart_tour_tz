const { body } = require("express-validator");

exports.validateRegistration = [
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
