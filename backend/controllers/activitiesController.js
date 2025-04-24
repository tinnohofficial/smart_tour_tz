const db = require("../config/db");

exports.getActivities = async (req, res) => {
  const { destinationId } = req.query;

  try {
    let query = "SELECT * FROM activities";
    let params = [];

    if (destinationId) {
      query += " WHERE destination_id = ?";
      params.push(destinationId);
    }

    const [activities] = await db.query(query, params);
    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch activities", error: error.message });
  }
};

exports.getActivityById = async (req, res) => {
  const { activityId } = req.params;

  try {
    const [activities] = await db.query(
      "SELECT * FROM activities WHERE id = ?",
      [activityId]
    );

    if (activities.length === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }

    res.status(200).json(activities[0]);
  } catch (error) {
    console.error("Error fetching activity:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch activity", error: error.message });
  }
};

exports.createActivity = async (req, res) => {
  const {
    name,
    description,
    destination_id,
    price
  } = req.body;

  // Validate required fields
  if (!name || !description || !destination_id || !price) {
    return res.status(400).json({
      message:
        "Required fields missing: name, description, destination_id, price are required",
    });
  }

  // Validate price is positive
  if (price <= 0) {
    return res.status(400).json({
      message: "Price must be greater than zero"
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

    // Create the activity with additional fields
    const [result] = await db.query(
      `INSERT INTO activities (
        name,
        description,
        destination_id,
        price
      ) VALUES (?, ?, ?, ?)`,
      [
        name,
        description,
        destination_id,
        price
      ],
    );

    res.status(201).json({
      message: "Activity created successfully",
      id: result.insertId,
      name,
      destination_id
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json({
      message: "Failed to create activity",
      error: error.message,
    });
  }
};

exports.updateActivity = async (req, res) => {
  const { activityId } = req.params;
  const updateData = req.body;

  try {
    // First check if the activity exists
    const [activityRows] = await db.query(
      "SELECT * FROM activities WHERE id = ?",
      [activityId]
    );

    if (activityRows.length === 0) {
      return res.status(404).json({
        message: "Activity not found",
      });
    }

    // Build update query dynamically based on provided fields
    const allowedFields = [
      "name",
      "description",
      "destination_id",
      "price",
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

exports.deleteActivity = async (req, res) => {
  const { activityId } = req.params;

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // First check if the activity exists
      const [activityRows] = await connection.query(
        "SELECT * FROM activities WHERE id = ?",
        [activityId],
      );

      if (activityRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          message: "Activity not found"
        });
      }

      // Check if this activity is part of any bookings
      const [bookingItems] = await connection.query(
        `SELECT bi.id, b.status 
         FROM booking_items bi 
         JOIN bookings b ON bi.booking_id = b.id
         WHERE bi.item_type = 'activity' AND bi.id = ?`,
        [activityId]
      );

      // If activity is in active bookings, don't allow deletion
      const activeBookings = bookingItems.filter(
        item => item.status !== 'cancelled' && item.status !== 'completed'
      );

      if (activeBookings.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          message: "Cannot delete activity that is part of active bookings",
          activeBookingsCount: activeBookings.length
        });
      }

      // Delete the activity since we don't have status field anymore
      await connection.query(
        "DELETE FROM activities WHERE id = ?", 
        [activityId]
      );

      await connection.commit();
      connection.release();
      res.status(200).json({ 
        message: "Activity deleted successfully" 
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({
      message: "Failed to delete activity",
      error: error.message,
    });
  }
};
