const db = require("../config/db");

exports.completeTourGuideProfile = async (req, res) => {
  const userId = req.user.id; // From authenticateToken middleware
  const { full_name, license_document_url, location, expertise } = req.body;

  if (req.user.role !== "tour_guide") {
    return res.status(403).json({
      message: "Forbidden: Only tour guides can complete this profile.",
    });
  }
  if (!full_name || !location || !expertise) {
    return res
      .status(400)
      .json({ message: "Full name, location, and expertise are required." });
  }

  try {
    // Use INSERT ... ON DUPLICATE KEY UPDATE to handle creation or update
    await db.query(
      `INSERT INTO tour_guides (user_id, full_name, license_document_url, location, expertise)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                full_name = VALUES(full_name),
                license_document_url = VALUES(license_document_url),
                location = VALUES(location),
                expertise = VALUES(expertise)`,
      [userId, full_name, license_document_url, location, expertise],
    );

    // Update user status to pending_approval
    await db.query(
      "UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?",
      ["pending_approval", userId, "pending_profile"], // Only update if status was pending_profile
    );

    res.json({
      message:
        "Tour guide profile submitted successfully. Awaiting admin approval.",
    });
  } catch (error) {
    console.error("Error completing tour guide profile:", error);
    res.status(500).json({ message: "Failed to update profile." });
  }
};
