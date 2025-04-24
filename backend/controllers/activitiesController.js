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
    price,
    date,
    group_size,
    status = 'available'
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

  // Validate group size if provided
  if (group_size !== undefined && (isNaN(group_size) || group_size <= 0)) {
    return res.status(400).json({
      message: "Group size must be a positive number"
    });
  }

  // Validate activity date if provided
  let activityDate = null;
  if (date) {
    activityDate = new Date(date);
    if (isNaN(activityDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date format"
      });
    }
    
    // Ensure date is in the future
    const today = new Date();
    if (activityDate < today) {
      return res.status(400).json({
        message: "Activity date must be in the future"
      });
    }
  }

  try {
    // Verify the destination exists and is active
    const [destinationRows] = await db.query(
      "SELECT id, status FROM destinations WHERE id = ?",
      [destination_id],
    );

    if (destinationRows.length === 0) {
      return res.status(404).json({ message: "Destination not found" });
    }
    
    // Check if destination is active
    if (destinationRows[0].status !== 'active') {
      return res.status(400).json({ 
        message: "Cannot create activities for inactive destinations",
        destination_status: destinationRows[0].status
      });
    }

    // Create the activity with additional fields
    const [result] = await db.query(
      `INSERT INTO activities (
        name,
        description,
        destination_id,
        price,
        date,
        group_size,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        destination_id,
        price,
        date ? activityDate : null,
        group_size || null,
        status
      ],
    );

    res.status(201).json({
      message: "Activity created successfully",
      id: result.insertId,
      name,
      destination_id,
      status
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
         WHERE bi.item_type = 'activity' AND bi.item_id = ?`,
        [activityId]
      );

      // If activity is in active bookings, don't allow deletion
      const activeBookings = bookingItems.filter(
        item => item.status !== 'canceled' && item.status !== 'completed'
      );

      if (activeBookings.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          message: "Cannot delete activity that is part of active bookings",
          activeBookingsCount: activeBookings.length
        });
      }

      // If activity is only in canceled/completed bookings, allow deletion
      // For future record-keeping, we could mark as inactive instead of deleting
      if (bookingItems.length > 0) {
        // Instead of deleting, mark as inactive
        await connection.query(
          "UPDATE activities SET status = 'inactive' WHERE id = ?", 
          [activityId]
        );
      } else {
        // If not part of any bookings, we can safely delete
        await connection.query(
          "DELETE FROM activities WHERE id = ?", 
          [activityId]
        );
      }

      await connection.commit();
      connection.release();
      res.status(200).json({ 
        message: bookingItems.length > 0 
          ? "Activity marked as inactive" 
          : "Activity deleted successfully" 
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
