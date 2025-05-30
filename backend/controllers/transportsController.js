const db = require("../config/db");

// Helper function to ensure transport origin exists or create it
async function ensureTransportOrigin(originName, connection = null) {
  const dbConnection = connection || db;
  
  // First try to find existing origin by name
  const [existingOrigins] = await dbConnection.query(
    "SELECT id FROM transport_origins WHERE name = ?",
    [originName]
  );
  
  if (existingOrigins.length > 0) {
    return existingOrigins[0].id;
  }
  
  // Create new origin if it doesn't exist
  const [result] = await dbConnection.query(
    "INSERT INTO transport_origins (name, country) VALUES (?, 'Tanzania')",
    [originName]
  );
  
  return result.insertId;
}

// Helper function to clean up unused transport origins
async function cleanupUnusedOrigins(connection = null) {
  const dbConnection = connection || db;
  
  // Delete origins that are not referenced by any transport routes
  await dbConnection.query(`
    DELETE FROM transport_origins 
    WHERE id NOT IN (
      SELECT DISTINCT origin_id FROM transports
    )
  `);
}

// Get all available transport origins (moved from transportOriginsController)
exports.getAllOrigins = async (req, res) => {
  try {
    const [origins] = await db.query(`
      SELECT DISTINCT to_orig.id, to_orig.name, to_orig.description, to_orig.country 
      FROM transport_origins to_orig
      INNER JOIN transports t ON to_orig.id = t.origin_id
      ORDER BY to_orig.name ASC
    `);
    res.status(200).json(origins);
  } catch (error) {
    console.error("Error fetching transport origins:", error);
    res.status(500).json({ 
      message: "Failed to fetch transport origins", 
      error: error.message 
    });
  }
};

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
    origin_name,
    destination_id,
    transportation_type,
    cost,
    description,
    route_details
  } = req.body;

  // Use the authenticated user's ID as the agency_id
  const agency_id = req.user.id;

  // Validate required fields
  if (!origin_name || !destination_id || !cost) {
    return res.status(400).json({
      message:
        "Required fields missing: origin_name, destination_id, and cost are required",
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
  
  // Validate origin name
  if (!origin_name.trim()) {
    return res.status(400).json({
      message: "Origin name cannot be empty"
    });
  }

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Verify the user is an active travel agent with a profile
      const [agencyRows] = await connection.query(
        "SELECT ta.id FROM travel_agencies ta JOIN users u ON ta.id = u.id WHERE ta.id = ? AND u.status = 'active' AND u.role = 'travel_agent'",
        [agency_id],
      );

      if (agencyRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: "Travel agency profile not found or not active" });
      }
      
      // Verify the destination exists
      const [destinationRows] = await connection.query(
        "SELECT id, name FROM destinations WHERE id = ?",
        [destination_id]
      );
      
      if (destinationRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ message: "Invalid destination ID" });
      }

      // Ensure origin exists or create it implicitly
      const origin_id = await ensureTransportOrigin(origin_name.trim(), connection);

      // Validate that origin and destination are different
      if (origin_id === destination_id) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          message: "Origin and destination must be different"
        });
      }

      // Create the transport
      const [result] = await connection.query(
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
      const [newTransport] = await connection.query(
        `SELECT t.*, 
                to_origin.name as origin_name, 
                d.name as destination_name 
         FROM transports t
         JOIN transport_origins to_origin ON t.origin_id = to_origin.id
         JOIN destinations d ON t.destination_id = d.id
         WHERE t.id = ?`,
        [result.insertId]
      );

      await connection.commit();
      connection.release();

      res.status(201).json({
        message: "Transport route created successfully",
        ...newTransport[0]
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
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
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // First check if the transport exists and belongs to this agency
      const [transportRows] = await connection.query(
        "SELECT * FROM transports WHERE id = ? AND agency_id = ?",
        [transportId, userId]
      );

      if (transportRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          message: "Transport not found or you don't have permission to update it",
        });
      }

      const currentTransport = transportRows[0];

      // Build update query dynamically based on provided fields
      const allowedFields = [
        "origin_name",
        "destination_id", 
        "transportation_type",
        "cost",
        "description",
        "route_details"
      ];

      const updates = [];
      const values = [];
      let newOriginId = currentTransport.origin_id;

      // Handle origin_name change implicitly
      if (updateData.origin_name && updateData.origin_name.trim()) {
        newOriginId = await ensureTransportOrigin(updateData.origin_name.trim(), connection);
        updates.push("origin_id = ?");
        values.push(newOriginId);
      }

      allowedFields.forEach((field) => {
        if (field in updateData && field !== "origin_name") {
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
        await connection.rollback();
        connection.release();
        return res.status(400).json({ message: "No valid fields to update" });
      }

      // Validate destination_id if provided
      if (updateData.destination_id) {
        const [destinationRows] = await connection.query(
          "SELECT id FROM destinations WHERE id = ?",
          [updateData.destination_id]
        );
        if (destinationRows.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ message: "Invalid destination ID" });
        }

        // Validate that origin and destination are different
        if (newOriginId === updateData.destination_id) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            message: "Origin and destination must be different"
          });
        }
      }

      // Add transportId as the last value
      values.push(transportId);

      // Execute update query
      await connection.query(
        `UPDATE transports SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      // Clean up unused origins after the update
      await cleanupUnusedOrigins(connection);

      // Fetch the updated transport to return complete data
      const [updatedTransport] = await connection.query(
        `SELECT t.*, 
                to_origin.name as origin_name, 
                d.name as destination_name 
         FROM transports t
         JOIN transport_origins to_origin ON t.origin_id = to_origin.id
         JOIN destinations d ON t.destination_id = d.id
         WHERE t.id = ?`,
        [transportId]
      );

      await connection.commit();
      connection.release();

      res.status(200).json({ 
        message: "Transport updated successfully",
        ...updatedTransport[0]
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
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

      // Clean up unused origins after deletion
      await cleanupUnusedOrigins(connection);

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