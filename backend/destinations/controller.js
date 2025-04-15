const db = require("../config/db");

/**
 * Get list of tourist locations (F6.1)
 */
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

/**
 * Get detailed info for a specific destination (F6.2)
 */
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

    const destination = destinationRows[0];

    // Get activities for this destination
    const [activitiesRows] = await db.query(
      "SELECT * FROM activities WHERE destination_id = ?",
      [destinationId],
    );
    destination.activities = activitiesRows;

    // Get nearby hotels based on location
    const [hotelsRows] = await db.query(
      `SELECT h.id, h.name, h.location, h.description, h.facilities_images_urls, h.base_price_per_night
       FROM hotels h
       JOIN users u ON h.manager_user_id = u.id
       WHERE u.status = 'active'
       AND h.location LIKE ?
       LIMIT 10`,
      [`%${destination.region}%`],
    );

    // Parse JSON fields if they exist
    hotelsRows.forEach((hotel) => {
      if (hotel.facilities_images_urls) {
        try {
          hotel.facilities_images_urls = JSON.parse(
            hotel.facilities_images_urls,
          );
        } catch (e) {
          // Keep as is if parsing fails
        }
      }
    });

    destination.nearby_hotels = hotelsRows;

    res.status(200).json(destination);
  } catch (error) {
    console.error("Error fetching destination details:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch destination details",
        error: error.message,
      });
  }
};

/**
 * Get hotels based on location (F6.5)
 */
exports.getHotels = async (req, res) => {
  const { location } = req.query;

  try {
    let query = `
      SELECT h.id, h.name, h.location, h.description, h.base_price_per_night, h.capacity
      FROM hotels h
      JOIN users u ON h.manager_user_id = u.id
      WHERE u.status = 'active'
    `;
    const params = [];

    if (location) {
      query += " AND h.location LIKE ?";
      params.push(`%${location}%`);
    }

    const [hotels] = await db.query(query, params);

    res.status(200).json(hotels);
  } catch (error) {
    console.error("Error fetching hotels:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch hotels", error: error.message });
  }
};
