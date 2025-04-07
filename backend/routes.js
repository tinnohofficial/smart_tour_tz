// backend/routes.js (Aggregate all routes)
const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
// Import other routes (bookings, payments, locations, etc.) when created
// const bookingRoutes = require('./routes/bookings');
// const paymentRoutes = require('./routes/payments');
// const locationRoutes = require('./routes/locations');

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes); // e.g., /api/users/me
router.use("/admin", adminRoutes); // e.g., /api/admin/applications/pending
// router.use('/bookings', bookingRoutes);
// router.use('/payments', paymentRoutes);
// router.use('/destinations', locationRoutes); // Example for destinations/activities

// Simple health check for the API
router.get("/health", (req, res) => {
  res.json({ status: "UP" });
});

module.exports = router;
