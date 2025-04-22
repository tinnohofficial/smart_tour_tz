const express = require("express");
const router = express.Router();
const checkRole = require("../middleware/checkRole");
const authenticateToken = require("../middleware/authenticateToken");
const destinationsController = require("../controllers/destinationsController");

router.get("/", destinationsController.getDestinations);

router.get("/:destinationId", destinationsController.getDestinationById);

router.post(
  "/destinations",
  authenticateToken,
  checkRole("admin"),
  destinationsController.createDestination,
);

router.put(
  "/destinations/:destinationId",
  authenticateToken,
  checkRole("admin"),
  destinationsController.updateDestination,
);

router.delete(
  "/destinations/:destinationId",
  authenticateToken,
  checkRole("admin"),
  destinationsController.deleteDestination,
);

module.exports = router;
