const db = require("../config/db");

exports.getDestinations = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, description, image_url FROM destinations",
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching destinations:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch destinations", error: error.message });
  }
};

exports.getDestinationById = async (req, res) => {
  const { destinationId } = req.params;

  try {
    // Get destination details
    const [destinationRows] = await db.query(
      "SELECT * FROM destinations WHERE id = ?",
      [destinationId],
    );

    if (destinationRows.length === 0) {
      return res.status(404).json({ message: "Destination not found" });
    }

    res.status(200).json(destinationRows[0]);
  } catch (error) {
    console.error("Error fetching destination details:", error);
    res.status(500).json({
      message: "Failed to fetch destination details",
      error: error.message,
    });
  }
};

exports.createDestination = async (req, res) => {
  try {
    const { name, description, image_url } = req.body;

    // Validate required fields
    if (!name) {
      return res
        .status(400)
        .json({ message: "Name is required." });
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
      `INSERT INTO destinations (name, description, image_url)
       VALUES (?, ?, ?)`,
      [name, description || "", image_url || null],
    );

    // Fetch the newly created destination to return
    const [newDestination] = await db.query(
      "SELECT * FROM destinations WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json({
      message: "Destination created successfully.",
      ...newDestination[0]
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
    const { name, description, image_url } = req.body;

    // Validate at least one field to update
    if (!name && description === undefined && image_url === undefined) {
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



    if (image_url !== undefined) {
      updates.push("image_url = ?");
      values.push(image_url);
    }

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
    
    // Fetch the updated destination to return
    const [updatedDestination] = await db.query(
      "SELECT * FROM destinations WHERE id = ?",
      [destinationId],
    );

    res.json({
      message: "Destination updated successfully.",
      ...updatedDestination[0]
    });
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
