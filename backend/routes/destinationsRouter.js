const express = require("express");
const router = express.Router();
const destinationsController = require("../controllers/destinationsController");

router.get("/", destinationsController.getDestinations);

router.get("/:destinationId", destinationsController.getDestinationById);

module.exports = router;
