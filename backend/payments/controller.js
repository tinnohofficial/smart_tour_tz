// filepath: /Users/tinnoh/fyp/backend/payments/controller.js
const db = require('../config/db');

/**
 * Store user payment method details securely (only non-sensitive data)
 * F5.1: Store credit card details for payment
 */
const addPaymentMethod = async (req, res) => {
  try {
    const { paymentToken, last4, cardBrand, expiryMonth, expiryYear } = req.body;
    const userId = req.user.id;

    // In a real app, you'd interact with a payment gateway service to store the actual card details
    // Here we'll just store the token and non-sensitive metadata
    const query = `
      INSERT INTO user_payment_methods (user_id, payment_type, gateway_token, last_four_digits, brand, expiry_month, expiry_year)
      VALUES ($1, 'credit_card', $2, $3, $4, $5, $6)
      RETURNING id, created_at
    `;

    const result = await db.query(query, [userId, paymentToken, last4, cardBrand, expiryMonth, expiryYear]);

    res.status(201).json({
      message: 'Payment method added successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ message: 'Failed to add payment method', error: error.message });
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
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [userId]);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({ message: 'Failed to get payment methods', error: error.message });
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
    
    // 1. Fetch booking details and verify it's pending payment
    const bookingQuery = `
      SELECT b.id, b.total_cost, b.status 
      FROM bookings b
      WHERE b.id = $1 AND b.tourist_user_id = $2
    `;
    
    const bookingResult = await db.query(bookingQuery, [bookingId, userId]);
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    if (booking.status !== 'pending_payment') {
      return res.status(400).json({ 
        message: 'Invalid booking status for payment processing', 
        status: booking.status 
      });
    }
    
    // Payment processing logic based on payment method
    let paymentSuccess = false;
    let paymentReference = '';
    
    switch (paymentMethod) {
      case 'card':
        // In a real app: Use payment gateway API to charge the card
        if (!paymentMethodId) {
          return res.status(400).json({ message: 'Payment method ID required for card payment' });
        }
        
        // Check if payment method exists and belongs to user
        const cardQuery = `
          SELECT id FROM user_payment_methods 
          WHERE id = $1 AND user_id = $2
        `;
        const cardResult = await db.query(cardQuery, [paymentMethodId, userId]);
        
        if (cardResult.rows.length === 0) {
          return res.status(404).json({ message: 'Payment method not found' });
        }
        
        // Simulate successful payment
        paymentSuccess = true;
        paymentReference = `CARD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        break;
        
      case 'savings_fiat':
        // Check user's savings balance
        const balanceQuery = `
          SELECT balance_usd FROM savings_accounts 
          WHERE user_id = $1
        `;
        const balanceResult = await db.query(balanceQuery, [userId]);
        
        if (balanceResult.rows.length === 0) {
          return res.status(404).json({ message: 'Savings account not found' });
        }
        
        const balance = parseFloat(balanceResult.rows[0].balance_usd);
        
        if (balance < booking.total_cost) {
          return res.status(400).json({ 
            message: 'Insufficient funds in savings account',
            balance,
            required: booking.total_cost
          });
        }
        
        // Update balance
        await db.query(
          'UPDATE savings_accounts SET balance_usd = balance_usd - $1 WHERE user_id = $2',
          [booking.total_cost, userId]
        );
        
        // Create savings transaction record
        await db.query(
          `INSERT INTO savings_transactions 
           (user_id, type, amount_usd, description) 
           VALUES ($1, 'payment', $2, $3)`,
          [userId, booking.total_cost, `Payment for booking #${bookingId}`]
        );
        
        paymentSuccess = true;
        paymentReference = `SAVINGS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        break;
        
      case 'savings_crypto':
        // In a real app: Interact with blockchain smart contracts
        // For demo, we'll just check an internal representation of crypto balance
        
        const cryptoBalanceQuery = `
          SELECT crypto_balance FROM user_crypto_balances 
          WHERE user_id = $1
        `;
        const cryptoResult = await db.query(cryptoBalanceQuery, [userId]);
        
        if (cryptoResult.rows.length === 0) {
          return res.status(404).json({ message: 'Crypto wallet not configured' });
        }
        
        const cryptoBalance = parseFloat(cryptoResult.rows[0].crypto_balance);
        
        if (cryptoBalance < booking.total_cost) {
          return res.status(400).json({ 
            message: 'Insufficient crypto funds',
            balance: cryptoBalance,
            required: booking.total_cost
          });
        }
        
        // Update balance
        await db.query(
          'UPDATE user_crypto_balances SET crypto_balance = crypto_balance - $1 WHERE user_id = $2',
          [booking.total_cost, userId]
        );
        
        // Create transaction record
        await db.query(
          `INSERT INTO savings_transactions 
           (user_id, type, amount_usd, description, is_crypto) 
           VALUES ($1, 'payment', $2, $3, TRUE)`,
          [userId, booking.total_cost, `Crypto payment for booking #${bookingId}`]
        );
        
        paymentSuccess = true;
        paymentReference = `CRYPTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid payment method' });
    }
    
    if (paymentSuccess) {
      // Update booking status
      await db.query(
        'UPDATE bookings SET status = $1 WHERE id = $2',
        ['confirmed', bookingId]
      );
      
      // Create payment record
      const paymentQuery = `
        INSERT INTO payments 
        (booking_id, amount, payment_method, reference, status) 
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      
      const paymentResult = await db.query(
        paymentQuery, 
        [bookingId, booking.total_cost, paymentMethod, paymentReference, 'successful']
      );
      
      res.status(200).json({
        message: 'Payment successful',
        bookingId,
        paymentId: paymentResult.rows[0].id,
        status: 'confirmed',
        reference: paymentReference
      });
    } else {
      res.status(500).json({ message: 'Payment processing failed' });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Payment processing error', error: error.message });
  }
};

module.exports = {
  addPaymentMethod,
  getUserPaymentMethods,
  processBookingPayment
};