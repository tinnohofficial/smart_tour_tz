// Savings controller for handling user savings accounts
const db = require("../config/db");
const { createPaymentIntent } = require("../config/stripe");
const blockchainService = require("../services/blockchainService");

/**
 * Deposit funds into user's savings account
 * Supports both fiat (TZS via Stripe) and crypto deposits
 */
const depositFunds = async (req, res) => {
  try {
    const { amount, method = 'stripe' } = req.body; // method can be 'stripe' or 'crypto'
    const userId = req.user.id;

    // Validate amount
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ message: "Invalid deposit amount" });
    }

    // Validate deposit amount limits (in TZS)
    if (depositAmount > 25000000) { // 25M TZS limit
      return res.status(400).json({ 
        message: "Deposit amount exceeds maximum limit of 25,000,000 TZS" 
      });
    }

    if (method === 'stripe') {
      // Handle Stripe payment intent creation
      const paymentIntent = await createPaymentIntent(depositAmount, 'tzs');
      
      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: depositAmount,
        currency: 'TZS'
      });
    } else if (method === 'crypto') {
      // For crypto deposits, we'll check the blockchain for recent deposits
      // This is called after the user has already made the deposit
      const userWalletAddress = req.body.walletAddress;
      
      if (!userWalletAddress) {
        return res.status(400).json({ message: "Wallet address is required for crypto deposits" });
      }

      // Update user's wallet address if not already set
      await db.query(
        "UPDATE users SET wallet_address = ? WHERE id = ? AND wallet_address IS NULL",
        [userWalletAddress, userId]
      );

      const expectedUsdtAmount = await blockchainService.convertTzsToUsdt(depositAmount);
      const depositCheck = await blockchainService.checkRecentDeposits(
        userWalletAddress, 
        expectedUsdtAmount
      );

      if (!depositCheck.found) {
        return res.status(400).json({ 
          message: "Crypto deposit not found. Please ensure the transaction is confirmed.",
          expectedAmount: expectedUsdtAmount
        });
      }

      // Process the crypto deposit
      await this.processCryptoDeposit(userId, depositAmount, depositCheck.transactionHash);
      
      return res.status(200).json({
        message: "Crypto deposit processed successfully",
        amount: depositAmount,
        currency: 'TZS',
        transactionHash: depositCheck.transactionHash
      });
    }

  } catch (error) {
    console.error("Error processing deposit:", error);
    res
      .status(500)
      .json({ message: "Failed to process deposit", error: error.message });
  }
};

/**
 * Get user's savings balance (both fiat and crypto combined)
 */
const getSavingsBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get balance and user's wallet address
    const query = `
      SELECT s.balance, s.blockchain_balance, s.currency, u.wallet_address 
      FROM savings_accounts s 
      LEFT JOIN users u ON s.user_id = u.id 
      WHERE s.user_id = ?
    `;
    const [result] = await db.query(query, [userId]);
    
    let totalBalance = 0;
    let blockchainBalance = 0;
    let walletAddress = null;

    if (result.length > 0) {
      totalBalance = parseFloat(result[0].balance) || 0;
      blockchainBalance = parseFloat(result[0].blockchain_balance) || 0;
      walletAddress = result[0].wallet_address;
    }

    // If user has a wallet address, also check live blockchain balance
    if (walletAddress) {
      try {
        const liveUsdtBalance = await blockchainService.getUserBalance(walletAddress);
        const liveBalanceTzs = await blockchainService.convertUsdtToTzs(parseFloat(liveUsdtBalance));
        
        // Update blockchain balance if there's a difference
        if (Math.abs(liveBalanceTzs - blockchainBalance) > 1) { // Tolerance of 1 TZS
          await db.query(
            "UPDATE savings_accounts SET blockchain_balance = ? WHERE user_id = ?",
            [liveBalanceTzs, userId]
          );
          blockchainBalance = liveBalanceTzs;
        }
      } catch (error) {
        console.warn("Could not fetch live blockchain balance:", error.message);
      }
    }

    res.status(200).json({
      balance: totalBalance,
      blockchainBalance: blockchainBalance,
      currency: "TZS",
      walletAddress: walletAddress
    });
  } catch (error) {
    console.error("Error fetching savings balance:", error);
    res
      .status(500)
      .json({ message: "Failed to get savings balance", error: error.message });
  }
};

/**
 * Process crypto deposit after blockchain confirmation
 */
const processCryptoDeposit = async (userId, amountTzs, transactionHash) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();
  
  try {
    // Check if user already has a savings account
    const accountQuery = "SELECT user_id, blockchain_balance FROM savings_accounts WHERE user_id = ?";
    const [accountResult] = await connection.query(accountQuery, [userId]);

    if (accountResult.length === 0) {
      // Create new savings account
      await connection.query(
        "INSERT INTO savings_accounts (user_id, balance, blockchain_balance, currency) VALUES (?, ?, ?, 'TZS')",
        [userId, amountTzs, amountTzs],
      );
    } else {
      // Update existing account
      await connection.query(
        "UPDATE savings_accounts SET balance = balance + ?, blockchain_balance = blockchain_balance + ? WHERE user_id = ?",
        [amountTzs, amountTzs, userId],
      );
    }

    // Create payment record for the crypto deposit
    await connection.query(
      `INSERT INTO payments
       (user_id, amount, payment_method, reference, status, currency)
       VALUES (?, ?, 'crypto', ?, 'successful', 'TZS')`,
      [userId, amountTzs, transactionHash],
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Confirm Stripe payment and update balance
 */
const confirmStripePayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    const { confirmPayment } = require("../config/stripe");
    const paymentIntent = await confirmPayment(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const amountTzs = parseFloat(paymentIntent.metadata.original_amount);
      
      // Start transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();
      
      try {
        // Check if user already has a savings account
        const accountQuery = "SELECT user_id FROM savings_accounts WHERE user_id = ?";
        const [accountResult] = await connection.query(accountQuery, [userId]);

        if (accountResult.length === 0) {
          // Create new savings account
          await connection.query(
            "INSERT INTO savings_accounts (user_id, balance, currency) VALUES (?, ?, 'TZS')",
            [userId, amountTzs],
          );
        } else {
          // Update existing account
          await connection.query(
            "UPDATE savings_accounts SET balance = balance + ? WHERE user_id = ?",
            [amountTzs, userId],
          );
        }

        // Create payment record
        await connection.query(
          `INSERT INTO payments
           (user_id, amount, payment_method, reference, status, currency)
           VALUES (?, ?, 'stripe', ?, 'successful', 'TZS')`,
          [userId, amountTzs, paymentIntent.id],
        );

        // Get current balance
        const [balanceResult] = await connection.query(
          "SELECT balance FROM savings_accounts WHERE user_id = ?",
          [userId],
        );
        
        await connection.commit();

        res.status(200).json({
          message: "Payment confirmed and deposit completed successfully",
          amount: amountTzs,
          newBalance: balanceResult[0].balance,
          currency: 'TZS'
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } else {
      res.status(400).json({ 
        message: "Payment was not successful", 
        status: paymentIntent.status 
      });
    }
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ 
      message: "Failed to confirm payment", 
      error: error.message 
    });
  }
};

/**
 * Get live blockchain balance for a user
 */
const getLiveBlockchainBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's wallet address
    const [userResult] = await db.query(
      "SELECT wallet_address FROM users WHERE id = ?",
      [userId]
    );
    
    if (userResult.length === 0 || !userResult[0].wallet_address) {
      return res.status(200).json({
        balance: 0,
        currency: 'TZS',
        walletAddress: null
      });
    }
    
    const walletAddress = userResult[0].wallet_address;
    
    // Get live USDT balance from blockchain
    const liveUsdtBalance = await blockchainService.getUserBalance(walletAddress);
    const liveBalanceTzs = await blockchainService.convertUsdtToTzs(parseFloat(liveUsdtBalance));
    
    // Update database with live balance
    await db.query(
      "UPDATE savings_accounts SET blockchain_balance = ? WHERE user_id = ?",
      [liveBalanceTzs, userId]
    );
    
    res.status(200).json({
      balance: liveBalanceTzs,
      usdtBalance: liveUsdtBalance,
      currency: 'TZS',
      walletAddress: walletAddress
    });
    
  } catch (error) {
    console.error("Error fetching live blockchain balance:", error);
    res.status(500).json({ 
      message: "Failed to get live blockchain balance", 
      error: error.message 
    });
  }
};

module.exports = {
  depositFunds,
  getSavingsBalance,
  processCryptoDeposit,
  confirmStripePayment,
  getLiveBlockchainBalance,
};
