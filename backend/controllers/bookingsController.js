const db = require("../config/db");

/**
 * Helper function to safely parse JSON fields in objects
 * @param {Array} items - Array of objects to process
 * @param {Array} fields - Array of field names to parse as JSON
 * @returns {Array} - Array of objects with parsed fields
 */
const parseJsonFields = (items, fields) => {
  if (!items || !Array.isArray(items)) return items;

  return items.map((item) => {
    const newItem = { ...item };

    fields.forEach((field) => {
      if (newItem[field] && typeof newItem[field] === "string") {
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
 * Create a booking with flexible service options (Enhanced F6.7)
 */
exports.createBooking = async (req, res) => {
  const {
    transportId,
    hotelId,
    activityIds,
    activitySessions = {}, // Object mapping activity IDs to number of sessions
    startDate,
    endDate,
    destinationId,
    touristFullName,
    includeTransport = true,
    includeHotel = true,
    includeActivities = true,
  } = req.body;
  const userId = req.user.id;

  // Validate tourist full name
  if (
    !touristFullName ||
    typeof touristFullName !== "string" ||
    touristFullName.trim().length < 2
  ) {
    return res
      .status(400)
      .json({
        message:
          "Tourist full name is required and must be at least 2 characters long",
      });
  }

  // Validate date inputs
  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "Start date and end date are required" });
  }

  // Validate that at least one service is included
  if (!includeTransport && !includeHotel && !includeActivities) {
    return res
      .status(400)
      .json({
        message:
          "At least one service (transport, hotel, or activities) must be included",
      });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const currentDate = new Date();

  // Remove time component from current date for fair comparison
  currentDate.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  // Check if start date is in the past
  if (start < currentDate) {
    return res
      .status(400)
      .json({ message: "Start date cannot be in the past" });
  }

  if (end <= start) {
    return res
      .status(400)
      .json({ message: "End date must be after start date" });
  }

  // Validate reasonable booking duration (e.g., max 30 days)
  const daysBooked = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (daysBooked > 30) {
    return res
      .status(400)
      .json({ message: "Booking duration cannot exceed 30 days" });
  }

  try {
    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Calculate total cost by summing costs from selected items
      let totalCost = 0;
      const selectedItems = [];

      // Check and calculate cost for transport (only if included)
      if (includeTransport && transportId) {
        const [transportRows] = await connection.query(
          "SELECT id, cost FROM transports WHERE id = ?",
          [transportId],
        );

        if (transportRows.length === 0) {
          await connection.rollback();
          connection.release();
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

      // Check and calculate cost for hotel (only if included)
      if (includeHotel && hotelId) {
        const [hotelRows] = await connection.query(
          "SELECT id, base_price_per_night FROM hotels WHERE id = ?",
          [hotelId],
        );

        if (hotelRows.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ message: "Hotel not found" });
        }

        const hotel = hotelRows[0];

        // Calculate number of nights
        const hotelStart = new Date(startDate);
        const hotelEnd = new Date(endDate);
        const nights = Math.ceil(
          (hotelEnd - hotelStart) / (1000 * 60 * 60 * 24),
        );

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

      // Check and calculate cost for activities (only if included)
      if (
        includeActivities &&
        activityIds &&
        Array.isArray(activityIds) &&
        activityIds.length > 0
      ) {
        const placeholders = activityIds.map(() => "?").join(",");

        // Verify activities exist and check time slots availability
        const [activityRows] = await connection.query(
          `SELECT a.id, a.price, a.destination_id,
                  d.name as destination_name
           FROM activities a
           JOIN destinations d ON a.destination_id = d.id
           WHERE a.id IN (${placeholders})`,
          activityIds,
        );

        if (activityRows.length !== activityIds.length) {
          await connection.rollback();
          connection.release();
          return res
            .status(404)
            .json({ message: "One or more activities not found" });
        }

        // Validate activity sessions
        for (const activity of activityRows) {
          const activityId = activity.id;
          const sessions = activitySessions[activityId] || 1;

          // Validate sessions is a positive number
          if (!Number.isInteger(sessions) || sessions < 1) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
              message: `Invalid number of sessions for activity "${activity.destination_name}". Must be a positive integer.`,
            });
          }
        }

        for (const activity of activityRows) {
          const sessions = activitySessions[activity.id] || 1;
          const activityCost = parseFloat(activity.price) * sessions;

          // Add activity cost (price * sessions)
          totalCost += activityCost;

          selectedItems.push({
            type: "activity",
            id: activity.id,
            cost: activityCost,
            sessions: sessions,
          });
        }

        // Add a placeholder item for the tour guide (only when activities are selected)
        selectedItems.push({
          type: "placeholder",
          id: 0, // This will be replaced when admin assigns a real guide
          cost: 0, // No cost associated with tour guide now
          details: {
            type: "tour_guide_placeholder",
            message: "Tour guide will be assigned by admin",
          },
        });
      }

      // Create booking record with flexible options
      const [bookingResult] = await connection.query(
        `INSERT INTO bookings (
          tourist_user_id,
          tourist_full_name,
          start_date,
          end_date,
          destination_id,
          total_cost,
          include_transport,
          include_hotel,
          include_activities,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment')`,
        [
          userId,
          touristFullName.trim(),
          startDate,
          endDate,
          destinationId,
          totalCost,
          includeTransport,
          includeHotel,
          includeActivities,
        ],
      );

      const bookingId = bookingResult.insertId;

      // Create booking items
      for (const item of selectedItems) {
        // For placeholder items, store the details
        if (item.type === "placeholder" && item.details) {
          await connection.query(
            `INSERT INTO booking_items (id, booking_id, item_type, cost, provider_status, item_details)
             VALUES (?, ?, ?, ?, 'pending', ?)`,
            [
              item.id,
              bookingId,
              item.type,
              item.cost,
              JSON.stringify(item.details),
            ],
          );
        } else if (item.type === "activity" && item.sessions) {
          // For activities with sessions, store the sessions information
          await connection.query(
            `INSERT INTO booking_items (id, booking_id, item_type, cost, provider_status, sessions)
             VALUES (?, ?, ?, ?, 'pending', ?)`,
            [item.id, bookingId, item.type, item.cost, item.sessions],
          );
        } else {
          await connection.query(
            `INSERT INTO booking_items (id, booking_id, item_type, cost, provider_status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [item.id, bookingId, item.type, item.cost],
          );
        }
      }

      await connection.commit();
      connection.release();

      res.status(201).json({
        message: "Booking created successfully",
        bookingId,
        totalCost,
        flexibleOptions: {
          includeTransport,
          includeHotel,
          includeActivities,
        },
      });
    } catch (error) {
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
    // Get all paid bookings for this user (exclude 'in_cart' status)
    const [bookings] = await db.query(
      `SELECT b.*, d.name as destination_name, d.description as destination_description, d.image_url as destination_image
       FROM bookings b
       LEFT JOIN destinations d ON b.destination_id = d.id
       WHERE b.tourist_user_id = ? AND b.status != 'in_cart'
       ORDER BY b.id DESC`,
      [userId],
    );

    // For each booking, get its items
    for (let i = 0; i < bookings.length; i++) {
      const [items] = await db.query(
        `SELECT bi.*,
         CASE
           WHEN bi.item_type = 'hotel' THEN h.name
           WHEN bi.item_type = 'transport' THEN CONCAT(to_orig.name, ' to ', dest.name)
           WHEN bi.item_type = 'tour_guide' THEN tg.full_name
           WHEN bi.item_type = 'activity' THEN a.name
           WHEN bi.item_type = 'placeholder' THEN 'Tour Guide Assignment Pending'
           ELSE 'Unknown Service'
         END as item_name,
         CASE
           WHEN bi.item_type = 'hotel' THEN hm_user.email
           WHEN bi.item_type = 'transport' THEN ta_user.email
           WHEN bi.item_type = 'tour_guide' THEN tg_user.email
           ELSE NULL
         END as provider_email,
         CASE
           WHEN bi.item_type = 'hotel' THEN hm_user.phone_number
           WHEN bi.item_type = 'transport' THEN ta_user.phone_number
           WHEN bi.item_type = 'tour_guide' THEN tg_user.phone_number
           ELSE NULL
         END as provider_phone
         FROM booking_items bi
         LEFT JOIN hotels h ON bi.item_type = 'hotel' AND bi.id = h.id
         LEFT JOIN users hm_user ON bi.item_type = 'hotel' AND h.id = hm_user.id
         LEFT JOIN transports tr ON bi.item_type = 'transport' AND bi.id = tr.id
         LEFT JOIN travel_agencies ta ON bi.item_type = 'transport' AND tr.agency_id = ta.id
         LEFT JOIN users ta_user ON bi.item_type = 'transport' AND ta.id = ta_user.id
         LEFT JOIN transport_origins to_orig ON bi.item_type = 'transport' AND tr.origin_id = to_orig.id
         LEFT JOIN destinations dest ON bi.item_type = 'transport' AND tr.destination_id = dest.id
         LEFT JOIN tour_guides tg ON bi.item_type = 'tour_guide' AND bi.id = tg.user_id
         LEFT JOIN users tg_user ON bi.item_type = 'tour_guide' AND tg.user_id = tg_user.id
         LEFT JOIN activities a ON bi.item_type = 'activity' AND bi.id = a.id
         WHERE bi.booking_id = ?
         ORDER BY
           CASE bi.item_type
             WHEN 'transport' THEN 1
             WHEN 'hotel' THEN 2
             WHEN 'activity' THEN 3
             WHEN 'tour_guide' THEN 4
             WHEN 'placeholder' THEN 5
             ELSE 6
           END`,
        [bookings[i].id],
      );

      // Parse item_details JSON if it exists and add destination info
      bookings[i].items = parseJsonFields(items, ["item_details"]);
      bookings[i].destination = {
        id: bookings[i].destination_id,
        name: bookings[i].destination_name,
        description: bookings[i].destination_description,
        image_url: bookings[i].destination_image,
      };

      // Clean up duplicate fields
      delete bookings[i].destination_name;
      delete bookings[i].destination_description;
      delete bookings[i].destination_image;
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
      `SELECT bi.*, b.tourist_user_id, b.status,
         u.email as tourist_email, u.phone_number as tourist_phone, b.tourist_full_name as tourist_name
       FROM booking_items bi
       JOIN bookings b ON bi.booking_id = b.id
       JOIN users u ON b.tourist_user_id = u.id
       WHERE bi.item_type = 'tour_guide'
       AND bi.id = ?
       AND b.status = 'confirmed'
       ORDER BY b.id DESC`,
      [userId],
    );

    // Parse item_details JSON if it exists
    const bookingItems = parseJsonFields(bookingItemsResult, ["item_details"]);

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
    // Get all bookings where this tour guide is assigned
    const [rows] = await db.query(
      `SELECT DISTINCT
              b.id as booking_id,
              b.total_cost,
              b.status,
              b.created_at,
              b.start_date,
              b.end_date,
              u.id as tourist_id,
              u.email as tourist_email,
              u.phone_number as tourist_phone,
              d.id as destination_id,
              d.name as destination_name,
              d.description as destination_description,
              bi.item_details as guide_assignment_details
       FROM booking_items bi
       JOIN bookings b ON bi.booking_id = b.id
       JOIN users u ON b.tourist_user_id = u.id
       JOIN destinations d ON b.destination_id = d.id
       WHERE bi.item_type = 'tour_guide'
       AND bi.id = ?
       AND b.status IN ('confirmed', 'completed')
       ORDER BY b.start_date DESC`,
      [userId],
    );

    // For each booking, get comprehensive details
    for (let i = 0; i < rows.length; i++) {
      // Parse the guide assignment details
      const parsedRow = parseJsonFields(
        [rows[i]],
        ["guide_assignment_details"],
      );
      rows[i] = parsedRow[0];

      // Get activities for this booking
      const [activities] = await db.query(
        `SELECT a.id, a.name, a.description, a.price, bi.sessions
         FROM booking_items bi
         JOIN activities a ON bi.id = a.id
         WHERE bi.booking_id = ?
         AND bi.item_type = 'activity'`,
        [rows[i].booking_id],
      );

      // Get hotel information for this booking
      const [hotelResults] = await db.query(
        `SELECT h.id, h.name, h.destination_id, d.name as hotel_destination_name, h.description, bi.item_details
         FROM booking_items bi
         JOIN hotels h ON bi.id = h.id
         JOIN destinations d ON h.destination_id = d.id
         WHERE bi.booking_id = ?
         AND bi.item_type = 'hotel'`,
        [rows[i].booking_id],
      );

      const hotel =
        hotelResults.length > 0
          ? parseJsonFields(hotelResults, ["item_details"])[0]
          : null;

      // Get transport information for this booking
      const [transportResults] = await db.query(
        `SELECT t.id, to_orig.name as origin_name, d.name as transport_destination_name, t.cost, bi.item_details
         FROM booking_items bi
         JOIN transports t ON bi.id = t.id
         JOIN transport_origins to_orig ON t.origin_id = to_orig.id
         JOIN destinations d ON t.destination_id = d.id
         WHERE bi.booking_id = ?
         AND bi.item_type = 'transport'`,
        [rows[i].booking_id],
      );

      const transport =
        transportResults.length > 0
          ? parseJsonFields(transportResults, ["item_details"])[0]
          : null;

      // Calculate booking duration
      const startDate = new Date(rows[i].start_date);
      const endDate = new Date(rows[i].end_date);
      const durationDays = Math.ceil(
        (endDate - startDate) / (1000 * 60 * 60 * 24),
      );

      // Determine booking status based on dates
      const currentDate = new Date();
      let bookingStatus = "upcoming";
      if (currentDate > endDate) {
        bookingStatus = "completed";
      } else if (currentDate >= startDate && currentDate <= endDate) {
        bookingStatus = "ongoing";
      }

      // Add all details to the row
      rows[i].activities = activities || [];
      rows[i].hotel = hotel;
      rows[i].transport = transport;
      rows[i].duration_days = durationDays;
      rows[i].booking_status = bookingStatus;
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching assigned bookings:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
};

/**
 * Get bookings for a specific hotel that need action
 */
exports.getHotelBookingsNeedingAction = async (req, res) => {
  const userId = req.user.id;

  try {
    // Hotel ID is now directly the user ID of the hotel manager
    const hotelId = userId;

    // Get bookings that need action
    const [bookingItems] = await db.query(
      `SELECT bi.*, b.start_date, b.end_date, b.tourist_user_id, u.email as tourist_email, u.phone_number as tourist_phone, b.tourist_full_name as tourist_name
       FROM booking_items bi
       JOIN bookings b ON bi.booking_id = b.id
       JOIN users u ON b.tourist_user_id = u.id
       WHERE bi.item_type = 'hotel'
       AND bi.id = ?
       AND bi.provider_status = 'pending'
       AND b.status = 'confirmed'
       ORDER BY b.id DESC`,
      [hotelId],
    );

    res.status(200).json(bookingItems);
  } catch (error) {
    console.error("Error fetching bookings needing action:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
};

/**
 * Confirm room for a booking
 */
exports.confirmHotelRoom = async (req, res) => {
  const { itemId } = req.params;
  const { roomDetails } = req.body;

  try {
    // Check if the booking item belongs to this hotel and is pending
    const [bookingItemRows] = await db.query(
      `SELECT bi.*, b.id as booking_id FROM booking_items bi
       JOIN bookings b ON bi.booking_id = b.id
       WHERE bi.id = ?
       AND bi.item_type = 'hotel'
       AND bi.provider_status = 'pending'
       AND b.status = 'confirmed'`,
      [itemId],
    );

    if (bookingItemRows.length === 0) {
      return res.status(404).json({
        message:
          "Booking item not found or not associated with your hotel or already processed",
      });
    }

    // Basic validation for required fields
    if (!roomDetails.roomNumber || !roomDetails.roomType) {
      return res
        .status(400)
        .json({ message: "Room number and room type are required" });
    }

    // Prepare enhanced room details with confirmation flag
    const enhancedRoomDetails = {
      ...roomDetails,
      room_confirmed: true,
      confirmed_at: new Date().toISOString(),
      confirmed_by: "hotel_manager",
    };

    // Update the booking item with room details
    await db.query(
      `UPDATE booking_items
       SET provider_status = 'confirmed',
       item_details = ?
       WHERE id = ?`,
      [JSON.stringify(enhancedRoomDetails), itemId],
    );

    // Check if all booking items are now confirmed
    await checkAndUpdateBookingCompletion(bookingItemRows[0].booking_id);

    res.status(200).json({ message: "Room confirmed successfully" });
  } catch (error) {
    console.error("Error confirming room:", error);
    res
      .status(500)
      .json({ message: "Failed to confirm room", error: error.message });
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
      `SELECT bi.*, to_orig.name as origin_name, d.name as destination_name, tr.transportation_type,
              b.tourist_user_id, u.email as tourist_email, u.phone_number as tourist_phone, b.tourist_full_name as tourist_name
       FROM booking_items bi
       JOIN transports tr ON bi.item_type = 'transport' AND bi.id = tr.id
       JOIN transport_origins to_orig ON tr.origin_id = to_orig.id
       JOIN destinations d ON tr.destination_id = d.id
       JOIN bookings b ON bi.booking_id = b.id
       JOIN users u ON b.tourist_user_id = u.id
       WHERE tr.agency_id = ?
       AND bi.provider_status = 'pending'
       AND b.status = 'confirmed'
       ORDER BY b.id DESC`,
      [agencyId],
    );

    res.status(200).json(bookingItems);
  } catch (error) {
    console.error("Error fetching bookings needing action:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
};

/**
 * Assign ticket for a booking
 */
exports.assignTransportTicket = async (req, res) => {
  const { itemId } = req.params;
  const { ticketPdfUrl } = req.body;
  const userId = req.user.id;

  try {
    // Travel agent's user ID is now directly the agency ID
    const agencyId = userId;

    // Check if the booking item belongs to a route owned by this agency
    const [bookingItemRows] = await db.query(
      `SELECT bi.*, b.id as booking_id
       FROM booking_items bi
       JOIN transports tr ON bi.item_type = 'transport' AND bi.id = tr.id
       JOIN bookings b ON bi.booking_id = b.id
       WHERE bi.id = ?
       AND bi.item_type = 'transport'
       AND tr.agency_id = ?
       AND bi.provider_status = 'pending'
       AND b.status = 'confirmed'`,
      [itemId, agencyId],
    );

    if (bookingItemRows.length === 0) {
      return res.status(404).json({
        message:
          "Booking item not found or not associated with your agency or already processed",
      });
    }

    // Validate that PDF URL is provided
    if (!ticketPdfUrl) {
      return res.status(400).json({ message: "Ticket PDF is required" });
    }

    // Prepare ticket details with PDF URL
    const ticketDetails = {
      ticket_pdf_url: ticketPdfUrl,
      ticket_assigned: true,
      assigned_at: new Date().toISOString(),
      assigned_by: "travel_agent",
    };

    // Update the booking item with ticket details
    await db.query(
      `UPDATE booking_items
       SET provider_status = 'confirmed',
           item_details = ?
       WHERE id = ?`,
      [JSON.stringify(ticketDetails), itemId],
    );

    // Check if all booking items are now confirmed
    await checkAndUpdateBookingCompletion(bookingItemRows[0].booking_id);

    res.status(200).json({ message: "Ticket assigned successfully" });
  } catch (error) {
    console.error("Error assigning ticket:", error);
    res
      .status(500)
      .json({ message: "Failed to assign ticket", error: error.message });
  }
};

/**
 * Admin assigns tour guide to a booking
 */
exports.assignTourGuide = async (req, res) => {
  const { bookingId } = req.params;
  const { guideId } = req.body;

  if (!bookingId || !guideId) {
    return res
      .status(400)
      .json({ message: "Booking ID and Guide ID are required" });
  }

  try {
    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Verify the booking exists and is in appropriate status
      const [bookingRows] = await connection.query(
        "SELECT * FROM bookings WHERE id = ? AND status = 'confirmed'",
        [bookingId],
      );

      if (bookingRows.length === 0) {
        return res
          .status(404)
          .json({ message: "Booking not found or not in confirmed status" });
      }

      // Verify the guide exists, is active, and is available
      const [guideRows] = await connection.query(
        `SELECT u.id, tg.activities, tg.full_name, tg.available,
                d.name as destination_name
         FROM users u
         JOIN tour_guides tg ON u.id = tg.user_id
         JOIN destinations d ON tg.destination_id = d.id
         WHERE u.id = ? AND u.role = 'tour_guide' AND u.status = 'active'`,
        [guideId],
      );

      if (guideRows.length === 0) {
        return res
          .status(404)
          .json({ message: "Tour guide not found or not active" });
      }

      // Check if the tour guide is available
      if (!guideRows[0].available) {
        return res
          .status(400)
          .json({ message: "Tour guide is not available for new assignments" });
      }

      // Check if a tour guide placeholder exists or if a tour guide is already assigned
      const [existingGuideRows] = await connection.query(
        `SELECT id, item_type, item_details
         FROM booking_items
         WHERE booking_id = ? AND (item_type = 'placeholder' OR item_type = 'tour_guide')`,
        [bookingId],
      );

      // If no placeholder or tour guide exists, this is an error - all bookings should have either
      if (existingGuideRows.length === 0) {
        return res
          .status(400)
          .json({
            message: "This booking has no placeholder for a tour guide",
          });
      }

      // If a tour guide is already assigned, don't allow another assignment
      if (existingGuideRows.some((item) => item.item_type === "tour_guide")) {
        return res
          .status(400)
          .json({ message: "This booking already has a tour guide assigned" });
      }

      // Get the placeholder item
      const placeholder = existingGuideRows.find(
        (item) => item.item_type === "placeholder",
      );

      // Replace the placeholder with the actual tour guide
      await connection.query(
        `UPDATE booking_items
         SET item_type = 'tour_guide',
             id = ?,
             provider_status = 'confirmed',
             item_details = ?
         WHERE id = ?`,
        [
          guideId,
          JSON.stringify({
            assigned_by: "admin",
            assigned_at: new Date().toISOString(),
            guide_name: guideRows[0].full_name,
            destination_name: guideRows[0].destination_name,
          }),
          placeholder.id,
        ],
      );

      // Mark the tour guide as unavailable
      await connection.query(
        `UPDATE tour_guides SET available = FALSE WHERE user_id = ?`,
        [guideId],
      );

      await connection.commit();

      // Check if all booking items are now confirmed (outside transaction)
      await checkAndUpdateBookingCompletion(bookingId);

      res.status(200).json({
        message: "Tour guide assigned successfully",
        guide: {
          id: guideRows[0].id,
          destination_name: guideRows[0].destination_name,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error assigning tour guide:", error);
    res
      .status(500)
      .json({ message: "Failed to assign tour guide", error: error.message });
  }
};

/**
 * Admin gets all unassigned bookings (bookings without tour guides)
 */
exports.getUnassignedBookings = async (req, res) => {
  try {
    // Get all confirmed bookings that don't have a tour guide assigned
    const [rows] = await db.query(
      `SELECT b.id, b.total_cost, b.status, b.start_date, b.end_date,
              u.id as tourist_id, u.email as tourist_email, u.phone_number as tourist_phone,
              b.tourist_full_name as tourist_name,
              d.id as destination_id, d.name as destination_name,
              d.description as destination_description
       FROM bookings b
       JOIN users u ON b.tourist_user_id = u.id
       JOIN destinations d ON b.destination_id = d.id
       WHERE b.status = 'confirmed'
       AND b.id NOT IN (
         SELECT DISTINCT booking_id
         FROM booking_items
         WHERE item_type = 'tour_guide'
       )
       ORDER BY b.start_date ASC`,
    );

    // For each booking, get comprehensive details
    for (let i = 0; i < rows.length; i++) {
      // Get activities for this booking
      const [activities] = await db.query(
        `SELECT a.id, a.name, a.description, a.price, bi.sessions
         FROM booking_items bi
         JOIN activities a ON bi.id = a.id
         WHERE bi.booking_id = ? AND bi.item_type = 'activity'`,
        [rows[i].id],
      );

      // Get hotel information
      const [hotels] = await db.query(
        `SELECT h.id, h.name, h.destination_id, bi.item_details
         FROM booking_items bi
         JOIN hotels h ON bi.id = h.id
         WHERE bi.booking_id = ? AND bi.item_type = 'hotel'`,
        [rows[i].id],
      );

      // Get transport information
      const [transports] = await db.query(
        `SELECT t.id, to_orig.name as origin_name, dest.name as destination_name, t.cost, bi.item_details
         FROM booking_items bi
         JOIN transports t ON bi.id = t.id
         JOIN transport_origins to_orig ON t.origin_id = to_orig.id
         JOIN destinations dest ON t.destination_id = dest.id
         WHERE bi.booking_id = ? AND bi.item_type = 'transport'`,
        [rows[i].id],
      );

      // Calculate duration
      const startDate = new Date(rows[i].start_date);
      const endDate = new Date(rows[i].end_date);
      const durationDays = Math.ceil(
        (endDate - startDate) / (1000 * 60 * 60 * 24),
      );

      // Add computed fields
      rows[i].activities = activities.map((a) => a.name);
      rows[i].activity_details = activities;
      rows[i].hotel_details = parseJsonFields(hotels, ["item_details"]);
      rows[i].transport_details = parseJsonFields(transports, ["item_details"]);
      rows[i].duration_days = durationDays;
      // Tourist name now comes from the booking record, no need to extract from email
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching unassigned bookings:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch unassigned bookings",
        error: error.message,
      });
  }
};

/**
 * Admin gets eligible tour guides for a specific booking
 */
exports.getEligibleGuidesForBooking = async (req, res) => {
  const { bookingId } = req.params;

  try {
    // Get booking details to find destination
    const [bookingRows] = await db.query(
      "SELECT destination_id FROM bookings WHERE id = ? AND status = 'confirmed'",
      [bookingId],
    );

    if (bookingRows.length === 0) {
      return res
        .status(404)
        .json({ message: "Booking not found or not confirmed" });
    }

    const { destination_id } = bookingRows[0];

    if (!destination_id) {
      return res
        .status(400)
        .json({ message: "Could not determine booking destination" });
    }

    // Get activities for this booking
    const [bookingItems] = await db.query(
      "SELECT id FROM booking_items WHERE booking_id = ? AND item_type = 'activity'",
      [bookingId],
    );

    const activityIds = bookingItems.map((item) => item.id);

    // Find tour guides based on destination match and availability
    const [guides] = await db.query(
      `SELECT u.id, u.email, tg.full_name, tg.destination_id, tg.activities, tg.user_id, tg.available,
              d.name as destination_name
       FROM tour_guides tg
       JOIN users u ON tg.user_id = u.id
       JOIN destinations d ON tg.destination_id = d.id
       WHERE u.role = 'tour_guide' AND u.status = 'active'
       AND tg.available = TRUE
       AND tg.destination_id = ?
       ORDER BY tg.full_name`,
      [destination_id],
    );

    // Sort guides by name for consistent ordering
    guides.sort((a, b) => a.full_name.localeCompare(b.full_name));

    res.status(200).json(guides);
  } catch (error) {
    console.error("Error finding eligible guides:", error);
    res
      .status(500)
      .json({
        message: "Failed to find eligible guides",
        error: error.message,
      });
  }
};

/**
 * Process a payment for a booking
 * Simple payment processing - either external (handled by Stripe in frontend)
 * or from user's savings
 */
exports.processBookingPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentMethod, amount } = req.body;
    const userId = req.user.id;

    // Start a transaction to ensure database consistency
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Fetch booking details and verify it's pending payment
      const bookingQuery = `
        SELECT b.id, b.total_cost, b.status
        FROM bookings b
        WHERE b.id = ? AND b.tourist_user_id = ?
      `;

      const [bookingResult] = await connection.query(bookingQuery, [
        bookingId,
        userId,
      ]);

      if (bookingResult.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: "Booking not found" });
      }

      const booking = bookingResult[0];

      if (booking.status !== "pending_payment") {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          message: "Invalid booking status for payment processing",
          status: booking.status,
        });
      }

      // Payment processing logic based on payment method
      let paymentSuccess = false;
      let paymentReference = "";

      switch (paymentMethod) {
        case "external":
          // For external payments (like Stripe), we just mark it as successful
          // since the actual payment processing happens in the frontend
          paymentSuccess = true;
          paymentReference = `EXT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          break;

        case "stripe":
          // Stripe payments are processed in frontend, we just record successful payment
          paymentSuccess = true;
          paymentReference = req.body.paymentIntentId || `STRIPE-${Date.now()}`;
          break;

        case "crypto":
          // Enhanced crypto payment processing
          const walletAddress = req.body.walletAddress;
          const useVaultBalance = req.body.useVaultBalance || false;
          const transactionHash = req.body.transactionHash;
          const amountTZC = req.body.amountTZC;
          const amountTZS = req.body.amountTZS;

          if (!walletAddress) {
            await connection.rollback();
            connection.release();
            return res
              .status(400)
              .json({ message: "Wallet address required for crypto payment" });
          }

          // If vault balance is used, verify transaction hash
          if (useVaultBalance && !transactionHash) {
            await connection.rollback();
            connection.release();
            return res
              .status(400)
              .json({
                message: "Transaction hash required for vault payments",
              });
          }

          // Set payment reference based on payment type
          if (useVaultBalance) {
            paymentReference = `CRYPTO-VAULT-${transactionHash}`;
          } else {
            paymentReference = `CRYPTO-DIRECT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          }

          paymentSuccess = true;
          break;

        case "savings":
          // Check user's balance
          const balanceQuery = `
            SELECT balance FROM users
            WHERE id = ?
          `;
          const [balanceResult] = await connection.query(balanceQuery, [
            userId,
          ]);

          if (balanceResult.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ message: "User not found" });
          }

          const balance = parseFloat(balanceResult[0].balance);

          // Use the amount passed from frontend (discounted price) if available, otherwise use full cost
          const paymentAmount = amount || booking.total_cost;

          if (balance < paymentAmount) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
              message: "Insufficient funds",
              balance,
              required: paymentAmount,
            });
          }

          // Update balance
          await connection.query(
            "UPDATE users SET balance = balance - ? WHERE id = ?",
            [paymentAmount, userId],
          );

          paymentSuccess = true;
          paymentReference = `SAV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          break;

        default:
          await connection.rollback();
          connection.release();
          return res.status(400).json({ message: "Invalid payment method" });
      }

      if (paymentSuccess) {
        // Update booking status
        await connection.query("UPDATE bookings SET status = ? WHERE id = ?", [
          "confirmed",
          bookingId,
        ]);

        // Create payment record
        const paymentQuery = `
          INSERT INTO payments
          (booking_id, user_id, amount, payment_method, reference, status)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [paymentResult] = await connection.query(paymentQuery, [
          bookingId,
          userId,
          paymentMethod === "savings" && amount ? amount : booking.total_cost,
          paymentMethod,
          paymentReference,
          "successful",
        ]);

        await connection.commit();
        connection.release();

        res.status(200).json({
          message: "Payment successful",
          bookingId,
          paymentId: paymentResult.insertId,
          status: "confirmed",
          reference: paymentReference,
        });
      } else {
        await connection.rollback();
        connection.release();
        res.status(500).json({ message: "Payment processing failed" });
      }
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    res
      .status(500)
      .json({ message: "Payment processing error", error: error.message });
  }
};

/**
 * Get completed hotel bookings
 */
exports.getHotelBookingsCompleted = async (req, res) => {
  const userId = req.user.id;
  try {
    // Hotel ID is now directly the user ID of the hotel manager
    const hotelId = userId;

    // Get completed bookings for this hotel
    const [bookingItems] = await db.query(
      `SELECT
        bi.id, bi.booking_id, bi.item_type, bi.id as hotel_id, bi.cost, bi.item_details,
        b.start_date, b.end_date, b.status, b.total_cost,
        u.email as tourist_email, u.phone_number as tourist_phone, b.tourist_full_name as tourist_name
       FROM booking_items bi
       JOIN bookings b ON bi.booking_id = b.id
       JOIN users u ON b.tourist_user_id = u.id
       WHERE bi.item_type = 'hotel'
       AND bi.id = ?
       AND bi.item_details IS NOT NULL
       AND JSON_EXTRACT(bi.item_details, '$.room_confirmed') = true
       ORDER BY b.id DESC`,
      [hotelId],
    );

    // Parse item_details JSON if it exists
    const processedBookings = parseJsonFields(bookingItems, ["item_details"]);

    res.status(200).json(processedBookings);
  } catch (error) {
    console.error("Error fetching completed hotel bookings:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch completed bookings",
        error: error.message,
      });
  }
};

/**
 * Get completed transport bookings
 */
exports.getTransportBookingsCompleted = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get all transport routes owned by this travel agent
    const [routes] = await db.query(
      "SELECT id FROM transports WHERE agency_id = ?",
      [userId],
    );

    if (routes.length === 0) {
      return res.status(200).json([]);
    }

    const routeIds = routes.map((route) => route.id);
    const placeholders = routeIds.map(() => "?").join(",");

    // Get completed transport bookings
    const [bookingItems] = await db.query(
      `SELECT
        bi.id, bi.booking_id, bi.item_type, bi.id as route_id, bi.cost, bi.item_details,
        b.start_date, b.end_date, b.status, b.total_cost,
        u.email as tourist_email, u.phone_number as tourist_phone, b.tourist_full_name as tourist_name,
        to_orig.name as origin_name, d.name as destination_name, t.transportation_type
       FROM booking_items bi
       JOIN bookings b ON bi.booking_id = b.id
       JOIN users u ON b.tourist_user_id = u.id
       JOIN transports t ON bi.id = t.id
       JOIN transport_origins to_orig ON t.origin_id = to_orig.id
       JOIN destinations d ON t.destination_id = d.id
       WHERE bi.item_type = 'transport'
       AND bi.id IN (${placeholders})
       AND bi.item_details IS NOT NULL
       AND JSON_EXTRACT(bi.item_details, '$.ticket_assigned') = true
       ORDER BY b.id DESC`,
      routeIds,
    );

    // Parse item_details JSON if it exists
    const processedBookings = parseJsonFields(bookingItems, ["item_details"]);

    res.status(200).json(processedBookings);
  } catch (error) {
    console.error("Error fetching completed transport bookings:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch completed bookings",
        error: error.message,
      });
  }
};

/**
 * Helper function to check if all booking items are confirmed and update booking status
 */
const checkAndUpdateBookingCompletion = async (bookingId) => {
  try {
    // Get all booking items for this booking
    const [items] = await db.query(
      `SELECT provider_status, item_type FROM booking_items
       WHERE booking_id = ?`,
      [bookingId],
    );

    if (items.length === 0) return;

    // Check if all items are confirmed
    const allConfirmed = items.every(
      (item) => item.provider_status === "confirmed",
    );

    if (allConfirmed) {
      // Update booking status to completed if all services are confirmed
      await db.query(
        `UPDATE bookings SET status = 'completed'
         WHERE id = ? AND status = 'confirmed'`,
        [bookingId],
      );
    }
  } catch (error) {
    console.error("Error checking booking completion:", error);
    // Don't throw error as this is a helper function
  }
};

/**
 * Get detailed booking information for tour guide
 */
exports.getGuideBookingDetails = async (req, res) => {
  const userId = req.user.id;
  const { bookingId } = req.params;

  try {
    // Verify that this guide is assigned to this booking
    const [authCheck] = await db.query(
      `SELECT bi.id
       FROM booking_items bi
       WHERE bi.booking_id = ? AND bi.item_type = 'tour_guide' AND bi.id = ?`,
      [bookingId, userId],
    );

    if (authCheck.length === 0) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this booking" });
    }

    // Get comprehensive booking details
    const [bookingDetails] = await db.query(
      `SELECT b.id, b.total_cost, b.status, b.start_date, b.end_date,
              u.id as tourist_id, u.email as tourist_email, u.phone_number as tourist_phone,
              d.id as destination_id, d.name as destination_name,
              d.description as destination_description
       FROM bookings b
       JOIN users u ON b.tourist_user_id = u.id
       JOIN destinations d ON b.destination_id = d.id
       WHERE b.id = ?`,
      [bookingId],
    );

    if (bookingDetails.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = bookingDetails[0];

    // Get all booking items with details
    const [bookingItems] = await db.query(
      `SELECT bi.id, bi.item_type, bi.cost, bi.provider_status, bi.item_details,
              CASE
                WHEN bi.item_type = 'hotel' THEN h.name
                WHEN bi.item_type = 'activity' THEN a.name
                WHEN bi.item_type = 'transport' THEN CONCAT(to_orig.name, ' to ', dest.name)
                WHEN bi.item_type = 'tour_guide' THEN tg.full_name
                ELSE 'Unknown'
              END as item_name,
              CASE
                WHEN bi.item_type = 'hotel' THEN d_hotel.name
                WHEN bi.item_type = 'activity' THEN a.description
                WHEN bi.item_type = 'transport' THEN 'Transport'
                WHEN bi.item_type = 'tour_guide' THEN d_tg.name
                ELSE 'N/A'
              END as item_description
       FROM booking_items bi
       LEFT JOIN hotels h ON bi.item_type = 'hotel' AND bi.id = h.id
       LEFT JOIN destinations d_hotel ON bi.item_type = 'hotel' AND h.destination_id = d_hotel.id
       LEFT JOIN activities a ON bi.item_type = 'activity' AND bi.id = a.id
       LEFT JOIN transports t ON bi.item_type = 'transport' AND bi.id = t.id
       LEFT JOIN transport_origins to_orig ON bi.item_type = 'transport' AND t.origin_id = to_orig.id
       LEFT JOIN destinations dest ON bi.item_type = 'transport' AND t.destination_id = dest.id
       LEFT JOIN tour_guides tg ON bi.item_type = 'tour_guide' AND bi.id = tg.user_id
       LEFT JOIN destinations d_tg ON bi.item_type = 'tour_guide' AND tg.destination_id = d_tg.id
       WHERE bi.booking_id = ?
       ORDER BY bi.item_type`,
      [bookingId],
    );

    // Parse JSON fields and group items by type
    const parsedItems = parseJsonFields(bookingItems, ["item_details"]);
    const itemsByType = {
      hotel: parsedItems.filter((item) => item.item_type === "hotel"),
      activities: parsedItems.filter((item) => item.item_type === "activity"),
      transport: parsedItems.filter((item) => item.item_type === "transport"),
      tour_guide: parsedItems.filter((item) => item.item_type === "tour_guide"),
    };

    // Calculate additional metrics
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const durationDays = Math.ceil(
      (endDate - startDate) / (1000 * 60 * 60 * 24),
    );

    const currentDate = new Date();
    let bookingStatus = "upcoming";
    if (currentDate > endDate) {
      bookingStatus = "completed";
    } else if (currentDate >= startDate && currentDate <= endDate) {
      bookingStatus = "ongoing";
    }

    const response = {
      ...booking,
      duration_days: durationDays,
      booking_status: bookingStatus,
      items: itemsByType,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch booking details",
        error: error.message,
      });
  }
};
