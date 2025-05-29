const db = require("../config/db");

exports.getTransports = async (req, res) => {
  try {
    const { origin_id, destination_id } = req.query;
    
    let query = `
      SELECT t.*, 
             to_orig.name as origin_name,
             d.name as destination_name,
             d.region as destination_region,
             ta.name as agency_name,
             ta.contact_phone as agency_phone,
             ta.contact_email as agency_email
      FROM transports t
      JOIN users u ON t.agency_id = u.id
      JOIN transport_origins to_orig ON t.origin_id = to_orig.id
      JOIN destinations d ON t.destination_id = d.id
      JOIN travel_agencies ta ON t.agency_id = ta.id
      WHERE u.status = 'active'
    `;
    
    const params = [];
    
    // Filter by origin if provided
    if (origin_id) {
      query += ` AND t.origin_id = ?`;
      params.push(origin_id);
    }
    
    // Filter by destination if provided
    if (destination_id) {
      query += ` AND t.destination_id = ?`;
      params.push(destination_id);
    }
    
    query += ` ORDER BY t.cost ASC`;
    
    const [transports] = await db.query(query, params);
    
    // Parse route_details JSON field if it exists
    const processedTransports = transports.map(transport => {
      if (transport.route_details && typeof transport.route_details === 'string') {
        try {
          transport.route_details = JSON.parse(transport.route_details);
        } catch (e) {
          console.warn('Failed to parse route_details for transport:', transport.id);
        }
      }
      return transport;
    });
    
    res.status(200).json(processedTransports);
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
      `SELECT t.*, 
              to_orig.name as origin_name,
              d.name as destination_name,
              d.region as destination_region,
              ta.name as agency_name,
              ta.contact_phone as agency_phone,
              ta.contact_email as agency_email
       FROM transports t
       JOIN users u ON t.agency_id = u.id
       JOIN transport_origins to_orig ON t.origin_id = to_orig.id
       JOIN destinations d ON t.destination_id = d.id
       JOIN travel_agencies ta ON t.agency_id = ta.id
       WHERE t.id = ? AND u.status = 'active'`,
      [transportId]
    );

    if (transports.length === 0) {
      return res.status(404).json({ message: "Transport not found" });
    }

    const transport = transports[0];
    
    // Parse route_details JSON field if it exists
    if (transport.route_details && typeof transport.route_details === 'string') {
      try {
        transport.route_details = JSON.parse(transport.route_details);
      } catch (e) {
        console.warn('Failed to parse route_details for transport:', transport.id);
      }
    }

    res.status(200).json(transport);
  } catch (error) {
    console.error("Error fetching transport:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch transport", error: error.message });
  }
};

exports.createTransport = async (req, res) => {
  const {
    origin_id,
    destination_id,
    transportation_type,
    cost,
    description,
    route_details
  } = req.body;

  // Use the authenticated user's ID as the agency_id
  const agency_id = req.user.id;

  // Validate required fields
  if (!origin_id || !destination_id || !cost) {
    return res.status(400).json({
      message:
        "Required fields missing: origin_id, destination_id, and cost are required",
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
  if (origin_id === destination_id) {
    return res.status(400).json({
      message: "Origin and destination must be different"
    });
  }

  try {
    // Verify the user is an active travel agent with a profile
    const [agencyRows] = await db.query(
      "SELECT ta.id FROM travel_agencies ta JOIN users u ON ta.id = u.id WHERE ta.id = ? AND u.status = 'active' AND u.role = 'travel_agent'",
      [agency_id],
    );

    if (agencyRows.length === 0) {
      return res.status(404).json({ message: "Travel agency profile not found or not active" });
    }
    
    // Verify the origin exists
    const [originRows] = await db.query(
      "SELECT id, name FROM transport_origins WHERE id = ?",
      [origin_id]
    );
    
    if (originRows.length === 0) {
      return res.status(400).json({ message: "Invalid origin ID" });
    }
    
    // Verify the destination exists
    const [destinationRows] = await db.query(
      "SELECT id, name FROM destinations WHERE id = ?",
      [destination_id]
    );
    
    if (destinationRows.length === 0) {
      return res.status(400).json({ message: "Invalid destination ID" });
    }

    // Create the transport
    const [result] = await db.query(
      `INSERT INTO transports (
        agency_id,
        origin_id,
        destination_id,
        transportation_type,
        cost,
        description,
        route_details
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        agency_id,
        origin_id,
        destination_id,
        transportation_type || 'bus',
        cost,
        description || null,
        route_details ? JSON.stringify(route_details) : null
      ],
    );

    // Fetch the newly created transport to return complete data
    const [newTransport] = await db.query(
      `SELECT t.*, 
              to_origin.name as origin_name, 
              d.name as destination_name 
       FROM transports t
       JOIN transport_origins to_origin ON t.origin_id = to_origin.id
       JOIN destinations d ON t.destination_id = d.id
       WHERE t.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Transport route created successfully",
      ...newTransport[0]
    });
  } catch (error) {
    console.error("Error creating transport:", error);
    res.status(500).json({
      message: "Failed to create transport route",
      error: error.message,
    });
  }
};

exports.updateTransport = async (req, res) => {
  const { transportId } = req.params;
  const updateData = req.body;
  const userId = req.user.id;

  try {
    // First check if the transport exists and belongs to this agency
    const [transportRows] = await db.query(
      "SELECT * FROM transports WHERE id = ? AND agency_id = ?",
      [transportId, userId]
    );

    if (transportRows.length === 0) {
      return res.status(404).json({
        message: "Transport not found or you don't have permission to update it",
      });
    }

    // Build update query dynamically based on provided fields
    const allowedFields = [
      "origin_id",
      "destination_id", 
      "transportation_type",
      "cost",
      "description",
      "route_details"
    ];

    const updates = [];
    const values = [];

    allowedFields.forEach((field) => {
      if (field in updateData) {
        if (field === "route_details" && updateData[field]) {
          // Handle JSON field
          updates.push(`${field} = ?`);
          values.push(JSON.stringify(updateData[field]));
        } else {
          updates.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // Validate origin_id and destination_id if provided
    if (updateData.origin_id) {
      const [originRows] = await db.query(
        "SELECT id FROM transport_origins WHERE id = ?",
        [updateData.origin_id]
      );
      if (originRows.length === 0) {
        return res.status(400).json({ message: "Invalid origin ID" });
      }
    }

    if (updateData.destination_id) {
      const [destinationRows] = await db.query(
        "SELECT id FROM destinations WHERE id = ?",
        [updateData.destination_id]
      );
      if (destinationRows.length === 0) {
        return res.status(400).json({ message: "Invalid destination ID" });
      }
    }

    // Add transportId as the last value
    values.push(transportId);

    // Execute update query
    await db.query(
      `UPDATE transports SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    // Fetch the updated transport to return complete data
    const [updatedTransport] = await db.query(
      `SELECT t.*, 
              to_origin.name as origin_name, 
              d.name as destination_name 
       FROM transports t
       JOIN transport_origins to_origin ON t.origin_id = to_origin.id
       JOIN destinations d ON t.destination_id = d.id
       WHERE t.id = ?`,
      [transportId]
    );

    res.status(200).json({ 
      message: "Transport updated successfully",
      ...updatedTransport[0]
    });
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
  const userId = req.user.id;

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // First check if the transport exists and belongs to this agency
      const [transportRows] = await connection.query(
        "SELECT * FROM transports WHERE id = ? AND agency_id = ?",
        [transportId, userId],
      );

      if (transportRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          message: "Transport not found or you don't have permission to delete it"
        });
      }

      // Check if this transport is part of any bookings
      const [bookingItems] = await connection.query(
        `SELECT bi.id, b.status 
         FROM booking_items bi 
         JOIN bookings b ON bi.booking_id = b.id
         WHERE bi.item_type = 'transport' AND bi.id = ?`,
        [transportId]
      );

      // If transport is in active bookings, don't allow deletion
      const activeBookings = bookingItems.filter(
        item => item.status !== 'cancelled' && item.status !== 'completed'
      );

      if (activeBookings.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          message: "Cannot delete transport that is part of active bookings",
          activeBookingsCount: activeBookings.length
        });
      }

      // If there are any bookings at all, add a description note instead of deleting
      if (bookingItems.length > 0) {
        await connection.query(
          "UPDATE transports SET description = CONCAT(COALESCE(description, ''), ' [INACTIVE]') WHERE id = ?", 
          [transportId]
        );
        
        await connection.commit();
        connection.release();
        return res.status(200).json({
          message: "Transport marked as inactive due to existing booking history"
        });
      }

      // Safe to delete if no bookings exist
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

// Get transport routes for the authenticated travel agent
exports.getAgencyRoutes = async (req, res) => {
  const agency_id = req.user.id;

  try {
    const [transports] = await db.query(`
      SELECT t.*, 
             to_orig.name as origin_name,
             d.name as destination_name,
             d.region as destination_region
      FROM transports t
      JOIN transport_origins to_orig ON t.origin_id = to_orig.id
      JOIN destinations d ON t.destination_id = d.id
      WHERE t.agency_id = ?
      ORDER BY t.id DESC
    `, [agency_id]);
    
    // Parse route_details JSON field if it exists
    const processedTransports = transports.map(transport => {
      if (transport.route_details && typeof transport.route_details === 'string') {
        try {
          transport.route_details = JSON.parse(transport.route_details);
        } catch (e) {
          console.warn('Failed to parse route_details for transport:', transport.id);
        }
      }
      return transport;
    });
    
    res.status(200).json(processedTransports);
  } catch (error) {
    console.error("Error fetching agency routes:", error);
    res.status(500).json({ 
      message: "Failed to fetch agency routes", 
      error: error.message 
    });
  }
};