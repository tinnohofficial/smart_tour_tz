const db = require("../config/db");

/**
 * Helper function to safely parse JSON fields in objects
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
          console.log(`Failed to parse ${field} as JSON:`, e.message);
        }
      }
    });
    
    return newItem;
  });
};

/**
 * Get or create active cart for user
 */
exports.getActiveCart = async (req, res) => {
  const userId = req.user.id;

  try {
    // First try to find an active cart
    let [carts] = await db.query(
      "SELECT * FROM booking_carts WHERE tourist_user_id = ? AND status = 'active'",
      [userId]
    );

    let cart;
    if (carts.length === 0) {
      // Create a new cart if none exists
      const [result] = await db.query(
        "INSERT INTO booking_carts (tourist_user_id, total_cost, status) VALUES (?, 0.00, 'active')",
        [userId]
      );
      
      // Fetch the newly created cart
      [carts] = await db.query(
        "SELECT * FROM booking_carts WHERE id = ?",
        [result.insertId]
      );
    }

    cart = carts[0];

    // Get all bookings in this cart
    const [bookings] = await db.query(
      `SELECT b.*, d.name as destination_name, d.image_url
       FROM bookings b
       LEFT JOIN destinations d ON b.destination_id = d.id
       WHERE b.cart_id = ? AND b.status = 'in_cart'
       ORDER BY b.id ASC`,
      [cart.id]
    );

    // For each booking, get its items
    for (let booking of bookings) {
      const [items] = await db.query(
        `SELECT bi.*,
         CASE
           WHEN bi.item_type = 'hotel' THEN h.name
           WHEN bi.item_type = 'transport' THEN CONCAT(to_orig.name, ' to ', d.name)
           WHEN bi.item_type = 'tour_guide' THEN tg.full_name
           WHEN bi.item_type = 'activity' THEN a.name
         END as item_name
         FROM booking_items bi
         LEFT JOIN hotels h ON bi.item_type = 'hotel' AND bi.id = h.id
         LEFT JOIN transports tr ON bi.item_type = 'transport' AND bi.id = tr.id
         LEFT JOIN transport_origins to_orig ON bi.item_type = 'transport' AND tr.origin_id = to_orig.id
         LEFT JOIN destinations d ON bi.item_type = 'transport' AND tr.destination_id = d.id
         LEFT JOIN tour_guides tg ON bi.item_type = 'tour_guide' AND bi.id = tg.user_id
         LEFT JOIN activities a ON bi.item_type = 'activity' AND bi.id = a.id
         WHERE bi.booking_id = ?`,
        [booking.id]
      );

      booking.items = parseJsonFields(items, ['item_details']);
    }

    cart.bookings = bookings;

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Failed to fetch cart", error: error.message });
  }
};

/**
 * Add a booking to cart
 */
exports.addToCart = async (req, res) => {
  const { 
    transportId, 
    hotelId, 
    activityIds, 
    activitySessions = {},
    startDate, 
    endDate, 
    destinationId,
    includeTransport = true,
    includeHotel = true,
    includeActivities = true
  } = req.body;
  const userId = req.user.id;

  // Validate date inputs
  if (!startDate || !endDate) {
    return res.status(400).json({ message: "Start date and end date are required" });
  }

  if (!includeTransport && !includeHotel && !includeActivities) {
    return res.status(400).json({ message: "At least one service must be included" });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ message: "Invalid date format" });
  }

  if (start < currentDate) {
    return res.status(400).json({ message: "Start date cannot be in the past" });
  }

  if (end <= start) {
    return res.status(400).json({ message: "End date must be after start date" });
  }

  const daysBooked = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (daysBooked > 30) {
    return res.status(400).json({ message: "Booking duration cannot exceed 30 days" });
  }

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Get or create active cart
      let [carts] = await connection.query(
        "SELECT * FROM booking_carts WHERE tourist_user_id = ? AND status = 'active'",
        [userId]
      );

      let cartId;
      if (carts.length === 0) {
        const [cartResult] = await connection.query(
          "INSERT INTO booking_carts (tourist_user_id, total_cost, status) VALUES (?, 0.00, 'active')",
          [userId]
        );
        cartId = cartResult.insertId;
      } else {
        cartId = carts[0].id;
      }

      // Calculate total cost for this booking
      let totalCost = 0;
      const selectedItems = [];

      // Check transport
      if (includeTransport && transportId) {
        const [transportRows] = await connection.query(
          "SELECT id, cost FROM transports WHERE id = ?",
          [transportId]
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

      // Check hotel
      if (includeHotel && hotelId) {
        const [hotelRows] = await connection.query(
          "SELECT id, base_price_per_night FROM hotels WHERE id = ?",
          [hotelId]
        );

        if (hotelRows.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ message: "Hotel not found" });
        }

        const hotel = hotelRows[0];
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const hotelCost = parseFloat(hotel.base_price_per_night) * Math.max(1, nights);
        totalCost += hotelCost;

        selectedItems.push({
          type: "hotel",
          id: hotel.id,
          cost: hotelCost,
          nights: nights,
        });
      }

      // Add tour guide placeholder
      selectedItems.push({
        type: "placeholder",
        id: 0,
        cost: 0,
        details: {
          type: "tour_guide_placeholder",
          message: "Tour guide will be assigned by admin"
        }
      });

      // Check activities
      if (includeActivities && activityIds && Array.isArray(activityIds) && activityIds.length > 0) {
        const placeholders = activityIds.map(() => "?").join(",");
        
        const [activityRows] = await connection.query(
          `SELECT a.id, a.price, a.destination_id,
                  d.cost as destination_cost, d.name as destination_name 
           FROM activities a
           JOIN destinations d ON a.destination_id = d.id
           WHERE a.id IN (${placeholders})`,
          activityIds,
        );

        if (activityRows.length !== activityIds.length) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ message: "One or more activities not found" });
        }

        // Validate activity schedules
        for (const activity of activityRows) {
          const activityId = activity.id;
          const sessions = activitySessions[activityId] || 1;
          
          if (!Number.isInteger(sessions) || sessions < 1) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ 
              message: `Invalid number of sessions for activity "${activity.destination_name}". Must be a positive integer.` 
            });
          }
        }

        const includedDestinations = new Set();
        
        for (const activity of activityRows) {
          const sessions = activitySessions[activity.id] || 1;
          const activityCost = parseFloat(activity.price) * sessions;
          
          totalCost += activityCost;
          
          selectedItems.push({
            type: "activity",
            id: activity.id,
            cost: activityCost,
            sessions: sessions
          });
          
          if (activity.destination_id && !includedDestinations.has(activity.destination_id)) {
            const destinationCostPerDay = parseFloat(activity.destination_cost) || 0;
            if (destinationCostPerDay > 0) {
              const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
              const totalDestinationCost = destinationCostPerDay * Math.max(1, days);
              
              totalCost += totalDestinationCost;
              selectedItems.push({
                type: "placeholder",
                id: activity.destination_id,
                cost: totalDestinationCost,
                details: {
                  type: "destination_fee",
                  destination_id: activity.destination_id,
                  destination_name: activity.destination_name,
                  cost_per_day: destinationCostPerDay,
                  days: Math.max(1, days),
                  message: `Fee for access to ${activity.destination_name} (${destinationCostPerDay}/day × ${Math.max(1, days)} days)`
                }
              });
            }
            includedDestinations.add(activity.destination_id);
          }
        }
      }

      // Create booking in cart
      const [bookingResult] = await connection.query(
        `INSERT INTO bookings (
          cart_id,
          tourist_user_id, 
          start_date, 
          end_date, 
          destination_id, 
          total_cost, 
          include_transport, 
          include_hotel, 
          include_activities, 
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_cart')`,
        [
          cartId,
          userId, 
          startDate, 
          endDate, 
          destinationId, 
          totalCost, 
          includeTransport, 
          includeHotel, 
          includeActivities
        ]
      );

      const bookingId = bookingResult.insertId;

      // Create booking items
      for (const item of selectedItems) {
        if (item.type === 'placeholder' && item.details) {
          await connection.query(
            `INSERT INTO booking_items (id, booking_id, item_type, cost, provider_status, item_details)
             VALUES (?, ?, ?, ?, 'pending', ?)`,
            [item.id, bookingId, item.type, item.cost, JSON.stringify(item.details)]
          );
        } else if (item.type === 'activity' && item.sessions) {
          await connection.query(
            `INSERT INTO booking_items (id, booking_id, item_type, cost, provider_status, sessions)
             VALUES (?, ?, ?, ?, 'pending', ?)`,
            [item.id, bookingId, item.type, item.cost, item.sessions]
          );
        } else {
          await connection.query(
            `INSERT INTO booking_items (id, booking_id, item_type, cost, provider_status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [item.id, bookingId, item.type, item.cost]
          );
        }
      }

      // Update cart total
      await connection.query(
        "UPDATE booking_carts SET total_cost = total_cost + ? WHERE id = ?",
        [totalCost, cartId]
      );

      await connection.commit();
      connection.release();
      
      res.status(201).json({
        message: "Booking added to cart successfully",
        bookingId,
        cartId,
        totalCost,
        flexibleOptions: {
          includeTransport,
          includeHotel,
          includeActivities
        }
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Failed to add booking to cart", error: error.message });
  }
};

/**
 * Remove booking from cart
 */
exports.removeFromCart = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Verify the booking belongs to the user and is in cart
      const [bookings] = await connection.query(
        `SELECT b.*, c.id as cart_id 
         FROM bookings b 
         JOIN booking_carts c ON b.cart_id = c.id
         WHERE b.id = ? AND b.tourist_user_id = ? AND b.status = 'in_cart'`,
        [bookingId, userId]
      );

      if (bookings.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: "Booking not found in cart" });
      }

      const booking = bookings[0];

      // Update cart total by subtracting this booking's cost
      await connection.query(
        "UPDATE booking_carts SET total_cost = total_cost - ? WHERE id = ?",
        [booking.total_cost, booking.cart_id]
      );

      // Delete booking items first (due to foreign key constraint)
      await connection.query(
        "DELETE FROM booking_items WHERE booking_id = ?",
        [bookingId]
      );

      // Delete the booking
      await connection.query(
        "DELETE FROM bookings WHERE id = ?",
        [bookingId]
      );

      await connection.commit();
      connection.release();

      res.status(200).json({ message: "Booking removed from cart successfully" });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Failed to remove booking from cart", error: error.message });
  }
};

/**
 * Checkout cart - process payment for all bookings in cart
 */
exports.checkoutCart = async (req, res) => {
  const { paymentMethod, stripePaymentMethodId, walletSignature } = req.body;
  const userId = req.user.id;

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Get active cart with bookings
      const [carts] = await connection.query(
        "SELECT * FROM booking_carts WHERE tourist_user_id = ? AND status = 'active'",
        [userId]
      );

      if (carts.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: "No active cart found" });
      }

      const cart = carts[0];

      if (cart.total_cost <= 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Get user's savings balance
      const [savingsRows] = await connection.query(
        "SELECT balance FROM savings_accounts WHERE user_id = ?",
        [userId]
      );

      let userBalance = 0;
      if (savingsRows.length > 0) {
        userBalance = parseFloat(savingsRows[0].balance);
      }

      let paymentReference = '';
      const paymentAmount = cart.total_cost;

      // Process payment based on method
      if (paymentMethod === 'savings') {
        if (userBalance < paymentAmount) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ 
            message: "Insufficient savings balance",
            required: paymentAmount,
            available: userBalance
          });
        }

        // Deduct from savings
        if (savingsRows.length > 0) {
          await connection.query(
            "UPDATE savings_accounts SET balance = balance - ? WHERE user_id = ?",
            [paymentAmount, userId]
          );
        }

        paymentReference = `SAVINGS_${Date.now()}`;

      } else if (paymentMethod === 'crypto') {
        // Simple crypto payment processing
        const walletAddress = req.body.walletAddress;

        if (!walletAddress) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ message: "Wallet address is required for crypto payments" });
        }

        // Generate simple payment reference
        paymentReference = `CRYPTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      } else if (paymentMethod === 'stripe') {
        // Stripe payment would be handled here
        paymentReference = stripePaymentMethodId || `STRIPE_${Date.now()}`;

      } else {
        paymentReference = `EXTERNAL_${Date.now()}`;
      }

      // Create payment record
      await connection.query(
        `INSERT INTO payments (cart_id, user_id, amount, payment_method, reference, status)
         VALUES (?, ?, ?, ?, ?, 'successful')`,
        [cart.id, userId, paymentAmount, paymentMethod, paymentReference]
      );

      // Update cart status
      await connection.query(
        "UPDATE booking_carts SET status = 'confirmed' WHERE id = ?",
        [cart.id]
      );

      // Update all bookings in cart
      await connection.query(
        "UPDATE bookings SET status = 'confirmed' WHERE cart_id = ? AND status = 'in_cart'",
        [cart.id]
      );

      await connection.commit();
      connection.release();

      res.status(200).json({
        message: "Cart checkout successful",
        cartId: cart.id,
        totalAmount: paymentAmount,
        paymentMethod,
        paymentReference
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error during cart checkout:", error);
    res.status(500).json({ message: "Cart checkout failed", error: error.message });
  }
};

/**
 * Clear cart - remove all bookings from active cart
 */
exports.clearCart = async (req, res) => {
  const userId = req.user.id;

  try {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Get active cart
      const [carts] = await connection.query(
        "SELECT * FROM booking_carts WHERE tourist_user_id = ? AND status = 'active'",
        [userId]
      );

      if (carts.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: "No active cart found" });
      }

      const cartId = carts[0].id;

      // Get all bookings in cart
      const [bookings] = await connection.query(
        "SELECT id FROM bookings WHERE cart_id = ? AND status = 'in_cart'",
        [cartId]
      );

      // Delete booking items for all bookings
      for (const booking of bookings) {
        await connection.query(
          "DELETE FROM booking_items WHERE booking_id = ?",
          [booking.id]
        );
      }

      // Delete all bookings in cart
      await connection.query(
        "DELETE FROM bookings WHERE cart_id = ? AND status = 'in_cart'",
        [cartId]
      );

      // Reset cart total
      await connection.query(
        "UPDATE booking_carts SET total_cost = 0.00 WHERE id = ?",
        [cartId]
      );

      await connection.commit();
      connection.release();

      res.status(200).json({ message: "Cart cleared successfully" });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Failed to clear cart", error: error.message });
  }
};
