const express = require("express");
const router = express.Router();
const destinationsController = require("./controller");

// Get list of destinations (F6.1)
router.get("/", destinationsController.getDestinations);

// Get detailed destination info (F6.2)
router.get("/:destinationId", destinationsController.getDestinationById);

module.exports = router;