const db = require("../config/db");

/**
 * Get tourist profile details
 */
exports.getTouristProfile = async (req, res) => {
  const userId = req.user.id;
  
  try {
    // For tourists, we primarily return user data
    const [userRows] = await db.query(
      "SELECT id, email, phone_number, status, created_at FROM users WHERE id = ?",
      [userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const userData = userRows[0];
    
    // Get recent bookings
    const [bookingsData] = await db.query(
      `SELECT id, total_cost, status, created_at
       FROM bookings WHERE tourist_user_id = ?
       ORDER BY created_at DESC LIMIT 5`,
      [userId]
    );
    
    const responseData = {
      ...userData,
      recentBookings: bookingsData
    };
    
    // Get saved destinations/favorites if implemented
    // const [favoritesData] = await db.query(...);
    // responseData.favorites = favoritesData;
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching tourist profile:", error);
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};

/**
 * Update tourist profile
 * Note: Currently limited to user table fields as tourists don't have their own profile table
 */
exports.updateTouristProfile = async (req, res) => {
  const userId = req.user.id;
  const { phone_number } = req.body;
  
  try {
    // Only allow updating phone_number for now
    // Could expand to other fields or create a tourists table in the future
    if (phone_number !== undefined) {
      await db.query(
        "UPDATE users SET phone_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [phone_number, userId]
      );
      
      res.status(200).json({ message: "Tourist profile updated successfully" });
    } else {
      res.status(400).json({ message: "No fields to update" });
    }
  } catch (error) {
    console.error("Error updating tourist profile:", error);
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

/**
 * Get tourist bookings
 */
exports.getTouristBookings = async (req, res) => {
  const userId = req.user.id;
  
  try {
    // Get all bookings for this tourist
    const [bookings] = await db.query(
      `SELECT id, total_cost, status, created_at
       FROM bookings WHERE tourist_user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
    
    // For each booking, get the booking items
    for (const booking of bookings) {
      const [items] = await db.query(
        `SELECT bi.*, 
          CASE 
            WHEN bi.item_type = 'hotel' THEN h.name
            WHEN bi.item_type = 'transport' THEN CONCAT(tr.origin, ' to ', tr.destination)
            WHEN bi.item_type = 'activity' THEN a.name
            ELSE NULL
          END as item_name
        FROM booking_items bi
        LEFT JOIN hotels h ON bi.item_type = 'hotel' AND bi.item_id = h.id
        LEFT JOIN transport_routes tr ON bi.item_type = 'transport' AND bi.item_id = tr.id
        LEFT JOIN activities a ON bi.item_type = 'activity' AND bi.item_id = a.id
        WHERE bi.booking_id = ?`,
        [booking.id]
      );
      
      booking.items = items;
    }
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching tourist bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
  }
};

/**
 * Get tourist savings account details
 */
exports.getSavingsAccount = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [accounts] = await db.query(
      `SELECT id, balance, created_at, last_transaction_at
       FROM savings_accounts
       WHERE tourist_user_id = ?`,
      [userId]
    );
    
    if (accounts.length === 0) {
      return res.status(404).json({ message: "Savings account not found" });
    }
    
    const account = accounts[0];
    
    // Get recent transactions
    const [transactions] = await db.query(
      `SELECT amount, type, description, created_at
       FROM savings_transactions
       WHERE account_id = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [account.id]
    );
    
    account.recentTransactions = transactions;
    
    res.status(200).json(account);
  } catch (error) {
    console.error("Error fetching savings account:", error);
    res.status(500).json({ message: "Failed to fetch savings account", error: error.message });
  }
};