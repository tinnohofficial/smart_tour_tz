// Simplified savings controller for handling basic savings account operations
const db = require("../config/db");

/**
 * Create a savings account for a user
 */
const createSaving = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user already has a savings account
    const [existingAccount] = await db.query(
      "SELECT user_id FROM savings_accounts WHERE user_id = ?",
      [userId]
    );

    if (existingAccount.length > 0) {
      return res.status(400).json({ 
        message: "Savings account already exists for this user" 
      });
    }

    // Create new savings account
    await db.query(
      "INSERT INTO savings_accounts (user_id, balance) VALUES (?, 0.00)",
      [userId]
    );

    res.status(201).json({
      message: "Savings account created successfully",
      user_id: userId,
      balance: 0.00
    });

  } catch (error) {
    console.error("Error creating savings account:", error);
    res.status(500).json({ 
      message: "Failed to create savings account", 
      error: error.message 
    });
  }
};

/**
 * Update savings account balance
 */
const updateSaving = async (req, res) => {
  try {
    const { balance } = req.body;
    const userId = req.user.id;

    // Validate balance
    if (balance === undefined || isNaN(parseFloat(balance)) || parseFloat(balance) < 0) {
      return res.status(400).json({ 
        message: "Valid balance is required and must be non-negative" 
      });
    }

    const newBalance = parseFloat(balance);

    // Check if savings account exists
    const [existingAccount] = await db.query(
      "SELECT user_id, balance FROM savings_accounts WHERE user_id = ?",
      [userId]
    );

    if (existingAccount.length === 0) {
      return res.status(404).json({ 
        message: "Savings account not found" 
      });
    }

    // Update balance
    await db.query(
      "UPDATE savings_accounts SET balance = ? WHERE user_id = ?",
      [newBalance, userId]
    );

    res.status(200).json({
      message: "Savings account updated successfully",
      user_id: userId,
      balance: newBalance,
      previous_balance: parseFloat(existingAccount[0].balance)
    });

  } catch (error) {
    console.error("Error updating savings account:", error);
    res.status(500).json({ 
      message: "Failed to update savings account", 
      error: error.message 
    });
  }
};

module.exports = {
  createSaving,
  updateSaving
};