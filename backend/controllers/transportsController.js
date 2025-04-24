const db = require("../config/db");

exports.getTransports = async (req, res) => {
  try {
    const [transports] = await db.query("SELECT * FROM transports");
    res.status(200).json(transports);
  } catch (error) {
    console.error("Error fetching transports:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch transports", error: error.message });
  }
};

exports.getTransportById = async (req, res) => {
  const { transportId } = req.params;

  try {
    const [transports] = await db.query(
      "SELECT * FROM transports WHERE id = ?",
      [transportId]
    );

    if (transports.length === 0) {
      return res.status(404).json({ message: "Transport not found" });
    }

    res.status(200).json(transports[0]);
  } catch (error) {
    console.error("Error fetching transport:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch transport", error: error.message });
  }
};

exports.createTransport = async (req, res) => {
  const {
    agency_id,
    origin,
    destination,
    transportation_type,
    cost,
    description
  } = req.body;

  // Validate required fields
  if (!agency_id || !origin || !destination || !cost) {
    return res.status(400).json({
      message:
        "Required fields missing: agency_id, origin, destination, and cost are required",
    });
  }
  
  // Validate cost is positive
  if (isNaN(cost) || parseFloat(cost) <= 0) {
    return res.status(400).json({
      message: "Cost must be a positive number"
    });
  }
  
  // Validate transportation type if provided
  if (transportation_type) {
    const validTypes = ['air', 'bus', 'train', 'ferry', 'car'];
    if (!validTypes.includes(transportation_type.toLowerCase())) {
      return res.status(400).json({
        message: "Invalid transportation type. Must be one of: " + validTypes.join(', ')
      });
    }
  }
  
  // Validate that origin and destination are different
  if (origin.toLowerCase() === destination.toLowerCase()) {
    return res.status(400).json({
      message: "Origin and destination must be different"
    });
  }

  try {
    // Verify the agency exists and is active
    const [agencyRows] = await db.query(
      "SELECT ta.id FROM travel_agencies ta JOIN users u ON ta.user_id = u.id WHERE ta.id = ? AND u.status = 'active'",
      [agency_id],
    );

    if (agencyRows.length === 0) {
      return res.status(404).json({ message: "Travel agency not found or not active" });
    }
    
    // Verify the origin and destination locations exist in our destinations if possible
    const [destinationRows] = await db.query(
      "SELECT name, region FROM destinations WHERE name LIKE ? OR name LIKE ? OR region LIKE ? OR region LIKE ?",
      [`%${origin}%`, `%${destination}%`, `%${origin}%`, `%${destination}%`]
    );
    
    if (destinationRows.length === 0) {
      // This is just a warning, not an error that prevents creation
      console.warn(`Warning: Origin "${origin}" or destination "${destination}" may not match known locations`);
    }

    // Create the transport
    const [result] = await db.query(
      `INSERT INTO transports (
        agency_id,
        origin,
        destination,
        transportation_type,
        cost,
        description
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        agency_id,
        origin,
        destination,
        transportation_type || null,
        cost,
        description || null
      ],
    );

    res.status(201).json({
      message: "Transport created successfully",
      id: result.insertId,
      origin,
      destination
    });
  } catch (error) {
    console.error("Error creating transport:", error);
    res.status(500).json({
      message: "Failed to create transport",
      error: error.message,
    });
  }
};

exports.updateTransport = async (req, res) => {
  const { transportId } = req.params;
  const updateData = req.body;

  try {
    // First check if the transport exists
    const [transportRows] = await db.query(
      "SELECT * FROM transports WHERE id = ?",
      [transportId]
    );

    if (transportRows.length === 0) {
      return res.status(404).json({
        message: "Transport not found",
      });
    }

    // Build update query dynamically based on provided fields
    const allowedFields = [
      "agency_id",
      "origin",
      "destination",
      "transportation_type",
      "cost",
      "description"
    ];

    const updates = [];
    const values = [];

    allowedFields.forEach((field) => {
      if (field in updateData) {
        updates.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // Add transportId as the last value
    values.push(transportId);

    // Execute update query
    await db.query(
      `UPDATE transports SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    res.status(200).json({ message: "Transport updated successfully" });
  } catch (error) {
    console.error("Error updating transport:", error);
    res.status(500).json({
      message: "Failed to update transport",
      error: error.message,
    });
  }
};

exports.deleteTransport = async (req, res) => {
  const { transportId } = req.params;

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // First check if the transport exists
      const [transportRows] = await connection.query(
        "SELECT * FROM transports WHERE id = ?",
        [transportId],
      );

      if (transportRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          message: "Transport not found"
        });
      }

      // Check if this transport is part of any bookings
      const [bookingItems] = await connection.query(
        `SELECT bi.id, b.status 
         FROM booking_items bi 
         JOIN bookings b ON bi.booking_id = b.id
         WHERE bi.item_type = 'transport' AND bi.item_id = ?`,
        [transportId]
      );

      // If transport is in active bookings, don't allow deletion
      const activeBookings = bookingItems.filter(
        item => item.status !== 'canceled' && item.status !== 'completed'
      );

      if (activeBookings.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          message: "Cannot delete transport that is part of active bookings",
          activeBookingsCount: activeBookings.length
        });
      }

      // If there are any bookings at all, mark as inactive instead of deleting
      if (bookingItems.length > 0) {
        await connection.query(
          "UPDATE transports SET status = 'inactive' WHERE id = ?", 
          [transportId]
        );
        
        await connection.commit();
        connection.release();
        return res.status(200).json({ 
          message: "Transport marked as inactive due to existing booking records" 
        });
      }

      // If not part of any bookings, we can safely delete
      await connection.query("DELETE FROM transports WHERE id = ?", [transportId]);
      
      await connection.commit();
      connection.release();
      res.status(200).json({ message: "Transport deleted successfully" });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error deleting transport:", error);
    res.status(500).json({
      message: "Failed to delete transport",
      error: error.message,
    });
  }
};