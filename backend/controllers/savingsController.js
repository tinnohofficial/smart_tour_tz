// Savings controller for handling user savings accounts
const db = require("../config/db");

/**
 * Deposit funds into user's savings account
 * Simplified savings system - single balance for all types of savings
 */
const depositFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    // Validate amount
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ message: "Invalid deposit amount" });
    }

    // Validate deposit amount limits
    if (depositAmount > 10000) {
      return res.status(400).json({ 
        message: "Deposit amount exceeds maximum limit of $10,000" 
      });
    }

    // Start a transaction to ensure data consistency
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Check if user already has a savings account
      const accountQuery = "SELECT user_id FROM savings_accounts WHERE user_id = ?";
      const [accountResult] = await connection.query(accountQuery, [userId]);

      if (accountResult.length === 0) {
        // Create new savings account
        await connection.query(
          "INSERT INTO savings_accounts (user_id, balance) VALUES (?, ?)",
          [userId, depositAmount],
        );
      } else {
        // Update existing account
        await connection.query(
          "UPDATE savings_accounts SET balance = balance + ? WHERE user_id = ?",
          [depositAmount, userId],
        );
      }

      // Create payment record for the deposit
      await connection.query(
        `INSERT INTO payments
         (user_id, amount, payment_method, reference, status)
         VALUES (?, ?, 'external', ?, 'successful')`,
        [
          userId,
          depositAmount,
          `DEPOSIT-${Date.now()}`,
        ],
      );

      // Get current balance
      const [balanceResult] = await connection.query(
        "SELECT balance FROM savings_accounts WHERE user_id = ?",
        [userId],
      );
      
      // Commit the transaction
      await connection.commit();

      res.status(200).json({
        message: "Deposit completed successfully",
        amount: depositAmount,
        newBalance: balanceResult[0].balance,
      });
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error processing deposit:", error);
    res
      .status(500)
      .json({ message: "Failed to process deposit", error: error.message });
  }
};

/**
 * Get user's savings balance
 */
const getSavingsBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get balance
    const query = "SELECT balance FROM savings_accounts WHERE user_id = ?";
    const [result] = await db.query(query, [userId]);
    const balance = result.length > 0 ? result[0].balance : 0;

    res.status(200).json({
      balance,
      currency: "USD",
    });
  } catch (error) {
    console.error("Error fetching savings balance:", error);
    res
      .status(500)
      .json({ message: "Failed to get savings balance", error: error.message });
  }
};

module.exports = {
  depositFunds,
  getSavingsBalance,
};
