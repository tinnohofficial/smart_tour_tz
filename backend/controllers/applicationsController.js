const db = require("../config/db");

exports.getPendingApplications = async (req, res) => {
  try {
    // First, get all users with pending approval status
    const [users] = await db.query(
      `SELECT id, email, phone_number, role, status
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
              `SELECT tg.full_name, tg.license_document_url, tg.description, tg.activities, d.name as location
               FROM tour_guides tg
               JOIN destinations d ON tg.destination_id = d.id
               WHERE tg.user_id = ?`,
              [user.id],
            );

            if (guideDetails.length > 0) {
              profileDetails = guideDetails[0];
              // Parse activities JSON and fetch activity details if present
              if (profileDetails.activities) {
                try {
                  const activityIds = JSON.parse(profileDetails.activities);
                  if (Array.isArray(activityIds) && activityIds.length > 0) {
                    const placeholders = activityIds.map(() => "?").join(",");
                    const [activityDetails] = await db.query(
                      `SELECT id, name FROM activities WHERE id IN (${placeholders})`,
                      activityIds
                    );
                    profileDetails.activity_details = activityDetails;
                    profileDetails.activities = activityIds; // Keep the original array of IDs
                  } else {
                    profileDetails.activity_details = [];
                    profileDetails.activities = [];
                  }
                } catch (e) {
                  profileDetails.activities = [];
                  profileDetails.activity_details = [];
                }
              } else {
                profileDetails.activity_details = [];
              }
            }
            break;
          }

          case "hotel_manager": {
            // Get hotel manager specific details - the hotel id is the same as user id
            const [hotelDetails] = await db.query(
              `SELECT id, name, description, capacity, base_price_per_night, images
               FROM hotels
               WHERE id = ?`,
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
            // Get travel agent specific details - agency ID is the same as user ID
            const [agencyDetails] = await db.query(
              `SELECT id, name, document_url, contact_email, contact_phone
               FROM travel_agencies
               WHERE id = ?`,
              [user.id],
            );

            if (agencyDetails.length > 0) {
              profileDetails = agencyDetails[0];

              // Get related transport routes for this agency
              const [routesDetails] = await db.query(
                `SELECT t.id, to_orig.name as origin, d.name as destination, 
                        t.transportation_type, t.cost, t.description
                 FROM transports t
                 JOIN transport_origins to_orig ON t.origin_id = to_orig.id
                 JOIN destinations d ON t.destination_id = d.id
                 WHERE t.agency_id = ?`,
                [user.id], // Use user.id directly since agency id = user id
              );

              profileDetails.routes = routesDetails;
              
              // Try to parse document_url as JSON if it's stored that way
              if (profileDetails.document_url && profileDetails.document_url.startsWith('[')) {
                try {
                  profileDetails.document_url = JSON.parse(profileDetails.document_url);
                } catch (e) {
                  // Keep as is if parsing fails
                }
              }
            }
            break;
          }
        }

        // Return user with their profile details - map to 'details' for frontend compatibility
        return {
          ...user,
          user_id: user.id, // Add user_id field for frontend compatibility
          name: profileDetails.full_name || profileDetails.name || user.email.split('@')[0], // Try to get a display name
          details: profileDetails,
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
      "UPDATE users SET status = ? WHERE id = ? AND status = ?",
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
      // Tourist users already have balance initialized in users table
    }

    res.json({ message: `Application status updated to ${newStatus}.` });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: "Failed to update status." });
  }
};
