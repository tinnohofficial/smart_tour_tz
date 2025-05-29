const db = require("../config/db");

exports.submitTravelAgentProfile = async (req, res) => {
  const { name, document_url, routes, contact_email, contact_phone } = req.body;
  const userId = req.user.id;

  console.log("Travel agent profile submission:", {
    userId,
    body: req.body,
    userRole: req.user.role,
    userStatus: req.user.status
  });

  // Validate required fields
  if (!name || !contact_email || !contact_phone) {
    return res.status(400).json({
      message: "Required fields missing: name, contact_email, and contact_phone are required"
    });
  }

  try {
    // Check if user exists and get their current status
    const [userRows] = await db.query(
      "SELECT id, role, status FROM users WHERE id = ? AND role = 'travel_agent'",
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ 
        message: "Travel agent user not found. Please check your account." 
      });
    }

    // Check if travel agency already exists
    const [existingAgency] = await db.query(
      "SELECT id FROM travel_agencies WHERE id = ?",
      [userId]
    );

    if (existingAgency.length > 0) {
      return res.status(400).json({ 
        message: "Travel agency profile already exists. Use update instead." 
      });
    }
    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert new agency using user's ID as the agency ID
      await connection.query(
        `INSERT INTO travel_agencies (id, name, document_url, contact_email, contact_phone)
           VALUES (?, ?, ?, ?, ?)`,
        [userId, name, document_url, contact_email, contact_phone],
      );
      
      // If routes are provided, process them
      if (routes && Array.isArray(routes) && routes.length > 0) {
        // Validate routes data
        for (const route of routes) {
          if (!route.origin_id || !route.destination_id || !route.transportation_type || !route.cost) {
            throw new Error("Each route must have origin_id, destination_id, transportation_type, and cost");
          }
          
          if (isNaN(parseInt(route.origin_id)) || isNaN(parseInt(route.destination_id))) {
            throw new Error("origin_id and destination_id must be valid numbers");
          }
          
          if (isNaN(parseFloat(route.cost)) || parseFloat(route.cost) <= 0) {
            throw new Error("Route cost must be a positive number");
          }
        }

        // Insert new routes
        for (const route of routes) {
          await connection.query(
            `INSERT INTO transports
             (agency_id, origin_id, destination_id, transportation_type, cost, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              userId, // Now using the user's ID directly as agency_id
              parseInt(route.origin_id),
              parseInt(route.destination_id),
              route.transportation_type, // Client sends transportation_type
              parseFloat(route.cost), // Client sends cost
              route.description || `Transport from origin ${route.origin_id} to destination ${route.destination_id} by ${route.transportation_type}`,
            ],
          );
        }
      }

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
        .json({ message: "Travel agent profile submitted successfully" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error in travel agent profile submission:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Failed to submit travel agent profile",
      error: error.message,
    });
  }
};

/**
 * Get travel agency details for agents
 */
exports.getAgencyDetails = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      "SELECT * FROM travel_agencies WHERE id = ?",
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Travel agency not found" });
    }

    const agency = rows[0];

    // Get routes for this agency
    const [routes] = await db.query(
      "SELECT * FROM transports WHERE agency_id = ?",
      [userId],
    );

    // Parse schedule_details for each route
    routes.forEach((route) => {
      if (route.description) {
        try {
          // Try to parse if it's stored as JSON
          route.description = JSON.parse(route.description);
        } catch (e) {
          // Keep as is if parsing fails - it's likely plain text
        }
      }
    });

    agency.routes = routes;

    // Get user data as well
    const [userRows] = await db.query(
      "SELECT email, phone_number, status FROM users WHERE id = ?",
      [userId],
    );

    const responseData = {
      ...agency,
      email: userRows[0].email,
      phone_number: userRows[0].phone_number,
      status: userRows[0].status,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching agency details:", error);
    res.status(500).json({
      message: "Failed to fetch agency details",
      error: error.message,
    });
  }
};

/**
 * Update travel agent profile
 */
exports.updateTravelAgentProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, document_url, contact_email, contact_phone } = req.body;

  try {
    // Check if agency exists
    const [agencyRows] = await db.query(
      "SELECT id FROM travel_agencies WHERE id = ?",
      [userId],
    );

    if (agencyRows.length === 0) {
      return res.status(404).json({ message: "Travel agency not found" });
    }

    // Update the fields that are provided
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
    }

    if (document_url !== undefined) {
      updates.push("document_url = ?");
      params.push(document_url);
    }

    if (contact_email !== undefined) {
      updates.push("contact_email = ?");
      params.push(contact_email);
    }

    if (contact_phone !== undefined) {
      updates.push("contact_phone = ?");
      params.push(contact_phone);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    // Add user_id to params for WHERE clause
    params.push(userId);

    await db.query(
      `UPDATE travel_agencies SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );

    res
      .status(200)
      .json({ message: "Travel agency profile updated successfully" });
  } catch (error) {
    console.error("Error updating travel agency profile:", error);
    res
      .status(500)
      .json({ message: "Failed to update profile", error: error.message });
  }
};
