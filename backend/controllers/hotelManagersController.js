const db = require("../config/db");

exports.submitHotelManagerProfile = async (req, res) => {
  const {
    name,
    location,
    description,
    facilities_images_urls,
    capacity,
    base_price_per_night,
  } = req.body;
  const userId = req.user.id;

  try {
    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert new hotel
      await connection.query(
        `INSERT INTO hotels (
            manager_user_id,
            name,
            location,
            description,
            facilities_images_urls,
            capacity,
            base_price_per_night
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          name,
          location,
          description,
          JSON.stringify(facilities_images_urls),
          capacity,
          base_price_per_night,
        ],
      );

      // Update user status to pending_approval if initial submission
      const [userResult] = await connection.query(
        "SELECT status FROM users WHERE id = ?",
        [userId],
      );

      if (userResult[0].status === "pending_profile") {
        await connection.query(
          "UPDATE users SET status = 'pending_approval' WHERE id = ?",
          [userId],
        );
      }

      await connection.commit();
      res
        .status(200)
        .json({ message: "Hotel manager profile submitted successfully" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error in hotel manager profile submission:", error);
    res.status(500).json({
      message: "Failed to submit hotel manager profile",
      error: error.message,
    });
  }
};

/**
 * Get hotel details for managers to view their own hotel
 */
exports.getHotelDetails = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      "SELECT * FROM hotels WHERE manager_user_id = ?",
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const hotel = rows[0];

    // Parse JSON fields if they exist
    if (hotel.facilities_images_urls) {
      try {
        hotel.facilities_images_urls = JSON.parse(hotel.facilities_images_urls);
      } catch (e) {
        // Keep as is if parsing fails
      }
    }

    // Get user data as well
    const [userRows] = await db.query(
      "SELECT email, phone_number, status FROM users WHERE id = ?",
      [userId],
    );

    const responseData = {
      ...hotel,
      email: userRows[0].email,
      phone_number: userRows[0].phone_number,
      status: userRows[0].status,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching hotel details:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch hotel details", error: error.message });
  }
};

/**
 * Update hotel manager profile
 */
exports.updateHotelProfile = async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    location,
    description,
    facilities_images_urls,
    capacity,
    base_price_per_night,
  } = req.body;

  try {
    // Check if hotel exists
    const [hotelRows] = await db.query(
      "SELECT id FROM hotels WHERE manager_user_id = ?",
      [userId],
    );

    if (hotelRows.length === 0) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Update the fields that are provided
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
    }

    if (location !== undefined) {
      updates.push("location = ?");
      params.push(location);
    }

    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description);
    }

    if (facilities_images_urls !== undefined) {
      updates.push("facilities_images_urls = ?");
      params.push(JSON.stringify(facilities_images_urls));
    }

    if (capacity !== undefined) {
      updates.push("capacity = ?");
      params.push(capacity);
    }

    if (base_price_per_night !== undefined) {
      updates.push("base_price_per_night = ?");
      params.push(base_price_per_night);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    // Add user_id to params for WHERE clause
    params.push(userId);

    await db.query(
      `UPDATE hotels SET ${updates.join(", ")} WHERE manager_user_id = ?`,
      params,
    );

    res.status(200).json({ message: "Hotel profile updated successfully" });
  } catch (error) {
    console.error("Error updating hotel profile:", error);
    res
      .status(500)
      .json({ message: "Failed to update profile", error: error.message });
  }
};
