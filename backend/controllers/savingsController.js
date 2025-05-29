// Savings controller for handling user savings accounts
const db = require("../config/db");
const { createPaymentIntent } = require("../config/stripe");
const blockchainService = require("../services/blockchainService");
const exchangeRateService = require("../services/exchangeRateService");

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

      // Get conversion rates for display
      const conversionRates = await exchangeRateService.getConversionRates(depositAmount);
      const expectedUsdtAmount = conversionRates.usdt;
      
      const depositCheck = await blockchainService.checkRecentDeposits(
        userWalletAddress, 
        expectedUsdtAmount
      );

      if (!depositCheck.found) {
        return res.status(400).json({ 
          message: "Crypto deposit not found. Please ensure the transaction is confirmed.",
          expectedAmount: expectedUsdtAmount,
          conversionRates: conversionRates
        });
      }

      // Process the crypto deposit
      await this.processCryptoDeposit(userId, depositAmount, depositCheck.transactionHash);
      
      return res.status(200).json({
        message: "Crypto deposit processed successfully",
        amount: depositAmount,
        currency: 'TZS',
        transactionHash: depositCheck.transactionHash,
        conversionRates: conversionRates
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
    let walletTokenBalance = { eth: 0, usdt: 0 };
    if (walletAddress) {
      try {
        const liveUsdtBalance = await blockchainService.getUserBalance(walletAddress);
        const liveBalanceTzs = await exchangeRateService.convertUsdtToTzs(parseFloat(liveUsdtBalance));
        
        // Get wallet token balances
        walletTokenBalance = await blockchainService.getWalletTokenBalance(walletAddress);
        
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

    // Get current exchange rates for frontend display
    const conversionRates = await exchangeRateService.getConversionRates(totalBalance);

    res.status(200).json({
      balance: totalBalance,
      blockchainBalance: blockchainBalance,
      currency: "TZS",
      walletAddress: walletAddress,
      walletTokenBalance: walletTokenBalance,
      conversionRates: conversionRates
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
    const liveBalanceTzs = await exchangeRateService.convertUsdtToTzs(parseFloat(liveUsdtBalance));
    
    // Get wallet token balances
    const walletTokenBalance = await blockchainService.getWalletTokenBalance(walletAddress);
    
    // Update database with live balance
    await db.query(
      "UPDATE savings_accounts SET blockchain_balance = ? WHERE user_id = ?",
      [liveBalanceTzs, userId]
    );
    
    // Get conversion rates for display
    const conversionRates = await exchangeRateService.getConversionRates(liveBalanceTzs);
    
    res.status(200).json({
      balance: liveBalanceTzs,
      usdtBalance: liveUsdtBalance,
      currency: 'TZS',
      walletAddress: walletAddress,
      walletTokenBalance: walletTokenBalance,
      conversionRates: conversionRates
    });
    
  } catch (error) {
    console.error("Error fetching live blockchain balance:", error);
    res.status(500).json({ 
      message: "Failed to get live blockchain balance", 
      error: error.message 
    });
  }
};

/**
 * Connect or update user's wallet address
 */
const connectWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const userId = req.user.id;

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({ message: "Invalid wallet address" });
    }

    // Update user's wallet address
    await db.query(
      "UPDATE users SET wallet_address = ? WHERE id = ?",
      [walletAddress, userId]
    );

    // Get wallet token balances
    const walletTokenBalance = await blockchainService.getWalletTokenBalance(walletAddress);
    
    // Get vault balance
    const vaultBalance = await blockchainService.getUserBalance(walletAddress);
    
    res.status(200).json({
      message: "Wallet connected successfully",
      walletAddress: walletAddress,
      walletTokenBalance: walletTokenBalance,
      vaultBalance: vaultBalance
    });
  } catch (error) {
    console.error("Error connecting wallet:", error);
    res.status(500).json({ 
      message: "Failed to connect wallet", 
      error: error.message 
    });
  }
};

/**
 * Disconnect user's wallet
 */
const disconnectWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    await db.query(
      "UPDATE users SET wallet_address = NULL WHERE id = ?",
      [userId]
    );

    res.status(200).json({
      message: "Wallet disconnected successfully"
    });
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
    res.status(500).json({ 
      message: "Failed to disconnect wallet", 
      error: error.message 
    });
  }
};

/**
 * Get conversion rates for a TZS amount
 */
const getConversionRates = async (req, res) => {
  try {
    const { amount } = req.query;
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Valid amount parameter is required" });
    }

    const tzsAmount = Number(amount);
    const conversionRates = await exchangeRateService.getConversionRates(tzsAmount);
    
    res.status(200).json({
      success: true,
      conversionRates: conversionRates
    });
  } catch (error) {
    console.error("Error getting conversion rates:", error);
    res.status(500).json({ 
      message: "Failed to get conversion rates", 
      error: error.message 
    });
  }
};

/**
 * Get network information and contract status
 */
const getNetworkInfo = async (req, res) => {
  try {
    const networkInfo = await blockchainService.getNetworkInfo();
    
    res.status(200).json({
      success: true,
      networkInfo: networkInfo
    });
  } catch (error) {
    console.error("Error getting network info:", error);
    res.status(500).json({ 
      message: "Failed to get network info", 
      error: error.message 
    });
  }
};

/**
 * Process automatic crypto payment (for checkout)
 */
const processAutomaticCryptoPayment = async (req, res) => {
  try {
    const { amount, walletAddress } = req.body;
    const userId = req.user.id;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({ message: "Invalid wallet address" });
    }

    const tzsAmount = Number(amount);
    
    // Process the automatic payment
    const result = await blockchainService.processAutomaticPayment(walletAddress, tzsAmount);
    
    if (result.success) {
      // Update database balance
      await db.query(
        "UPDATE savings_accounts SET blockchain_balance = blockchain_balance - ? WHERE user_id = ?",
        [tzsAmount, userId]
      );

      // Create payment record
      await db.query(
        `INSERT INTO payments
         (user_id, amount, payment_method, reference, status, currency, exchange_rate)
         VALUES (?, ?, 'crypto', ?, 'successful', 'TZS', ?)`,
        [userId, tzsAmount, result.transactionHash, result.exchangeRate]
      );

      res.status(200).json({
        success: true,
        message: "Crypto payment processed successfully",
        transactionHash: result.transactionHash,
        amount: tzsAmount,
        amountUSDT: result.amountUSDT,
        exchangeRate: result.exchangeRate
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || "Crypto payment failed"
      });
    }
  } catch (error) {
    console.error("Error processing automatic crypto payment:", error);
    res.status(500).json({ 
      message: "Failed to process crypto payment", 
      error: error.message 
    });
  }
};

const { ethers } = require('ethers');

module.exports = {
  depositFunds,
  getSavingsBalance,
  processCryptoDeposit,
  confirmStripePayment,
  getLiveBlockchainBalance,
  connectWallet,
  disconnectWallet,
  getConversionRates,
  getNetworkInfo,
  processAutomaticCryptoPayment,
};
