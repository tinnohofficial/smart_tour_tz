const db = require("../config/db");

exports.getPendingApplications = async (req, res) => {
  try {
    // First, get all users with pending approval status
    const [users] = await db.query(
      `SELECT id, email, phone_number, role, created_at, status
       FROM users
       WHERE status = 'pending_approval'`,
    );

    // If no pending applications, return early
    if (users.length === 0) {
      return res.json([]);
    }

    // Process each user to add their role-specific profile details
    const detailedApplications = await Promise.all(
      users.map(async (user) => {
        let profileDetails = {};

        switch (user.role) {
          case "tour_guide": {
            // Get tour guide specific details
            const [guideDetails] = await db.query(
              `SELECT full_name, license_document_url, location, expertise
               FROM tour_guides
               WHERE user_id = ?`,
              [user.id],
            );

            if (guideDetails.length > 0) {
              profileDetails = guideDetails[0];
            }
            break;
          }

          case "hotel_manager": {
            // Get hotel manager specific details
            const [hotelDetails] = await db.query(
              `SELECT id, name, location, description, capacity, rate_per_night, images
               FROM hotels
               WHERE manager_user_id = ?`,
              [user.id],
            );

            if (hotelDetails.length > 0) {
              // Parse images JSON if present
              if (hotelDetails[0].images) {
                try {
                  hotelDetails[0].images = JSON.parse(hotelDetails[0].images);
                } catch (e) {
                  hotelDetails[0].images = [];
                }
              }
              profileDetails = hotelDetails[0];
            }
            break;
          }

          case "travel_agent": {
            // Get travel agent specific details
            const [agencyDetails] = await db.query(
              `SELECT id, name, document_url, contact_email, contact_phone
               FROM travel_agencies
               WHERE agent_user_id = ?`,
              [user.id],
            );

            if (agencyDetails.length > 0) {
              profileDetails = agencyDetails[0];

              // Get related transport routes for this agency
              const [routesDetails] = await db.query(
                `SELECT id, origin, destination, transportation_type, cost, description
                 FROM transport_routes
                 WHERE agency_id = ?`,
                [agencyDetails[0].id],
              );

              profileDetails.routes = routesDetails;
            }
            break;
          }
        }

        // Return user with their profile details
        return {
          ...user,
          profileDetails,
        };
      }),
    );

    res.json(detailedApplications);
  } catch (error) {
    console.error("Error fetching pending applications:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch applications.", error: error.message });
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

exports.createDestination = async (req, res) => {
  try {
    const { name, description, region, image_url } = req.body;

    // Validate required fields
    if (!name || !region) {
      return res
        .status(400)
        .json({ message: "Name and location details are required." });
    }

    // Check if destination with the same name already exists
    const [existingDestinations] = await db.query(
      "SELECT id FROM destinations WHERE name = ?",
      [name],
    );

    if (existingDestinations.length > 0) {
      return res
        .status(409)
        .json({ message: "A destination with this name already exists." });
    }

    // Insert new destination
    const [result] = await db.query(
      `INSERT INTO destinations (name, description, region, image_url)
       VALUES (?, ?, ?, ?)`,
      [name, description || "", region, image_url || null],
    );

    res.status(201).json({
      message: "Destination created successfully.",
      destinationId: result.insertId,
      name,
    });
  } catch (error) {
    console.error("Error creating destination:", error);
    res
      .status(500)
      .json({ message: "Failed to create destination.", error: error.message });
  }
};

exports.updateDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;
    const { name, description, region, image_url } = req.body;

    // Validate at least one field to update
    if (!name && !description && !region && !image_url) {
      return res.status(400).json({ message: "No update data provided." });
    }

    // Check if destination exists
    const [existingDestinations] = await db.query(
      "SELECT id FROM destinations WHERE id = ?",
      [destinationId],
    );

    if (existingDestinations.length === 0) {
      return res.status(404).json({ message: "Destination not found." });
    }

    // If name is being updated, check for duplicates
    if (name) {
      const [nameCheck] = await db.query(
        "SELECT id FROM destinations WHERE name = ? AND id != ?",
        [name, destinationId],
      );

      if (nameCheck.length > 0) {
        return res
          .status(409)
          .json({ message: "A destination with this name already exists." });
      }
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (name) {
      updates.push("name = ?");
      values.push(name);
    }

    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description);
    }

    if (region) {
      updates.push("region = ?");
      values.push(region);
    }

    if (image_url !== undefined) {
      updates.push("image_url = ?");
      values.push(image_url);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    // Add destination ID to values array
    values.push(destinationId);

    // Execute update query
    const [result] = await db.query(
      `UPDATE destinations SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Destination not found or no changes applied." });
    }

    res.json({ message: "Destination updated successfully." });
  } catch (error) {
    console.error("Error updating destination:", error);
    res
      .status(500)
      .json({ message: "Failed to update destination.", error: error.message });
  }
};

exports.deleteDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;

    // Check if destination is associated with any activities
    const [activities] = await db.query(
      "SELECT COUNT(*) as count FROM activities WHERE destination_id = ?",
      [destinationId],
    );

    if (activities[0].count > 0) {
      return res.status(409).json({
        message:
          "Cannot delete destination with associated activities. Remove activities first or archive the destination instead.",
      });
    }

    // Delete the destination
    const [result] = await db.query("DELETE FROM destinations WHERE id = ?", [
      destinationId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Destination not found." });
    }

    res.json({ message: "Destination deleted successfully." });
  } catch (error) {
    console.error("Error deleting destination:", error);
    res
      .status(500)
      .json({ message: "Failed to delete destination.", error: error.message });
  }
};
