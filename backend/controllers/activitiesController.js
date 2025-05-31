const db = require("../config/db");

// Get all activities
const getActivities = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, d.name as destination_name, d.region as destination_region
      FROM activities a
      LEFT JOIN destinations d ON a.destination_id = d.id
      ORDER BY a.name
    `);

    res.status(200).json({
      message: "Activities retrieved successfully",
      activities: rows
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get activity by ID
const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT a.*, d.name as destination_name, d.region as destination_region
      FROM activities a
      LEFT JOIN destinations d ON a.destination_id = d.id
      WHERE a.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Activity not found"
      });
    }

    res.status(200).json({
      message: "Activity retrieved successfully",
      activity: rows[0]
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Create new activity
const createActivity = async (req, res) => {
  try {
    const {
      name,
      description,
      destination_id,
      price
    } = req.body;

    // Validate required fields
    if (!name || !destination_id || !price) {
      return res.status(400).json({
        message: "Name, destination_id, and price are required fields"
      });
    }

    // Validate price
    if (isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({
        message: "Price must be a positive number"
      });
    }

    // Check if destination exists
    const [destinationRows] = await db.query(
      "SELECT id FROM destinations WHERE id = ?",
      [destination_id]
    );

    if (destinationRows.length === 0) {
      return res.status(400).json({
        message: "Destination not found"
      });
    }

    // Insert activity
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
      ]
    );

    // Fetch the created activity with destination info
    const [activityRows] = await db.query(`
      SELECT a.*, d.name as destination_name, d.region as destination_region
      FROM activities a
      LEFT JOIN destinations d ON a.destination_id = d.id
      WHERE a.id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: "Activity created successfully",
      activity: activityRows[0]
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update activity
const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if activity exists
    const [existingRows] = await db.query(
      "SELECT * FROM activities WHERE id = ?",
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        message: "Activity not found"
      });
    }

    const allowedFields = [
      "name",
      "description",
      "price"
    ];

    const updates = [];
    const values = [];

    // Build dynamic update query
    for (const field of allowedFields) {
      if (field in updateData) {
        if (field === 'price') {
          if (isNaN(updateData[field]) || Number(updateData[field]) <= 0) {
            return res.status(400).json({
              message: "Price must be a positive number"
            });
          }
        }
        updates.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: "No valid fields to update"
      });
    }

    values.push(id);

    // Update activity
    await db.query(
      `UPDATE activities SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    // Fetch updated activity with destination info
    const [updatedRows] = await db.query(`
      SELECT a.*, d.name as destination_name, d.region as destination_region
      FROM activities a
      LEFT JOIN destinations d ON a.destination_id = d.id
      WHERE a.id = ?
    `, [id]);

    res.status(200).json({
      message: "Activity updated successfully",
      activity: updatedRows[0]
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Delete activity
const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if activity exists
    const [existingRows] = await db.query(
      "SELECT * FROM activities WHERE id = ?",
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        message: "Activity not found"
      });
    }

    // Check if activity is used in any bookings
    const [bookingRows] = await db.query(
      `SELECT COUNT(*) as count 
       FROM booking_items 
       WHERE item_type = 'activity' AND id = ?`,
      [id]
    );

    if (bookingRows[0].count > 0) {
      return res.status(400).json({
        message: "Cannot delete activity that is part of existing bookings"
      });
    }

    // Delete activity
    await db.query("DELETE FROM activities WHERE id = ?", [id]);

    res.status(200).json({
      message: "Activity deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get activities by destination
const getActivitiesByDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;

    const [rows] = await db.query(`
      SELECT a.*, d.name as destination_name, d.region as destination_region
      FROM activities a
      LEFT JOIN destinations d ON a.destination_id = d.id
      WHERE a.destination_id = ?
      ORDER BY a.name
    `, [destinationId]);

    res.status(200).json({
      message: "Activities retrieved successfully",
      activities: rows
    });
  } catch (error) {
    console.error("Error fetching activities by destination:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivitiesByDestination
};