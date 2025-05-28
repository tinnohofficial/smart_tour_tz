const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const authenticateToken = require("../middleware/authenticateToken");

// Upload file endpoint
router.post(
  "/",
  authenticateToken,
  uploadController.uploadFile
);

// Delete file endpoint
router.delete(
  "/:filename",
  authenticateToken,
  uploadController.deleteFile
);

module.exports = router;