const db = require("../config/db");

exports.getAllHotels = async (req, res) => {
    try {
        const { location } = req.query;
        
        let query = `
            SELECT h.* 
            FROM hotels h
            JOIN users u ON h.id = u.id
            WHERE u.status = 'active' AND h.is_available = TRUE
        `;
        
        const params = [];
        
        // If location query param is provided, filter hotels by location
        if (location) {
            query += ` AND h.location LIKE ?`;
            params.push(`%${location}%`);
        }
        
        const [rows] = await db.query(query, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching hotels:", error);
        res.status(500).json({ message: "Failed to fetch hotels", error: error.message });
    }
}

exports.getHotelById = async (req, res) => {
    const hotelId = req.params.id;

    try {
        const [rows] = await db.query("SELECT * FROM hotels WHERE id = ?", [hotelId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Hotel not found" });
        }

        const hotel = rows[0];

        // Parse JSON fields if they exist
        if (hotel.images) {
            try {
                hotel.images = JSON.parse(hotel.images);
            } catch (e) {
                // Keep as is if parsing fails
            }
        }

        res.status(200).json(hotel);
    } catch (error) {
        console.error("Error fetching hotel details:", error);
        res.status(500).json({ message: "Failed to fetch hotel details", error: error.message });
    }
}

exports.createHotel = async (req, res) => {
  const {
    name,
    location,
    description,
    images,
    capacity,
    base_price_per_night,
  } = req.body;
  const userId = req.user.id;

  console.log("Hotel profile submission:", {
    userId,
    body: req.body,
    userRole: req.user.role,
    userStatus: req.user.status
  });

  // Validate required fields
  if (!name || !location || !description || !capacity || !base_price_per_night) {
    return res.status(400).json({
      message: "Required fields missing: name, location, description, capacity, and base_price_per_night are required"
    });
  }
  
  // Validate capacity is a positive number
  if (isNaN(capacity) || parseInt(capacity) <= 0) {
    return res.status(400).json({
      message: "Capacity must be a positive number"
    });
  }
  
  // Validate price is a positive number
  if (isNaN(base_price_per_night) || parseFloat(base_price_per_night) <= 0) {
    return res.status(400).json({
      message: "Base price per night must be a positive number"
    });
  }
  
  // Validate images if provided
  if (images) {
    if (!Array.isArray(images)) {
      return res.status(400).json({
        message: "Images must be an array of image URLs"
      });
    }
    
    for (const imageUrl of images) {
      if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
        return res.status(400).json({
          message: "Each image URL must be a non-empty string"
        });
      }
    }
  }

  try {
    // Check if user exists and get their current status
    const [userRows] = await db.query(
      "SELECT id, role, status FROM users WHERE id = ? AND role = 'hotel_manager'",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ 
        message: "Hotel manager user not found. Please check your account." 
      });
    }

    // Check if the hotel manager already has a hotel
    const [existingHotels] = await db.query(
      "SELECT id FROM hotels WHERE id = ?",
      [userId]
    );

    if (existingHotels.length > 0) {
      return res.status(400).json({ 
        message: "Hotel manager already has a hotel. Only one hotel is allowed per manager." 
      });
    }

    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert new hotel using the user's ID directly
      await connection.query(
        `INSERT INTO hotels (
            id,
            name,
            location,
            description,
            images,
            capacity,
            base_price_per_night,
            is_available
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          name,
          location,
          description,
          JSON.stringify(images || []),
          parseInt(capacity),
          parseFloat(base_price_per_night),
          true, // Default to available
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
        .json({ message: "Hotel created successfully. Your profile is now pending approval." });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error in hotel creation:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Failed to create hotel",
      error: error.message,
    });
  }
};



exports.updateHotel = async (req, res) => {
  const hotelId = req.params.id;
  const userId = req.user.id;
  const {
    name,
    location,
    description,
    images,
    capacity,
    base_price_per_night,
    is_available,
  } = req.body;

  try {
    // Authorization check: ensure the hotel manager can only update their own hotel
    if (hotelId !== userId.toString()) {
      return res.status(403).json({ 
        message: "Access denied. You can only update your own hotel." 
      });
    }

    // Check if hotel exists
    const [hotelRows] = await db.query(
      "SELECT id FROM hotels WHERE id = ?",
      [hotelId],
    );

    if (hotelRows.length === 0) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Validate inputs if provided
    if (capacity !== undefined && (isNaN(capacity) || parseInt(capacity) <= 0)) {
      return res.status(400).json({
        message: "Capacity must be a positive number"
      });
    }
    
    if (base_price_per_night !== undefined && (isNaN(base_price_per_night) || parseFloat(base_price_per_night) <= 0)) {
      return res.status(400).json({
        message: "Base price per night must be a positive number"
      });
    }

    if (images !== undefined && !Array.isArray(images)) {
      return res.status(400).json({
        message: "Images must be an array of image URLs"
      });
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

    if (images !== undefined) {
      updates.push("images = ?");
      params.push(JSON.stringify(images));
    }

    if (capacity !== undefined) {
      updates.push("capacity = ?");
      params.push(parseInt(capacity));
    }

    if (base_price_per_night !== undefined) {
      updates.push("base_price_per_night = ?");
      params.push(parseFloat(base_price_per_night));
    }

    if (is_available !== undefined) {
      updates.push("is_available = ?");
      params.push(Boolean(is_available));
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    // Add hotel_id to params for WHERE clause
    params.push(hotelId);

    await db.query(
      `UPDATE hotels SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );

    res.status(200).json({ message: "Hotel updated successfully" });
  } catch (error) {
    console.error("Error updating hotel:", error);
    res
      .status(500)
      .json({ message: "Failed to update hotel", error: error.message });
  }
};


