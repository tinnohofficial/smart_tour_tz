const db = require("../config/db");

/**
 * Submit or update tour guide profile
 * Requirement: F2.1
 */
exports.submitTourGuideProfile = async (req, res) => {
  const userId = req.user.id;
  const { full_name, license_document_url, location, expertise } = req.body;

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
      [userId, full_name, license_document_url, location, expertise]
    );

    // Update user status to pending_approval if initial submission
    const [userResult] = await db.query(
      "SELECT status FROM users WHERE id = ?",
      [userId]
    );

    if (userResult[0].status === 'pending_profile') {
      await db.query(
        "UPDATE users SET status = 'pending_approval', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [userId]
      );
    }

    res.json({
      message: "Tour guide profile submitted successfully. Awaiting admin approval."
    });
  } catch (error) {
    console.error("Error completing tour guide profile:", error);
    res.status(500).json({ message: "Failed to update profile." });
  }
};

/**
 * Get tour guide profile details
 */
exports.getGuideProfile = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [rows] = await db.query(
      "SELECT * FROM tour_guides WHERE user_id = ?",
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Tour guide profile not found" });
    }
    
    const guide = rows[0];
    
    // Get user data as well
    const [userRows] = await db.query(
      "SELECT email, phone_number, status FROM users WHERE id = ?",
      [userId]
    );
    
    const responseData = {
      ...guide,
      email: userRows[0].email,
      phone_number: userRows[0].phone_number,
      status: userRows[0].status
    };
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching tour guide profile:", error);
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};

/**
 * Update tour guide profile
 */
exports.updateGuideProfile = async (req, res) => {
  const userId = req.user.id;
  const { full_name, location, expertise } = req.body;
  
  try {
    // Check if profile exists
    const [guideRows] = await db.query(
      "SELECT id FROM tour_guides WHERE user_id = ?",
      [userId]
    );
    
    if (guideRows.length === 0) {
      return res.status(404).json({ message: "Tour guide profile not found" });
    }
    
    // Update the fields that are provided
    const updates = [];
    const params = [];
    
    if (full_name !== undefined) {
      updates.push("full_name = ?");
      params.push(full_name);
    }
    
    if (location !== undefined) {
      updates.push("location = ?");
      params.push(location);
    }
    
    if (expertise !== undefined) {
      updates.push("expertise = ?");
      params.push(expertise);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }
    
    // Add user_id to params for WHERE clause
    params.push(userId);
    
    await db.query(
      `UPDATE tour_guides SET ${updates.join(", ")} WHERE user_id = ?`,
      params
    );
    
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating tour guide profile:", error);
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

/**
 * Get bookings assigned to this tour guide
 */
exports.getAssignedBookings = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [rows] = await db.query(
      `SELECT a.id, a.name, a.description, a.location, a.date,
              a.group_size, a.status, a.price,
              b.id as booking_id, b.created_at as booking_date,
              u.email as tourist_email
       FROM activities a
       JOIN booking_items bi ON bi.item_id = a.id AND bi.item_type = 'activity'
       JOIN bookings b ON bi.booking_id = b.id
       JOIN users u ON b.tourist_user_id = u.id
       WHERE a.guide_user_id = ?
       ORDER BY a.date DESC`,
      [userId]
    );
    
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching assigned bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
  }
};