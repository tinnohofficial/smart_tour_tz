const db = require("../config/db");

exports.getPendingApplications = async (req, res) => {
  try {
    const [applications] = await db.query(
      `SELECT u.id, u.email, u.phone_number, u.role, u.created_at,
                    CASE u.role
                        WHEN 'tour_guide' THEN tg.full_name
                        WHEN 'hotel_manager' THEN h.name
                        WHEN 'travel_agent' THEN ta.name
                        ELSE NULL
                    END as entity_name
             FROM users u
             LEFT JOIN tour_guides tg ON u.id = tg.user_id AND u.role = 'tour_guide'
             LEFT JOIN hotels h ON u.id = h.manager_user_id AND u.role = 'hotel_manager'
             LEFT JOIN travel_agencies ta ON u.id = ta.agent_user_id AND u.role = 'travel_agent'
             WHERE u.status = 'pending_approval'`,
    );
    res.json(applications);
  } catch (error) {
    console.error("Error fetching pending applications:", error);
    res.status(500).json({ message: "Failed to fetch applications." });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  const { userId } = req.params;
  const { newStatus } = req.body; // Expecting 'active' or 'rejected'

  if (!["active", "rejected"].includes(newStatus)) {
    return res.status(400).json({
      message: 'Invalid status provided. Must be "active" or "rejected".',
    });
  }

  try {
    const [result] = await db.query(
      "UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?",
      [newStatus, userId, "pending_approval"],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Application not found or not in pending state." });
    }

    // If approved and user is tourist, ensure savings account exists
    if (newStatus === "active") {
      const [userRoleResult] = await db.query(
        "SELECT role FROM users WHERE id = ?",
        [userId],
      );
      if (userRoleResult.length > 0 && userRoleResult[0].role === "tourist") {
        await db.query(
          "INSERT INTO savings_accounts (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id=user_id",
          [userId],
        );
      }
    }

    res.json({ message: `Application status updated to ${newStatus}.` });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: "Failed to update status." });
  }
};
