const db = require("../config/db");

/**
 * Helper function to safely parse JSON fields in objects
 * @param {Array} items - Array of objects to process
 * @param {Array} fields - Array of field names to parse as JSON
 * @returns {Array} - Array of objects with parsed fields
 */
const parseJsonFields = (items, fields) => {
  if (!items || !Array.isArray(items)) return items;
  
  return items.map(item => {
    const newItem = { ...item };
    
    fields.forEach(field => {
      if (newItem[field] && typeof newItem[field] === 'string') {
        try {
          newItem[field] = JSON.parse(newItem[field]);
        } catch (e) {
          // Keep as is if parsing fails
          console.log(`Failed to parse ${field} as JSON:`, e.message);
        }
      }
    });
    
    return newItem;
  });
};

/**
 * Create a booking (save as pending payment) (F6.7)
 */
exports.createBooking = async (req, res) => {
  const { transportId, hotelId, activityIds, startDate, endDate } =
    req.body;
  const userId = req.user.id;

  // Validate date inputs
  if (!startDate || !endDate) {
    return res.status(400).json({ message: "Start date and end date are required" });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  if (end <= start) {
    return res.status(400).json({ message: "End date must be after start date" });
  }

  // Validate reasonable booking duration (e.g., max 30 days)
  const daysBooked = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (daysBooked > 30) {
    return res.status(400).json({ message: "Booking duration cannot exceed 30 days" });
  }

  try {
    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Calculate total cost by summing costs from selected items
      let totalCost = 0;
      const selectedItems = [];

      // Check and calculate cost for transport
      if (transportId) {
        const [transportRows] = await connection.query(
          "SELECT id, cost FROM transports WHERE id = ?",
          [transportId],
        );

        if (transportRows.length === 0) {
          return res.status(404).json({ message: "Transport route not found" });
        }

        const transport = transportRows[0];
        totalCost += parseFloat(transport.cost);
        selectedItems.push({
          type: "transport",
          id: transport.id,
          cost: transport.cost,
        });
      }

      // Check and calculate cost for hotel
      if (hotelId) {
        const [hotelRows] = await connection.query(
          "SELECT id, base_price_per_night FROM hotels WHERE id = ?",
          [hotelId],
        );

        if (hotelRows.length === 0) {
          return res.status(404).json({ message: "Hotel not found" });
        }

        const hotel = hotelRows[0];

        // Calculate number of nights
        const hotelStart = new Date(startDate);
        const hotelEnd = new Date(endDate);
        const nights = Math.ceil((hotelEnd - hotelStart) / (1000 * 60 * 60 * 24));

        const hotelCost =
          parseFloat(hotel.base_price_per_night) * Math.max(1, nights);
        totalCost += hotelCost;

        selectedItems.push({
          type: "hotel",
          id: hotel.id,
          cost: hotelCost,
          nights: nights,
        });
      }

      // Add a default tour guide overhead cost for now
      // This will be adjusted when admin assigns a tour guide
      const guideCostPerDay = 50; // Default guide cost per day
      const guideStart = new Date(startDate);
      const guideEnd = new Date(endDate);
      const days = Math.ceil((guideEnd - guideStart) / (1000 * 60 * 60 * 24));
      const guideCost = guideCostPerDay * Math.max(1, days);
      
      // Add an overhead for tour guide that will be assigned later by admin
      totalCost += guideCost;
      
      // Add a placeholder item for the tour guide
      selectedItems.push({
        type: "placeholder",
        id: 0, // This will be replaced when admin assigns a real guide
        cost: guideCost,
        days: days,
        details: {
          type: "tour_guide_placeholder",
          message: "Tour guide will be assigned by admin",
          days: days,
          cost_per_day: guideCostPerDay
        }
      });
      
      // Check and calculate cost for activities
      if (activityIds && Array.isArray(activityIds) && activityIds.length > 0) {
        const placeholders = activityIds.map(() => "?").join(",");
        
        // Verify that all activities are available
        const [activityStatusRows] = await connection.query(
          `SELECT id, status FROM activities WHERE id IN (${placeholders})`,
          activityIds
        );

        if (activityStatusRows.length !== activityIds.length) {
          await connection.rollback();
          connection.release();
          return res
            .status(404)
            .json({ message: "One or more activities not found" });
        }
        
        // Check if any activities are already booked or not available
        const unavailableActivities = activityStatusRows.filter(
          activity => activity.status !== 'available'
        );
        
        if (unavailableActivities.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            message: "Some selected activities are not available for booking",
            unavailableActivities: unavailableActivities.map(a => a.id)
          });
        }
        
        // Get activity prices
        const [activityRows] = await connection.query(
          `SELECT id, price FROM activities WHERE id IN (${placeholders})`,
          activityIds,
        );

        // Temporarily mark activities as 'pending' to prevent race conditions
        for (const activityId of activityIds) {
          await connection.query(
            `UPDATE activities SET status = 'pending' WHERE id = ?`,
            [activityId]
          );
        }

        for (const activity of activityRows) {
          totalCost += parseFloat(activity.price);
          selectedItems.push({
            type: "activity",
            id: activity.id,
            cost: activity.price,
          });
        }
      }

      // Create booking record
      const [bookingResult] = await connection.query(
        `INSERT INTO bookings (tourist_user_id, total_cost, status)
         VALUES (?, ?, 'pending_payment')`,
        [userId, totalCost],
      );

      const bookingId = bookingResult.insertId;

      // Create booking items
      for (const item of selectedItems) {
        // For placeholder items, store the details
        if (item.type === 'placeholder' && item.details) {
          await connection.query(
            `INSERT INTO booking_items (booking_id, item_type, item_id, cost, provider_status, item_details)
             VALUES (?, ?, ?, ?, 'pending', ?)`,
            [bookingId, item.type, item.id, item.cost, JSON.stringify(item.details)],
          );
        } else {
          await connection.query(
            `INSERT INTO booking_items (booking_id, item_type, item_id, cost, provider_status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [bookingId, item.type, item.id, item.cost],
          );
        }
      }

      await connection.commit();
      connection.release();
      
      res.status(201).json({
        message: "Booking created successfully",
        bookingId,
        totalCost,
      });
    } catch (error) {
      // If we have activities, restore their status to 'available'
      if (activityIds && Array.isArray(activityIds) && activityIds.length > 0) {
        for (const activityId of activityIds) {
          try {
            await connection.query(
              `UPDATE activities SET status = 'available' WHERE id = ? AND status = 'pending'`,
              [activityId]
            );
          } catch (cleanupError) {
            console.error("Error restoring activity status:", cleanupError);
          }
        }
      }
      
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error creating booking:", error);
    res
      .status(500)
      .json({ message: "Failed to create booking", error: error.message });
  }
};

/**
 * Get user's bookings
 */
exports.getUserBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get all bookings for this user
    const [bookings] = await db.query(
      `SELECT * FROM bookings
       WHERE tourist_user_id = ?
       ORDER BY created_at DESC`,
      [userId],
    );

      // Use our helper function for JSON parsing

  // For each booking, get its items
  for (let i = 0; i < bookings.length; i++) {
    const [items] = await db.query(
      `SELECT bi.*,
       CASE
         WHEN bi.item_type = 'hotel' THEN h.name
         WHEN bi.item_type = 'transport' THEN CONCAT(tr.origin, ' to ', tr.destination)
         WHEN bi.item_type = 'tour_guide' THEN tg.full_name
         WHEN bi.item_type = 'activity' THEN a.name
       END as item_name
       FROM booking_items bi
       LEFT JOIN hotels h ON bi.item_type = 'hotel' AND bi.item_id = h.id
       LEFT JOIN transports tr ON bi.item_type = 'transport' AND bi.item_id = tr.id
       LEFT JOIN tour_guides tg ON bi.item_type = 'tour_guide' AND bi.item_id = tg.user_id
       LEFT JOIN activities a ON bi.item_type = 'activity' AND bi.item_id = a.id
       WHERE bi.booking_id = ?`,
      [bookings[i].id],
    );

    // Parse item_details JSON if it exists
    bookings[i].items = parseJsonFields(items, ['item_details']);
  }

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
};

/**
 * Get Tour Guide bookings (requirement from 4.4.14)
 */
exports.getTourGuideBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get the booking items
    const [bookingItemsResult] = await db.query(
      `SELECT bi.*, b.created_at, b.tourist_user_id, b.status,
         u.email as tourist_email
       FROM booking_items bi
       JOIN bookings b ON bi.booking_id = b.id
       JOIN users u ON b.tourist_user_id = u.id
       WHERE bi.item_type = 'tour_guide'
       AND bi.item_id = ?
       AND b.status = 'confirmed'
       ORDER BY b.created_at DESC`,
      [userId],
    );

    // Parse item_details JSON if it exists
    const bookingItems = parseJsonFields(bookingItemsResult, ['item_details']);

    res.status(200).json(bookingItems);
  } catch (error) {
    console.error("Error fetching tour guide bookings:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
};

/**
 * Get bookings for tour guides to see assigned tours
 */
exports.getGuideAssignedBookings = async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Get all bookings where this guide is assigned
    let [rows] = await db.query(
      `SELECT bi.id as booking_item_id, bi.cost, bi.item_details,
              b.id as booking_id, b.total_cost, b.status, b.created_at,
              u.id as tourist_id, u.email as tourist_email
       FROM booking_items bi
       JOIN bookings b ON bi.booking_id = b.id
       JOIN users u ON b.tourist_user_id = u.id
       WHERE bi.item_type = 'tour_guide'
       AND bi.item_id = ?
       AND b.status = 'confirmed'
       ORDER BY b.created_at DESC`,
      [userId]
    );
    
    // For each booking, get the activities and hotel
    for (let i = 0; i < rows.length; i++) {
      // Parse the item_details for this specific row
      const parsedRow = parseJsonFields([rows[i]], ['item_details']);
      rows[i] = parsedRow[0];
      
      // Get activities for this booking
      const [activities] = await db.query(
        `SELECT a.id, a.name, a.description, a.price, a.date, a.group_size, a.status,
                d.name as destination_name, d.region as destination_region
         FROM booking_items bi
         JOIN activities a ON bi.item_id = a.id
         JOIN destinations d ON a.destination_id = d.id
         WHERE bi.booking_id = ?
         AND bi.item_type = 'activity'`,
        [rows[i].booking_id]
      );
      
      // Get hotel information for this booking
      const [hotelResults] = await db.query(
        `SELECT h.id, h.name, h.location, bi.item_details
         FROM booking_items bi
         JOIN hotels h ON bi.item_id = h.id
         WHERE bi.booking_id = ?
         AND bi.item_type = 'hotel'`,
        [rows[i].booking_id]
      );
      
      const hotel = hotelResults.length > 0 ? 
        parseJsonFields(hotelResults, ['item_details']) : 
        [];
      
      rows[i].activities = activities;
      rows[i].hotel = hotel.length > 0 ? hotel[0] : null;
    }
    
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching assigned bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
  }
};

/**
 * Get bookings for a specific hotel that need action
 */
exports.getHotelBookingsNeedingAction = async (req, res) => {
  const userId = req.user.id;

  try {
    // First get the hotel ID for this manager
    const [hotelRows] = await db.query(
      "SELECT id FROM hotels WHERE manager_user_id = ?",
      [userId]
    );

    if (hotelRows.length === 0) {
      return res.status(404).json({ message: "Hotel not found for this manager" });
    }

    const hotelId = hotelRows[0].id;

    // Get bookings that need action
    const [bookingItems] = await db.query(
      `SELECT bi.*, b.created_at, b.tourist_user_id, u.email as tourist_email
       FROM booking_items bi
       JOIN bookings b ON bi.booking_id = b.id
       JOIN users u ON b.tourist_user_id = u.id
       WHERE bi.item_type = 'hotel'
       AND bi.item_id = ?
       AND bi.provider_status = 'pending'
       AND b.status = 'confirmed'
       ORDER BY b.created_at DESC`,
      [hotelId]
    );

    res.status(200).json(bookingItems);
  } catch (error) {
    console.error("Error fetching bookings needing action:", error);
    res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
  }
};

/**
 * Confirm room for a booking
 */
exports.confirmHotelRoom = async (req, res) => {
  const { itemId } = req.params;
  const { roomDetails } = req.body;
  const userId = req.user.id;

  try {
    // Verify the booking item belongs to this hotel manager
    const [hotelRows] = await db.query(
      "SELECT id FROM hotels WHERE manager_user_id = ?",
      [userId]
    );

    if (hotelRows.length === 0) {
      return res.status(404).json({ message: "Hotel not found for this manager" });
    }

    const hotelId = hotelRows[0].id;

    // Check if the booking item belongs to this hotel and is pending
    const [bookingItemRows] = await db.query(
      `SELECT * FROM booking_items 
       WHERE id = ? 
       AND item_type = 'hotel' 
       AND item_id = ? 
       AND provider_status = 'pending'`,
      [itemId, hotelId]
    );

    if (bookingItemRows.length === 0) {
      return res.status(404).json({ 
        message: "Booking item not found or not associated with your hotel or already processed" 
      });
    }

    // Update the booking item with room details
    await db.query(
      `UPDATE booking_items 
       SET provider_status = 'confirmed', 
       item_details = ? 
       WHERE id = ?`,
      [JSON.stringify(roomDetails), itemId]
    );

    res.status(200).json({ message: "Room confirmed successfully" });
  } catch (error) {
    console.error("Error confirming room:", error);
    res.status(500).json({ message: "Failed to confirm room", error: error.message });
  }
};

/**
 * Get bookings for travel agent that need action
 */
exports.getTransportBookingsNeedingAction = async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Travel agent's user ID is now directly the agency ID
    const agencyId = userId;
    
    // Get bookings that need action
    const [bookingItems] = await db.query(
      `SELECT bi.*, tr.origin, tr.destination, tr.transportation_type, 
              b.created_at, b.tourist_user_id, u.email as tourist_email
       FROM booking_items bi
       JOIN transports tr ON bi.item_id = tr.id
       JOIN bookings b ON bi.booking_id = b.id
       JOIN users u ON b.tourist_user_id = u.id
       WHERE tr.agency_id = ?
       AND bi.provider_status = 'pending'
       AND b.status = 'confirmed'
       ORDER BY b.created_at DESC`,
      [agencyId]
    );
    
    res.status(200).json(bookingItems);
  } catch (error) {
    console.error("Error fetching bookings needing action:", error);
    res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
  }
};

/**
 * Assign ticket for a booking
 */
exports.assignTransportTicket = async (req, res) => {
  const { itemId } = req.params;
  const { ticketDetails } = req.body;
  const userId = req.user.id;
  
  try {
    // Travel agent's user ID is now directly the agency ID
    const agencyId = userId;
    
    // Check if the booking item belongs to a route owned by this agency
    const [bookingItemRows] = await db.query(
      `SELECT bi.* 
       FROM booking_items bi
       JOIN transports tr ON bi.item_id = tr.id
       WHERE bi.id = ?
       AND bi.item_type = 'transport'
       AND tr.agency_id = ?
       AND bi.provider_status = 'pending'`,
      [itemId, agencyId]
    );
    
    if (bookingItemRows.length === 0) {
      return res.status(404).json({ 
        message: "Booking item not found or not associated with your agency or already processed" 
      });
    }
    
    // Update the booking item with ticket details
    await db.query(
      `UPDATE booking_items 
       SET provider_status = 'confirmed', 
           item_details = ? 
       WHERE id = ?`,
      [JSON.stringify(ticketDetails), itemId]
    );
    
    res.status(200).json({ message: "Ticket assigned successfully" });
  } catch (error) {
    console.error("Error assigning ticket:", error);
    res.status(500).json({ message: "Failed to assign ticket", error: error.message });
  }
};

/**
 * Admin assigns tour guide to a booking
 */
exports.assignTourGuide = async (req, res) => {
  const { bookingId } = req.params;
  const { guideId } = req.body;
  
  if (!bookingId || !guideId) {
    return res.status(400).json({ message: "Booking ID and Guide ID are required" });
  }
  
  try {
    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Verify the booking exists and is in appropriate status
      const [bookingRows] = await connection.query(
        "SELECT * FROM bookings WHERE id = ? AND status = 'confirmed'",
        [bookingId]
      );
      
      if (bookingRows.length === 0) {
        return res.status(404).json({ message: "Booking not found or not in confirmed status" });
      }
      
      // Verify the guide exists and is active
      const [guideRows] = await connection.query(
        `SELECT u.id, tg.expertise, tg.location, tg.full_name
         FROM users u
         JOIN tour_guides tg ON u.id = tg.user_id
         WHERE u.id = ? AND u.role = 'tour_guide' AND u.status = 'active'`,
        [guideId]
      );
      
      if (guideRows.length === 0) {
        return res.status(404).json({ message: "Tour guide not found or not active" });
      }
      
      // Check if a tour guide placeholder exists or if a tour guide is already assigned
      const [existingGuideRows] = await connection.query(
        `SELECT id, item_type, item_id, cost, item_details 
         FROM booking_items 
         WHERE booking_id = ? AND (item_type = 'placeholder' OR item_type = 'tour_guide')`,
        [bookingId]
      );
      
      // If no placeholder or tour guide exists, this is an error - all bookings should have either
      if (existingGuideRows.length === 0) {
        return res.status(400).json({ message: "This booking has no placeholder for a tour guide" });
      }
      
      // If a tour guide is already assigned, don't allow another assignment
      if (existingGuideRows.some(item => item.item_type === 'tour_guide')) {
        return res.status(400).json({ message: "This booking already has a tour guide assigned" });
      }
      
      // First, get the start and end dates from booking details or hotel booking
      const [bookingDetailsRows] = await connection.query(
        `SELECT bi.item_details
         FROM booking_items bi
         WHERE bi.booking_id = ? AND bi.item_type = 'hotel'`,
        [bookingId]
      );
      
      // If there's no hotel information, try to get date information from a placeholder
      let days = 0;
      const placeholder = existingGuideRows.find(item => item.item_type === 'placeholder');
      let placeholderDetails = null;
      
      if (bookingDetailsRows.length === 0) {
        // Check if there's a placeholder with date information
        if (!placeholder || !placeholder.item_details) {
          return res.status(404).json({ 
            message: "Booking has insufficient date information to assign a tour guide" 
          });
        }
        
        // Try to parse the item_details for the placeholder
        try {
          if (typeof placeholder.item_details === 'string') {
            placeholderDetails = JSON.parse(placeholder.item_details);
          } else {
            placeholderDetails = placeholder.item_details;
          }
        } catch (error) {
          return res.status(500).json({ 
            message: "Failed to parse booking details", 
            error: error.message 
          });
        }
        
        // If we don't have days information in the placeholder, we can't proceed
        if (!placeholderDetails.days || placeholderDetails.days <= 0) {
          return res.status(400).json({ 
            message: "Invalid booking duration for tour guide assignment" 
          });
        }
        
        days = placeholderDetails.days;
      } else {
        // Use hotel booking information if available
        let itemDetails;
        // Use our parseJsonFields helper function
        const parsedDetails = parseJsonFields([bookingDetailsRows[0]], ['item_details']);
        itemDetails = parsedDetails[0].item_details || {};
        
        const startDate = itemDetails.check_in ? new Date(itemDetails.check_in) : new Date();
        const endDate = itemDetails.check_out ? new Date(itemDetails.check_out) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        
        // Calculate number of days
        days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      }
      
      // Assuming a fixed cost per day for guide services
      const guideCostPerDay = 50; // This could be stored in the tour_guides table instead
      const guideCost = guideCostPerDay * Math.max(1, days);
      
      // Replace the placeholder with the actual tour guide
      const guideItemToUpdate = existingGuideRows.find(item => item.item_type === 'placeholder');
      
      await connection.query(
        `UPDATE booking_items 
         SET item_type = 'tour_guide', 
             item_id = ?, 
             provider_status = 'confirmed', 
             item_details = ? 
         WHERE id = ?`,
        [
          guideId,
          JSON.stringify({ 
            days,
            assigned_by: "admin",
            assigned_at: new Date().toISOString(),
            guide_name: guideRows[0].full_name,
            location: guideRows[0].location
          }),
          guideItemToUpdate.id
        ]
      );
      
      await connection.commit();
      res.status(200).json({ 
        message: "Tour guide assigned successfully", 
        guide: {
          id: guideRows[0].id,
          location: guideRows[0].location,
          cost: guideCost,
          days
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error assigning tour guide:", error);
    res.status(500).json({ message: "Failed to assign tour guide", error: error.message });
  }
};

/**
 * Admin gets all unassigned bookings (bookings without tour guides)
 */
exports.getUnassignedBookings = async (req, res) => {
  try {
    // Get all confirmed bookings that don't have a tour guide assigned
    const [rows] = await db.query(
      `SELECT b.*, u.email as tourist_email
       FROM bookings b
       JOIN users u ON b.tourist_user_id = u.id
       WHERE b.status = 'confirmed'
       AND b.id NOT IN (
         SELECT DISTINCT booking_id 
         FROM booking_items 
         WHERE item_type = 'tour_guide'
       )
       ORDER BY b.created_at DESC`
    );
    
    // For each booking, get its items (except tour guide which doesn't exist)
    for (let i = 0; i < rows.length; i++) {
      const [items] = await db.query(
        `SELECT bi.*,
         CASE
           WHEN bi.item_type = 'hotel' THEN h.name
           WHEN bi.item_type = 'transport' THEN CONCAT(tr.origin, ' to ', tr.destination)
           WHEN bi.item_type = 'activity' THEN a.name
         END as item_name,
         CASE
           WHEN bi.item_type = 'hotel' THEN h.location
           WHEN bi.item_type = 'activity' THEN d.name
           ELSE NULL
         END as location
         FROM booking_items bi
         LEFT JOIN hotels h ON bi.item_type = 'hotel' AND bi.item_id = h.id
         LEFT JOIN transports tr ON bi.item_type = 'transport' AND bi.item_id = tr.id
         LEFT JOIN activities a ON bi.item_type = 'activity' AND bi.item_id = a.id
         LEFT JOIN destinations d ON a.destination_id = d.id
         WHERE bi.booking_id = ?`,
        [rows[i].id]
      );
      
      // Parse item_details JSON if it exists
      rows[i].items = parseJsonFields(items, ['item_details']);
    }
    
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching unassigned bookings:", error);
    res.status(500).json({ message: "Failed to fetch unassigned bookings", error: error.message });
  }
};

/**
 * Admin gets eligible tour guides for a specific booking
 */
exports.getEligibleGuidesForBooking = async (req, res) => {
  const { bookingId } = req.params;
  
  try {
    // Get booking details to determine location
    const [bookingItems] = await db.query(
      `SELECT bi.*, h.location as hotel_location, a.destination_id
       FROM booking_items bi
       LEFT JOIN hotels h ON bi.item_type = 'hotel' AND bi.item_id = h.id
       LEFT JOIN activities a ON bi.item_type = 'activity' AND bi.item_id = a.id
       WHERE bi.booking_id = ?`,
      [bookingId]
    );
    
    if (bookingItems.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Get hotel location or destination from activities
    let location = null;
    let destinationId = null;
    
    for (const item of bookingItems) {
      if (item.item_type === 'hotel' && item.hotel_location) {
        location = item.hotel_location;
      }
      if (item.item_type === 'activity' && item.destination_id) {
        destinationId = item.destination_id;
      }
    }
    
    // If we have activity destination, get its location
    if (destinationId && !location) {
      const [destinationRows] = await db.query(
        "SELECT name, region FROM destinations WHERE id = ?", 
        [destinationId]
      );
      
      if (destinationRows.length > 0) {
        location = destinationRows[0].region || destinationRows[0].name;
      }
    }
    
    if (!location) {
      return res.status(400).json({ message: "Could not determine booking location" });
    }
    
    // Get activities for this booking
    const activityIds = bookingItems
      .filter(item => item.item_type === 'activity')
      .map(item => item.item_id);
    
    // Find tour guides based on location and expertise
    const [guides] = await db.query(
      `SELECT u.id, u.email, tg.full_name, tg.location, tg.expertise, tg.user_id
       FROM tour_guides tg
       JOIN users u ON tg.user_id = u.id
       WHERE u.role = 'tour_guide' AND u.status = 'active'
       AND (tg.location LIKE ? OR ? LIKE CONCAT('%', tg.location, '%'))
       ORDER BY 
         CASE WHEN tg.location = ? THEN 1
              WHEN tg.location LIKE ? THEN 2
              WHEN ? LIKE CONCAT('%', tg.location, '%') THEN 3
              ELSE 4
         END`,
      [
        `%${location}%`, 
        location, 
        location, 
        `%${location}%`, 
        location
      ]
    );
    
    // Process expertise to find those that match the activities
    const parsedGuides = parseJsonFields(guides, ['expertise']);
    
    // Process expertise for each guide
    parsedGuides.forEach(guide => {
      try {
        // Process expertise if it's in the correct format
        if (guide.expertise && typeof guide.expertise === 'object') {
          if (guide.expertise.activities && Array.isArray(guide.expertise.activities)) {
            // Check if guide has expertise in any of the booking's activities
            guide.matching_activities = guide.expertise.activities.filter(
              activity => activityIds.includes(activity.id)
            );
            
            // Calculate expertise match percentage
            guide.expertise_match = activityIds.length > 0 
              ? (guide.matching_activities.length / activityIds.length) * 100 
              : 0;
          } else {
            guide.expertise_match = 0;
          }
        } else {
          guide.expertise_match = 0;
        }
      } catch (e) {
        guide.expertise_match = 0;
      }
    });
    
    // Sort guides by expertise match and then by location match
    parsedGuides.sort((a, b) => b.expertise_match - a.expertise_match);
    
    res.status(200).json(parsedGuides);
  } catch (error) {
    console.error("Error finding eligible guides:", error);
    res.status(500).json({ message: "Failed to find eligible guides", error: error.message });
  }
};

/**
 * Cancel a booking
 */
exports.cancelBooking = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // First, verify the booking exists and belongs to this user
      const [bookingRows] = await connection.query(
        `SELECT * FROM bookings WHERE id = ? AND tourist_user_id = ?`,
        [bookingId, userId]
      );

      if (bookingRows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: "Booking not found" });
      }

      const booking = bookingRows[0];

      // Check if the booking is in a cancelable state (not already canceled, etc.)
      if (booking.status === 'cancelled') {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ message: "Booking is already cancelled" });
      }

      // Get booking items to handle refunds and releasing resources
      const [itemsRows] = await connection.query(
        `SELECT * FROM booking_items WHERE booking_id = ?`,
        [bookingId]
      );

      // Release any booked activities
      const activityItems = itemsRows.filter(item => item.item_type === 'activity');
      for (const item of activityItems) {
        await connection.query(
          `UPDATE activities SET status = 'available' WHERE id = ? AND status = 'booked'`,
          [item.item_id]
        );
      }

      // Update booking status to cancelled
      await connection.query(
        `UPDATE bookings SET status = 'cancelled' WHERE id = ?`,
        [bookingId]
      );

      // If the booking was already paid for, process a refund
      if (booking.status === 'confirmed') {
        // Get payment information
        const [paymentRows] = await connection.query(
          `SELECT * FROM payments WHERE booking_id = ? AND status = 'successful'`,
          [bookingId]
        );

        if (paymentRows.length > 0) {
          const payment = paymentRows[0];
          const refundAmount = payment.amount;
          
          // Different refund logic based on original payment method
          switch (payment.payment_method) {
            case 'card':
              // In a real system, you would process the refund through the payment gateway
              // Here we'll simply record the refund
              await connection.query(
                `INSERT INTO payments (booking_id, user_id, amount, payment_method, 
                  reference, status, transaction_id, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  bookingId,
                  userId,
                  refundAmount,
                  'refund_to_card',
                  `REFUND-${Date.now()}`,
                  'successful',
                  null,
                  `Refund for canceled booking #${bookingId}`
                ]
              );
              break;
              
            case 'savings_fiat':
              // Refund to savings account
              await connection.query(
                `UPDATE savings_accounts SET balance_usd = balance_usd + ? WHERE user_id = ?`,
                [refundAmount, userId]
              );
              
              // Record the transaction
              const [transactionResult] = await connection.query(
                `INSERT INTO savings_transactions 
                 (user_id, type, amount_usd, description, is_crypto, token_type)
                 VALUES (?, 'refund', ?, ?, FALSE, NULL)`,
                [userId, refundAmount, `Refund for canceled booking #${bookingId}`]
              );
              
              // Record the payment refund
              await connection.query(
                `INSERT INTO payments (booking_id, user_id, amount, payment_method, 
                  reference, status, transaction_id, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  bookingId,
                  userId,
                  refundAmount,
                  'refund_to_savings',
                  `REFUND-${Date.now()}`,
                  'successful',
                  transactionResult.insertId,
                  `Refund for canceled booking #${bookingId}`
                ]
              );
              break;
              
            case 'savings_crypto':
              // Refund to crypto balance - stored as USDT in the smart contract
              await connection.query(
                `UPDATE user_crypto_balances SET crypto_balance = crypto_balance + ? WHERE user_id = ?`,
                [refundAmount, userId]
              );
              
              // Get wallet address for contract interaction data
              const [walletResult] = await connection.query(
                "SELECT wallet_address FROM user_crypto_balances WHERE user_id = ?",
                [userId]
              );
              
              // In production: We would interact with the smart contract to refund
              // by increasing the user's USDT balance
              const contractData = walletResult.length > 0 ? {
                contractAddress: "0xSmartTourContractAddress",
                method: "refund",
                params: {
                  amount: refundAmount,
                  token: "USDT",
                  user: walletResult[0].wallet_address
                }
              } : null;
              
              // Record the transaction
              const [cryptoTransactionResult] = await connection.query(
                `INSERT INTO savings_transactions 
                 (user_id, type, amount_usd, description, is_crypto, token_type)
                 VALUES (?, 'refund', ?, ?, TRUE, 'USDT')`,
                [userId, refundAmount, `USDT refund for canceled booking #${bookingId}`]
              );
              
              // Record the payment refund
              await connection.query(
                `INSERT INTO payments (booking_id, user_id, amount, payment_method, 
                  reference, status, transaction_id, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  bookingId,
                  userId,
                  refundAmount,
                  'refund_to_crypto',
                  `REFUND-${Date.now()}`,
                  'successful',
                  cryptoTransactionResult.insertId,
                  `USDT refund for canceled booking #${bookingId}`
                ]
              );
              
              // In production: This would be accompanied by an event or webhook
              // to notify the user that they need to check their wallet for the refund
              break;
          }
        }
      }

      await connection.commit();
      connection.release();

      res.status(200).json({ 
        message: "Booking canceled successfully",
        bookingId,
        refundProcessed: booking.status === 'confirmed'
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error canceling booking:", error);
    res
      .status(500)
      .json({ message: "Failed to cancel booking", error: error.message });
  }
};
