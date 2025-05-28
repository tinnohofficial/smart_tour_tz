const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const checkRole = require('../middleware/checkRole');
const cartController = require('../controllers/cartController');

// All cart routes require authentication as tourist
router.use(authenticateToken);
router.use(checkRole('tourist'));

// Get or create active cart
router.get('/', cartController.getActiveCart);

// Add booking to cart
router.post('/add', cartController.addToCart);

// Remove booking from cart
router.delete('/remove/:bookingId', cartController.removeFromCart);

// Checkout cart (process payment for all bookings)
router.post('/checkout', cartController.checkoutCart);

// Clear cart
router.delete('/clear', cartController.clearCart);

module.exports = router;
