const db = require("../config/db");

/**
 * Create a booking (save as pending payment) (F6.7)
 */
exports.createBooking = async (req, res) => {
  const { transportId, hotelId, guideId, activityIds, startDate, endDate } =
    req.body;
  const userId = req.user.id;

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
          "SELECT id, price FROM transport_routes WHERE id = ?",
          [transportId],
        );

        if (transportRows.length === 0) {
          return res.status(404).json({ message: "Transport route not found" });
        }

        const transport = transportRows[0];
        totalCost += parseFloat(transport.price);
        selectedItems.push({
          type: "transport",
          id: transport.id,
          cost: transport.price,
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
        const start = new Date(startDate);
        const end = new Date(endDate);
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

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

      // Check and calculate cost for guide
      if (guideId) {
        const [guideRows] = await connection.query(
          `SELECT u.id, tg.expertise
           FROM users u
           JOIN tour_guides tg ON u.id = tg.user_id
           WHERE u.id = ? AND u.role = 'tour_guide' AND u.status = 'active'`,
          [guideId],
        );

        if (guideRows.length === 0) {
          return res.status(404).json({ message: "Tour guide not found" });
        }

        // Assuming a fixed cost per day for guide services
        const guideCostPerDay = 50; // This could be stored in the tour_guides table instead
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        const guideCost = guideCostPerDay * Math.max(1, days);
        totalCost += guideCost;

        selectedItems.push({
          type: "tour_guide",
          id: guideRows[0].id,
          cost: guideCost,
          days: days,
        });
      }

      // Check and calculate cost for activities
      if (activityIds && Array.isArray(activityIds) && activityIds.length > 0) {
        const placeholders = activityIds.map(() => "?").join(",");
        const [activityRows] = await connection.query(
          `SELECT id, price FROM activities WHERE id IN (${placeholders})`,
          activityIds,
        );

        if (activityRows.length !== activityIds.length) {
          return res
            .status(404)
            .json({ message: "One or more activities not found" });
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
        await connection.query(
          `INSERT INTO booking_items (booking_id, item_type, item_id, cost, provider_status)
           VALUES (?, ?, ?, ?, 'pending')`,
          [bookingId, item.type, item.id, item.cost],
        );
      }

      await connection.commit();
      res.status(201).json({
        message: "Booking created successfully",
        bookingId,
        totalCost,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error creating booking:", error);
    res
      .status(500)
      .json({ message: "Failed to create booking", error: error.message });
  }
};

/**
 * Process payment for a booking
 * Related to F5.4/F5.5
 */
exports.processBookingPayment = async (req, res) => {
  const { bookingId } = req.params;
  const { paymentMethod, paymentMethodId } = req.body;
  const userId = req.user.id;

  try {
    // Check if booking exists and belongs to this user
    const [bookingRows] = await db.query(
      `SELECT * FROM bookings
       WHERE id = ? AND tourist_user_id = ? AND status = 'pending_payment'`,
      [bookingId, userId],
    );

    if (bookingRows.length === 0) {
      return res.status(404).json({
        message:
          "Booking not found or not in pending payment status or does not belong to you",
      });
    }

    const booking = bookingRows[0];
    const totalCost = parseFloat(booking.total_cost);

    // Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      let paymentSuccessful = false;

      if (paymentMethod === "card") {
        // Process card payment
        if (!paymentMethodId) {
          return res.status(400).json({
            message: "Payment method ID is required for card payments",
          });
        }

        const [paymentMethodRows] = await connection.query(
          "SELECT * FROM user_payment_methods WHERE id = ? AND user_id = ?",
          [paymentMethodId, userId],
        );

        if (paymentMethodRows.length === 0) {
          return res.status(404).json({ message: "Payment method not found" });
        }

        // In a real system, here we would call the payment gateway API
        // For this example, we'll simulate a successful payment
        paymentSuccessful = true;
      } else if (paymentMethod === "savings_fiat") {
        // Check if user has enough savings balance
        const [savingsRows] = await connection.query(
          "SELECT balance_usd FROM savings_accounts WHERE user_id = ?",
          [userId],
        );

        // If user doesn't have a savings account yet, return error
        if (savingsRows.length === 0) {
          return res
            .status(400)
            .json({ message: "You do not have a savings account" });
        }

        const balance = parseFloat(savingsRows[0].balance_usd);

        if (balance < totalCost) {
          return res.status(400).json({
            message: "Insufficient savings balance",
            required: totalCost,
            available: balance,
          });
        }

        // Deduct from savings balance
        await connection.query(
          "UPDATE savings_accounts SET balance_usd = balance_usd - ? WHERE user_id = ?",
          [totalCost, userId],
        );

        // Create savings transaction record
        await connection.query(
          `INSERT INTO savings_transactions
           (user_id, amount, currency, type, description)
           VALUES (?, ?, 'USD', 'payment', ?)`,
          [userId, totalCost, `Payment for booking #${bookingId}`],
        );

        paymentSuccessful = true;
      } else if (paymentMethod === "savings_crypto") {
        // For crypto payments, we would integrate with a blockchain
        // This is a simplified implementation

        // In a real system, we would check the user's crypto balance from the blockchain
        // or from our internal records of their deposits

        // For this example, we'll simulate a successful payment
        paymentSuccessful = true;
      } else {
        return res.status(400).json({ message: "Invalid payment method" });
      }

      // If payment was successful, update booking status
      if (paymentSuccessful) {
        await connection.query(
          "UPDATE bookings SET status = 'confirmed' WHERE id = ?",
          [bookingId],
        );

        // Create payment record
        await connection.query(
          `INSERT INTO payments
           (booking_id, user_id, amount, payment_method, status, reference)
           VALUES (?, ?, ?, ?, 'successful', ?)`,
          [
            bookingId,
            userId,
            totalCost,
            paymentMethod,
            `${paymentMethod}_${Date.now()}`,
          ],
        );

        await connection.commit();
        res
          .status(200)
          .json({ message: "Payment processed and booking confirmed" });
      } else {
        throw new Error("Payment processing failed");
      }
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    res
      .status(500)
      .json({ message: "Failed to process payment", error: error.message });
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
         LEFT JOIN transport_routes tr ON bi.item_type = 'transport' AND bi.item_id = tr.id
         LEFT JOIN tour_guides tg ON bi.item_type = 'tour_guide' AND bi.item_id = tg.user_id
         LEFT JOIN activities a ON bi.item_type = 'activity' AND bi.item_id = a.id
         WHERE bi.booking_id = ?`,
        [bookings[i].id],
      );

      // Parse item_details JSON if it exists
      items.forEach((item) => {
        if (item.item_details) {
          try {
            item.item_details = JSON.parse(item.item_details);
          } catch (e) {
            // Keep as is if parsing fails
          }
        }
      });

      bookings[i].items = items;
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
    const [bookingItems] = await db.query(
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
    bookingItems.forEach((item) => {
      if (item.item_details) {
        try {
          item.item_details = JSON.parse(item.item_details);
        } catch (e) {
          // Keep as is if parsing fails
        }
      }
    });

    res.status(200).json(bookingItems);
  } catch (error) {
    console.error("Error fetching tour guide bookings:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
};
