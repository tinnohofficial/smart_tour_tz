const db = require("../config/db");

/**
 * Store user payment method details securely (only non-sensitive data)
 * F5.1: Store credit card details for payment
 */
const addPaymentMethod = async (req, res) => {
  try {
    const { paymentToken, last4, cardBrand, expiryMonth, expiryYear } =
      req.body;
    const userId = req.user.id;

    // In a real app, you'd interact with a payment gateway service to store the actual card details
    // Here we'll just store the token and non-sensitive metadata
    const query = `
      INSERT INTO user_payment_methods (user_id, payment_type, gateway_token, last_four_digits, brand, expiry_month, expiry_year)
      VALUES (?, 'credit_card', ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      userId,
      paymentToken,
      last4,
      cardBrand,
      expiryMonth,
      expiryYear,
    ]);

    res.status(201).json({
      message: "Payment method added successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error adding payment method:", error);
    res
      .status(500)
      .json({ message: "Failed to add payment method", error: error.message });
  }
};

/**
 * Get all payment methods for the authenticated user
 */
const getUserPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT id, payment_type, last_four_digits, brand, expiry_month, expiry_year, created_at
      FROM user_payment_methods
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    const [result] = await db.query(query, [userId]);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting payment methods:", error);
    res
      .status(500)
      .json({ message: "Failed to get payment methods", error: error.message });
  }
};

/**
 * Process a payment for a booking
 * F5.4/F5.5: Make instant/discounted payments for services
 */
const processBookingPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentMethod, paymentMethodId } = req.body;
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

      const [bookingResult] = await connection.query(bookingQuery, [bookingId, userId]);

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
      let transactionId = null;

      switch (paymentMethod) {
        case "card":
          // In a real app: Use payment gateway API to charge the card
          if (!paymentMethodId) {
            await connection.rollback();
            connection.release();
            return res
              .status(400)
              .json({ message: "Payment method ID required for card payment" });
          }

          // Check if payment method exists, belongs to user, and is not expired
          const cardQuery = `
            SELECT id, expiry_month, expiry_year 
            FROM user_payment_methods
            WHERE id = ? AND user_id = ?
          `;
          const [cardResult] = await connection.query(cardQuery, [
            paymentMethodId,
            userId,
          ]);

          if (cardResult.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ message: "Payment method not found" });
          }
          
          // Check if card is expired
          const card = cardResult[0];
          const currentDate = new Date();
          const currentYear = currentDate.getFullYear();
          const currentMonth = currentDate.getMonth() + 1; // JS months are 0-indexed
          
          const expiryYear = parseInt(card.expiry_year);
          const expiryMonth = parseInt(card.expiry_month);
          
          if (expiryYear < currentYear || 
              (expiryYear === currentYear && expiryMonth < currentMonth)) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ message: "Payment method has expired" });
          }

          // Simulate successful payment
          paymentSuccess = true;
          paymentReference = `CARD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          break;

        case "savings_fiat":
          // Check user's savings balance
          const balanceQuery = `
            SELECT balance_usd FROM savings_accounts
            WHERE user_id = ?
          `;
          const [balanceResult] = await connection.query(balanceQuery, [userId]);

          if (balanceResult.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ message: "Savings account not found" });
          }

          const balance = parseFloat(balanceResult[0].balance_usd);

          if (balance < booking.total_cost) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
              message: "Insufficient funds in savings account",
              balance,
              required: booking.total_cost,
            });
          }

          // Update balance
          await connection.query(
            "UPDATE savings_accounts SET balance_usd = balance_usd - ? WHERE user_id = ?",
            [booking.total_cost, userId],
          );

          // Create savings transaction record
          const [savingsTransactionResult] = await connection.query(
            `INSERT INTO savings_transactions
             (user_id, type, amount_usd, description, is_crypto, token_type)
             VALUES (?, 'payment', ?, ?, FALSE, NULL)`,
            [userId, booking.total_cost, `Payment for booking #${bookingId}`],
          );
          
          transactionId = savingsTransactionResult.insertId;
          paymentSuccess = true;
          paymentReference = `SAVINGS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          break;

        case "savings_crypto":
          // This case handles payments from the user's USDT balance stored in the smart contract
          
          // First, check if wallet is configured
          const walletQuery = `
            SELECT wallet_address FROM user_crypto_balances
            WHERE user_id = ?
          `;
          const [walletResult] = await connection.query(walletQuery, [userId]);

          if (walletResult.length === 0 || !walletResult[0].wallet_address) {
            await connection.rollback();
            connection.release();
            return res
              .status(404)
              .json({ message: "Crypto wallet not configured" });
          }
          
          const walletAddress = walletResult[0].wallet_address;
          
          // In a real implementation:
          // 1. We would call the smart contract to verify the USDT balance
          // 2. We would then initiate a transaction to transfer the USDT from user to platform
          
          // For now, we'll continue using the local balance representation for demo purposes
          // but with the understanding that the real balance is in the smart contract
          const cryptoBalanceQuery = `
            SELECT crypto_balance FROM user_crypto_balances
            WHERE user_id = ?
          `;
          const [cryptoResult] = await connection.query(cryptoBalanceQuery, [userId]);
          
          if (cryptoResult.length === 0) {
            await connection.rollback();
            connection.release();
            return res
              .status(404)
              .json({ message: "Crypto wallet not configured" });
          }

          const cryptoBalance = parseFloat(cryptoResult[0].crypto_balance);

          if (cryptoBalance < booking.total_cost) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({
              message: "Insufficient USDT balance",
              balance: cryptoBalance,
              required: booking.total_cost,
            });
          }

          // Update local balance representation
          // Note: In production, this would be a call to verify the transaction on the blockchain
          // and we would wait for confirmation before proceeding
          await connection.query(
            "UPDATE user_crypto_balances SET crypto_balance = crypto_balance - ? WHERE user_id = ?",
            [booking.total_cost, userId],
          );

          // Create transaction record - using USDT as the token type since all crypto is converted to USDT
          const [cryptoTransactionResult] = await connection.query(
            `INSERT INTO savings_transactions
             (user_id, type, amount_usd, description, is_crypto, token_type)
             VALUES (?, 'payment', ?, ?, TRUE, 'USDT')`,
            [
              userId,
              booking.total_cost,
              `USDT payment for booking #${bookingId}`,
            ],
          );
          
          transactionId = cryptoTransactionResult.insertId;
          paymentSuccess = true;
          paymentReference = `CRYPTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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
          (booking_id, user_id, amount, payment_method, reference, status, transaction_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const [paymentResult] = await connection.query(paymentQuery, [
          bookingId,
          userId,
          booking.total_cost,
          paymentMethod,
          paymentReference,
          "successful",
          transactionId
        ]);
        
        // Update activity status for all activities in this booking to 'booked'
        // This prevents overbooking of activities
        const [activityItems] = await connection.query(
          `SELECT item_id FROM booking_items 
           WHERE booking_id = ? AND item_type = 'activity'`,
          [bookingId]
        );
        
        // If there are activities in the booking, update their status
        if (activityItems && activityItems.length > 0) {
          const activityIds = activityItems.map(item => item.item_id);
          
          // Update each activity status from 'pending' to 'booked' now that payment is confirmed
          for (const activityId of activityIds) {
            await connection.query(
              `UPDATE activities 
               SET status = 'booked' 
               WHERE id = ? AND status = 'pending'`,
              [activityId]
            );
          }
        }

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
        // Release any pending activities if payment fails
        const [activityItems] = await connection.query(
          `SELECT item_id FROM booking_items 
           WHERE booking_id = ? AND item_type = 'activity'`,
          [bookingId]
        );
        
        // If there are activities in the booking, restore their status to available
        if (activityItems && activityItems.length > 0) {
          const activityIds = activityItems.map(item => item.item_id);
          
          // Restore each activity status from 'pending' to 'available'
          for (const activityId of activityIds) {
            await connection.query(
              `UPDATE activities 
               SET status = 'available' 
               WHERE id = ? AND status = 'pending'`,
              [activityId]
            );
          }
        }
        
        await connection.rollback();
        connection.release();
        res.status(500).json({ message: "Payment processing failed" });
      }
    } catch (error) {
      // Release any pending activities if an error occurs
      try {
        const [activityItems] = await connection.query(
          `SELECT item_id FROM booking_items 
           WHERE booking_id = ? AND item_type = 'activity'`,
          [bookingId]
        );
        
        if (activityItems && activityItems.length > 0) {
          const activityIds = activityItems.map(item => item.item_id);
          
          for (const activityId of activityIds) {
            await connection.query(
              `UPDATE activities 
               SET status = 'available' 
               WHERE id = ? AND status = 'pending'`,
              [activityId]
            );
          }
        }
      } catch (cleanupError) {
        console.error("Error releasing activities:", cleanupError);
      }
      
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

module.exports = {
  addPaymentMethod,
  getUserPaymentMethods,
  processBookingPayment,
};
