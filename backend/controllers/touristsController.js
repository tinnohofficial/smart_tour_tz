const db = require("../config/db");

/**
 * Get tourist profile details
 */
exports.getTouristProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    // For tourists, we primarily return user data
    const [userRows] = await db.query(
      "SELECT id, email, phone_number, status, created_at FROM users WHERE id = ?",
      [userId],
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userRows[0];

    // Get recent bookings
    const [bookingsData] = await db.query(
      `SELECT id, total_cost, status, created_at
       FROM bookings WHERE tourist_user_id = ?
       ORDER BY created_at DESC LIMIT 5`,
      [userId],
    );

    const responseData = {
      ...userData,
      recentBookings: bookingsData,
    };

    // Get saved destinations/favorites if implemented
    // const [favoritesData] = await db.query(...);
    // responseData.favorites = favoritesData;

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching tourist profile:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch profile", error: error.message });
  }
};

/**
 * Update tourist profile
 * Note: Currently limited to user table fields as tourists don't have their own profile table
 */
exports.updateTouristProfile = async (req, res) => {
  const userId = req.user.id;
  const { phone_number } = req.body;

  try {
    // Only allow updating phone_number for now
    // Could expand to other fields or create a tourists table in the future
    if (phone_number !== undefined) {
      await db.query(
        "UPDATE users SET phone_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [phone_number, userId],
      );

      res.status(200).json({ message: "Tourist profile updated successfully" });
    } else {
      res.status(400).json({ message: "No fields to update" });
    }
  } catch (error) {
    console.error("Error updating tourist profile:", error);
    res
      .status(500)
      .json({ message: "Failed to update profile", error: error.message });
  }
};
