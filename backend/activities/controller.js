const db = require("../config/db");

/**
 * Get activities for a destination (F6.6)
 */
exports.getActivities = async (req, res) => {
  const { destinationId } = req.query;

  try {
    if (!destinationId) {
      return res.status(400).json({ message: "Destination ID is required" });
    }

    const [activities] = await db.query(
      "SELECT * FROM activities WHERE destination_id = ?",
      [destinationId],
    );

    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch activities", error: error.message });
  }
};

/**
 * Get detailed info for a specific activity
 */
exports.getActivityById = async (req, res) => {
  const { activityId } = req.params;

  try {
    const [activityRows] = await db.query(
      "SELECT * FROM activities WHERE id = ?",
      [activityId],
    );

    if (activityRows.length === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }

    res.status(200).json(activityRows[0]);
  } catch (error) {
    console.error("Error fetching activity details:", error);
    res.status(500).json({
      message: "Failed to fetch activity details",
      error: error.message,
    });
  }
};

/**
 * Create a new activity (F6.9)
 * Tour guides can create activities for destinations
 */
exports.createActivity = async (req, res) => {
  const tourGuideId = req.user.id;
  const {
    name,
    description,
    destination_id,
    price,
    duration_minutes,
    max_participants,
    start_time,
  } = req.body;

  // Validate required fields
  if (!name || !description || !destination_id || !price || !duration_minutes) {
    return res.status(400).json({
      message:
        "Required fields missing: name, description, destination_id, price, and duration_minutes are required",
    });
  }

  try {
    // Verify the destination exists
    const [destinationRows] = await db.query(
      "SELECT id FROM destinations WHERE id = ?",
      [destination_id],
    );

    if (destinationRows.length === 0) {
      return res.status(404).json({ message: "Destination not found" });
    }

    // Check if the user is a tour guide with active status
    const [guideRows] = await db.query(
      `SELECT user_id FROM tour_guides
       JOIN users ON tour_guides.user_id = users.id
       WHERE user_id = ? AND users.role = 'tour_guide' AND users.status = 'active'`,
      [tourGuideId],
    );

    if (guideRows.length === 0) {
      return res.status(403).json({
        message: "Only active tour guides can create activities",
      });
    }

    // Create the activity
    const [result] = await db.query(
      `INSERT INTO activities (
        name,
        description,
        destination_id,
        tour_guide_id,
        price,
        duration_minutes,
        max_participants,
        start_time,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [
        name,
        description,
        destination_id,
        tourGuideId,
        price,
        duration_minutes,
        max_participants || null,
        start_time || null,
      ],
    );

    res.status(201).json({
      message: "Activity created successfully",
      id: result.insertId,
      name,
      destination_id,
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json({
      message: "Failed to create activity",
      error: error.message,
    });
  }
};

/**
 * Update an existing activity (F6.9)
 * Tour guides can update activities they created
 */
exports.updateActivity = async (req, res) => {
  const tourGuideId = req.user.id;
  const { activityId } = req.params;
  const updateData = req.body;

  try {
    // First check if the activity exists and belongs to this tour guide
    const [activityRows] = await db.query(
      "SELECT * FROM activities WHERE id = ? AND tour_guide_id = ?",
      [activityId, tourGuideId],
    );

    if (activityRows.length === 0) {
      return res.status(404).json({
        message: "Activity not found or you don't have permission to edit it",
      });
    }

    // Build update query dynamically based on provided fields
    const allowedFields = [
      "name",
      "description",
      "price",
      "duration_minutes",
      "max_participants",
      "start_time",
      "status",
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

    // Add updated_at timestamp
    updates.push("updated_at = NOW()");

    // Add activityId as the last value
    values.push(activityId);

    // Execute update query
    await db.query(
      `UPDATE activities SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    res.status(200).json({ message: "Activity updated successfully" });
  } catch (error) {
    console.error("Error updating activity:", error);
    res.status(500).json({
      message: "Failed to update activity",
      error: error.message,
    });
  }
};

/**
 * Delete an activity (F6.9)
 * Tour guides can delete activities they created
 */
exports.deleteActivity = async (req, res) => {
  const tourGuideId = req.user.id;
  const { activityId } = req.params;

  try {
    // First check if the activity exists and belongs to this tour guide
    const [activityRows] = await db.query(
      "SELECT * FROM activities WHERE id = ? AND tour_guide_id = ?",
      [activityId, tourGuideId],
    );

    if (activityRows.length === 0) {
      return res.status(404).json({
        message: "Activity not found or you don't have permission to delete it",
      });
    }

    // Check if the activity is used in any bookings
    const [bookingsRows] = await db.query(
      `SELECT id FROM booking_items
       WHERE item_type = 'activity' AND item_id = ?`,
      [activityId],
    );

    if (bookingsRows.length > 0) {
      // Don't physically delete, just mark as inactive
      await db.query(
        "UPDATE activities SET status = 'inactive', updated_at = NOW() WHERE id = ?",
        [activityId],
      );

      res.status(200).json({
        message: "Activity marked as inactive because it has bookings",
      });
    } else {
      // No bookings, safe to delete
      await db.query("DELETE FROM activities WHERE id = ?", [activityId]);

      res.status(200).json({ message: "Activity deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({
      message: "Failed to delete activity",
      error: error.message,
    });
  }
};

/**
 * Get activities created by the authenticated tour guide (F6.9)
 */
exports.getTourGuideActivities = async (req, res) => {
  const tourGuideId = req.user.id;

  try {
    const [activities] = await db.query(
      `SELECT a.*, d.name AS destination_name
       FROM activities a
       JOIN destinations d ON a.destination_id = d.id
       WHERE a.tour_guide_id = ?
       ORDER BY a.created_at DESC`,
      [tourGuideId],
    );

    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching tour guide activities:", error);
    res.status(500).json({
      message: "Failed to fetch activities",
      error: error.message,
    });
  }
};
