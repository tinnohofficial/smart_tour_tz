const db = require("../config/db");

/**
 * Submit or update travel agent profile
 * Requirement: F2.3
 */
exports.submitTravelAgentProfile = async (req, res) => {
  const { name, legal_document_urls, routes } = req.body;
  const userId = req.user.id;
  
  try {
    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Check if agency already exists for this user
      const [existingAgencies] = await connection.query(
        "SELECT id FROM travel_agencies WHERE agent_user_id = ?",
        [userId]
      );
      
      let agencyId;
      
      if (existingAgencies.length > 0) {
        // Update existing agency
        agencyId = existingAgencies[0].id;
        await connection.query(
          `UPDATE travel_agencies 
           SET name = ?, legal_document_urls = ? 
           WHERE agent_user_id = ?`,
          [name, JSON.stringify(legal_document_urls), userId]
        );
      } else {
        // Insert new agency
        const [result] = await connection.query(
          `INSERT INTO travel_agencies (agent_user_id, name, legal_document_urls)
           VALUES (?, ?, ?)`,
          [userId, name, JSON.stringify(legal_document_urls)]
        );
        agencyId = result.insertId;
      }
      
      // If routes are provided, process them
      if (routes && Array.isArray(routes) && routes.length > 0) {
        // Delete existing routes (optional, depends on your business logic)
        // await connection.query("DELETE FROM transport_routes WHERE agency_id = ?", [agencyId]);
        
        // Insert new routes
        for (const route of routes) {
          await connection.query(
            `INSERT INTO transport_routes 
             (agency_id, origin, destination, transport_type, price, schedule_details)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              agencyId,
              route.origin,
              route.destination,
              route.transport_type,
              route.price,
              JSON.stringify(route.schedule_details || {})
            ]
          );
        }
      }
      
      // Update user status to pending_approval if initial submission
      const [userResult] = await connection.query(
        "SELECT status FROM users WHERE id = ?",
        [userId]
      );
      
      if (userResult[0].status === 'pending_profile') {
        await connection.query(
          "UPDATE users SET status = 'pending_approval' WHERE id = ?",
          [userId]
        );
      }
      
      await connection.commit();
      res.status(200).json({ message: "Travel agent profile submitted successfully" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error in travel agent profile submission:", error);
    res.status(500).json({ message: "Failed to submit travel agent profile", error: error.message });
  }
};

/**
 * Get travel agency details for agents
 */
exports.getAgencyDetails = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [rows] = await db.query(
      "SELECT * FROM travel_agencies WHERE agent_user_id = ?",
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Travel agency not found" });
    }
    
    const agency = rows[0];
    
    // Parse JSON fields
    if (agency.legal_document_urls) {
      try {
        agency.legal_document_urls = JSON.parse(agency.legal_document_urls);
      } catch (e) {
        // Keep as is if parsing fails
      }
    }
    
    // Get routes for this agency
    const [routes] = await db.query(
      "SELECT * FROM transport_routes WHERE agency_id = ?",
      [agency.id]
    );
    
    // Parse schedule_details for each route
    routes.forEach(route => {
      if (route.schedule_details) {
        try {
          route.schedule_details = JSON.parse(route.schedule_details);
        } catch (e) {
          // Keep as is if parsing fails
        }
      }
    });
    
    agency.routes = routes;
    
    res.status(200).json(agency);
  } catch (error) {
    console.error("Error fetching agency details:", error);
    res.status(500).json({ message: "Failed to fetch agency details", error: error.message });
  }
};

/**
 * Add a new transport route
 */
exports.addTransportRoute = async (req, res) => {
  const { origin, destination, transport_type, price, schedule_details } = req.body;
  const userId = req.user.id;
  
  try {
    // Get agency ID for this user
    const [agencyRows] = await db.query(
      "SELECT id FROM travel_agencies WHERE agent_user_id = ?",
      [userId]
    );
    
    if (agencyRows.length === 0) {
      return res.status(404).json({ message: "Travel agency not found for this user" });
    }
    
    const agencyId = agencyRows[0].id;
    
    // Create the new transport route
    await db.query(
      `INSERT INTO transport_routes 
       (agency_id, origin, destination, transport_type, price, schedule_details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        agencyId,
        origin,
        destination,
        transport_type,
        price,
        JSON.stringify(schedule_details || {})
      ]
    );
    
    res.status(201).json({ message: "Transport route added successfully" });
  } catch (error) {
    console.error("Error adding transport route:", error);
    res.status(500).json({ message: "Failed to add transport route", error: error.message });
  }
};

/**
 * Update an existing transport route
 */
exports.updateTransportRoute = async (req, res) => {
  const { routeId } = req.params;
  const { origin, destination, transport_type, price, schedule_details } = req.body;
  const userId = req.user.id;
  
  try {
    // Get agency ID for this user
    const [agencyRows] = await db.query(
      "SELECT id FROM travel_agencies WHERE agent_user_id = ?",
      [userId]
    );
    
    if (agencyRows.length === 0) {
      return res.status(404).json({ message: "Travel agency not found for this user" });
    }
    
    const agencyId = agencyRows[0].id;
    
    // Check if route exists and belongs to this agency
    const [routeRows] = await db.query(
      "SELECT id FROM transport_routes WHERE id = ? AND agency_id = ?",
      [routeId, agencyId]
    );
    
    if (routeRows.length === 0) {
      return res.status(404).json({ message: "Route not found or not owned by your agency" });
    }
    
    // Update the route
    await db.query(
      `UPDATE transport_routes 
       SET origin = ?, 
           destination = ?, 
           transport_type = ?, 
           price = ?, 
           schedule_details = ? 
       WHERE id = ?`,
      [
        origin,
        destination,
        transport_type,
        price,
        JSON.stringify(schedule_details || {}),
        routeId
      ]
    );
    
    res.status(200).json({ message: "Transport route updated successfully" });
  } catch (error) {
    console.error("Error updating transport route:", error);
    res.status(500).json({ message: "Failed to update transport route", error: error.message });
  }
};

/**
 * Get transport routes based on origin/destination (F6.3)
 */
exports.getTransportRoutes = async (req, res) => {
  const { destination, origin } = req.query;
  
  try {
    let query = `
      SELECT tr.*, ta.name as agency_name 
      FROM transport_routes tr
      JOIN travel_agencies ta ON tr.agency_id = ta.id
      JOIN users u ON ta.agent_user_id = u.id
      WHERE u.status = 'active'
    `;
    const params = [];
    
    if (destination) {
      query += " AND tr.destination LIKE ?";
      params.push(`%${destination}%`);
    }
    
    if (origin) {
      query += " AND tr.origin LIKE ?";
      params.push(`%${origin}%`);
    }
    
    const [routes] = await db.query(query, params);
    
    // Parse schedule_details for each route
    routes.forEach(route => {
      if (route.schedule_details) {
        try {
          route.schedule_details = JSON.parse(route.schedule_details);
        } catch (e) {
          // Keep as is if parsing fails
        }
      }
    });
    
    res.status(200).json(routes);
  } catch (error) {
    console.error("Error fetching transport routes:", error);
    res.status(500).json({ message: "Failed to fetch transport routes", error: error.message });
  }
};

/**
 * Get bookings for travel agent that need action (F6.8)
 */
exports.getBookingsNeedingAction = async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Get agency ID for this user
    const [agencyRows] = await db.query(
      "SELECT id FROM travel_agencies WHERE agent_user_id = ?",
      [userId]
    );
    
    if (agencyRows.length === 0) {
      return res.status(404).json({ message: "Travel agency not found for this user" });
    }
    
    const agencyId = agencyRows[0].id;
    
    // Get bookings that need action
    const [bookingItems] = await db.query(
      `SELECT bi.*, tr.origin, tr.destination, tr.transport_type, 
              b.created_at, b.tourist_user_id, u.email as tourist_email
       FROM booking_items bi
       JOIN transport_routes tr ON bi.item_id = tr.id AND bi.item_type = 'transport'
       JOIN bookings b ON bi.booking_id = b.id
       JOIN users u ON b.tourist_user_id = u.id
       WHERE tr.agency_id = ?
       AND bi.provider_status = 'pending'
       AND b.status = 'confirmed'
       ORDER BY b.created_at DESC`,
      [agencyId]
    );
    
    res.status(200).json(bookingItems);
  } catch (error) {
    console.error("Error fetching bookings needing action:", error);
    res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
  }
};

/**
 * Assign ticket for a booking (F6.9)
 */
exports.assignTicket = async (req, res) => {
  const { itemId } = req.params;
  const { ticketDetails } = req.body;
  const userId = req.user.id;
  
  try {
    // Get agency ID for this user
    const [agencyRows] = await db.query(
      "SELECT id FROM travel_agencies WHERE agent_user_id = ?",
      [userId]
    );
    
    if (agencyRows.length === 0) {
      return res.status(404).json({ message: "Travel agency not found for this user" });
    }
    
    const agencyId = agencyRows[0].id;
    
    // Check if the booking item belongs to a route owned by this agency
    const [bookingItemRows] = await db.query(
      `SELECT bi.* 
       FROM booking_items bi
       JOIN transport_routes tr ON bi.item_id = tr.id
       WHERE bi.id = ?
       AND bi.item_type = 'transport'
       AND tr.agency_id = ?
       AND bi.provider_status = 'pending'`,
      [itemId, agencyId]
    );
    
    if (bookingItemRows.length === 0) {
      return res.status(404).json({ 
        message: "Booking item not found or not associated with your agency or already processed" 
      });
    }
    
    // Update the booking item with ticket details
    await db.query(
      `UPDATE booking_items 
       SET provider_status = 'confirmed', 
           item_details = ? 
       WHERE id = ?`,
      [JSON.stringify(ticketDetails), itemId]
    );
    
    res.status(200).json({ message: "Ticket assigned successfully" });
  } catch (error) {
    console.error("Error assigning ticket:", error);
    res.status(500).json({ message: "Failed to assign ticket", error: error.message });
  }
};