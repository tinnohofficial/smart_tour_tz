// filepath: /Users/tinnoh/fyp/backend/payments/routes.js
const express = require('express');
const router = express.Router();
const paymentController = require('./controller');
const authenticateToken = require('../middleware/authenticateToken');
const checkRole = require('../middleware/checkRole');

// F5.1: Store credit card details for payment
router.post(
  '/methods',
  authenticateToken,
  checkRole('tourist'),
  paymentController.addPaymentMethod
);

// Get user's payment methods
router.get(
  '/methods',
  authenticateToken,
  checkRole('tourist'),
  paymentController.getUserPaymentMethods
);

// F5.4/F5.5: Make payment for booking
router.post(
  '/bookings/:bookingId/pay',
  authenticateToken,
  checkRole('tourist'),
  paymentController.processBookingPayment
);

module.exports = router;