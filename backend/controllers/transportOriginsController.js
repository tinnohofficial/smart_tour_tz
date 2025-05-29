const db = require("../config/db");

// Get all available transport origins
exports.getAllOrigins = async (req, res) => {
  try {
    const [origins] = await db.query(`
      SELECT id, name, description, country 
      FROM transport_origins 
      ORDER BY name ASC
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

// Get origin by ID
exports.getOriginById = async (req, res) => {
  const { originId } = req.params;

  try {
    const [origins] = await db.query(
      "SELECT id, name, description, country FROM transport_origins WHERE id = ?",
      [originId]
    );

    if (origins.length === 0) {
      return res.status(404).json({ message: "Transport origin not found" });
    }

    res.status(200).json(origins[0]);
  } catch (error) {
    console.error("Error fetching transport origin:", error);
    res.status(500).json({ 
      message: "Failed to fetch transport origin", 
      error: error.message 
    });
  }
};

// Admin only: Create new transport origin
exports.createOrigin = async (req, res) => {
  const { name, description, country = 'Tanzania' } = req.body;

  // Validate required fields
  if (!name) {
    return res.status(400).json({
      message: "Origin name is required"
    });
  }

  try {
    // Check if origin already exists
    const [existing] = await db.query(
      "SELECT id FROM transport_origins WHERE name = ?",
      [name]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Transport origin with this name already exists"
      });
    }

    // Create the origin
    const [result] = await db.query(
      `INSERT INTO transport_origins (name, description, country) 
       VALUES (?, ?, ?)`,
      [name, description, country]
    );

    // Fetch the newly created origin to return complete data
    const [newOrigin] = await db.query(
      "SELECT * FROM transport_origins WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      message: "Transport origin created successfully",
      ...newOrigin[0]
    });
  } catch (error) {
    console.error("Error creating transport origin:", error);
    res.status(500).json({
      message: "Failed to create transport origin",
      error: error.message,
    });
  }
};

// Admin only: Update transport origin
exports.updateOrigin = async (req, res) => {
  const { originId } = req.params;
  const { name, description, country } = req.body;

  try {
    // Check if origin exists
    const [existing] = await db.query(
      "SELECT id FROM transport_origins WHERE id = ?",
      [originId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Transport origin not found" });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push("description = ?");
      updateValues.push(description);
    }
    if (country !== undefined) {
      updateFields.push("country = ?");
      updateValues.push(country);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    updateValues.push(originId);

    await db.query(
      `UPDATE transport_origins SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    // Fetch the updated origin to return complete data
    const [updatedOrigin] = await db.query(
      "SELECT * FROM transport_origins WHERE id = ?",
      [originId]
    );

    res.status(200).json({ 
      message: "Transport origin updated successfully",
      ...updatedOrigin[0]
    });
  } catch (error) {
    console.error("Error updating transport origin:", error);
    res.status(500).json({
      message: "Failed to update transport origin",
      error: error.message,
    });
  }
};

// Admin only: Delete transport origin
exports.deleteOrigin = async (req, res) => {
  const { originId } = req.params;

  try {
    // Check if origin exists
    const [existing] = await db.query(
      "SELECT id FROM transport_origins WHERE id = ?",
      [originId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Transport origin not found" });
    }

    // Check if origin is being used by any transport routes
    const [routes] = await db.query(
      "SELECT COUNT(*) as count FROM transports WHERE origin_id = ?",
      [originId]
    );

    if (routes[0].count > 0) {
      return res.status(409).json({
        message: "Cannot delete origin: it is being used by existing transport routes",
        routeCount: routes[0].count
      });
    }

    await db.query("DELETE FROM transport_origins WHERE id = ?", [originId]);

    res.status(200).json({ message: "Transport origin deleted successfully" });
  } catch (error) {
    console.error("Error deleting transport origin:", error);
    res.status(500).json({
      message: "Failed to delete transport origin",
      error: error.message,
    });
  }
};
