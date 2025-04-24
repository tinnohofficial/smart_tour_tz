// Savings controller for handling user savings accounts
const db = require("../config/db");

/**
 * Configure a user's Web3 wallet address
 * F5.2: Configure web3 wallet address for crypto payments
 */
const configureWalletAddress = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const userId = req.user.id;

    // Validate wallet address (basic validation, should be more sophisticated in production)
    if (
      !walletAddress ||
      typeof walletAddress !== "string" ||
      !walletAddress.startsWith("0x")
    ) {
      return res.status(400).json({ message: "Invalid wallet address format" });
    }

    // Check if user already has a wallet configured
    const checkQuery = "SELECT id FROM user_crypto_balances WHERE user_id = ?";
    const [checkResult] = await db.query(checkQuery, [userId]);

    if (checkResult.length > 0) {
      // Update existing wallet
      await db.query(
        "UPDATE user_crypto_balances SET wallet_address = ? WHERE user_id = ?",
        [walletAddress, userId],
      );
    } else {
      // Create new wallet entry (with 0 initial balance)
      await db.query(
        "INSERT INTO user_crypto_balances (user_id, wallet_address, crypto_balance) VALUES (?, ?, 0)",
        [userId, walletAddress],
      );
    }

    res.status(200).json({
      message: "Wallet address configured successfully",
      walletAddress,
    });
  } catch (error) {
    console.error("Error configuring wallet:", error);
    res.status(500).json({
      message: "Failed to configure wallet address",
      error: error.message,
    });
  }
};

/**
 * Deposit fiat funds into user's savings account
 * F5.3: Deposit fiat funds for future trips
 */
const depositFiatFunds = async (req, res) => {
  try {
    const { amount, paymentMethodId } = req.body;
    const userId = req.user.id;

    // Validate amount
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ message: "Invalid deposit amount" });
    }

    // Validate payment method and check expiration
    const paymentQuery =
      "SELECT id, expiry_month, expiry_year FROM user_payment_methods WHERE id = ? AND user_id = ?";
    const [paymentResult] = await db.query(paymentQuery, [
      paymentMethodId,
      userId,
    ]);

    if (paymentResult.length === 0) {
      return res.status(404).json({ message: "Payment method not found" });
    }
    
    // Check if card is expired
    const card = paymentResult[0];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JS months are 0-indexed
    
    const expiryYear = parseInt(card.expiry_year);
    const expiryMonth = parseInt(card.expiry_month);
    
    if (expiryYear < currentYear || 
        (expiryYear === currentYear && expiryMonth < currentMonth)) {
      return res.status(400).json({ message: "Payment method has expired" });
    }
    
    // Validate deposit amount limits
    if (depositAmount > 10000) {
      return res.status(400).json({ 
        message: "Deposit amount exceeds maximum limit of $10,000" 
      });
    }

    // Process payment (in a real app, we'd use a payment gateway API here)
    // For this implementation, we'll assume the payment was successful
    
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
          "INSERT INTO savings_accounts (user_id, balance_usd) VALUES (?, ?)",
          [userId, depositAmount],
        );
      } else {
        // Update existing account
        await connection.query(
          "UPDATE savings_accounts SET balance_usd = balance_usd + ? WHERE user_id = ?",
          [depositAmount, userId],
        );
      }

      // Create transaction record
      const [transactionResult] = await connection.query(
        `INSERT INTO savings_transactions
         (user_id, type, amount_usd, payment_method_id, description, is_crypto)
         VALUES (?, 'deposit', ?, ?, 'Fiat deposit to savings account', FALSE)`,
        [userId, depositAmount, paymentMethodId],
      );

      // Create payment record
      await connection.query(
        `INSERT INTO payments
         (user_id, amount, payment_method, reference, status, transaction_id)
         VALUES (?, ?, 'card', ?, 'successful', ?)`,
        [
          userId,
          depositAmount,
          `DEPOSIT-${Date.now()}`,
          transactionResult.insertId,
        ],
      );

      // Get current balance
      const [balanceResult] = await connection.query(
        "SELECT balance_usd FROM savings_accounts WHERE user_id = ?",
        [userId],
      );
      
      // Commit the transaction
      await connection.commit();

      res.status(200).json({
        message: "Deposit completed successfully",
        amount: depositAmount,
        newBalance: balanceResult[0].balance_usd,
        transactionId: transactionResult.insertId,
      });
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error processing fiat deposit:", error);
    res
      .status(500)
      .json({ message: "Failed to process deposit", error: error.message });
  }
};

/**
 * Deposit crypto funds
 * F5.5: Deposit crypto funds for future trips
 * Integrated with EVM-based blockchain smart contracts
 */
const depositCryptoFunds = async (req, res) => {
  try {
    const { amount, tokenType } = req.body;
    const userId = req.user.id;

    // Validate amount
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ message: "Invalid deposit amount" });
    }
    
    // Allow multiple tokens, but understand they will be swapped to USDT
    // in the smart contract before depositing
    const allowedTokens = ['ETH', 'BTC', 'USDC', 'USDT'];
    const token = tokenType || 'USDT';
    
    if (!allowedTokens.includes(token)) {
      return res.status(400).json({ 
        message: "Unsupported token type",
        supported: allowedTokens,
        note: "All tokens will be swapped to USDT in the smart contract"
      });
    }
    
    // Validate deposit limits based on token type
    const tokenLimits = {
      'ETH': 10,
      'BTC': 0.5,
      'USDC': 10000,
      'USDT': 10000
    };
    
    if (depositAmount > tokenLimits[token]) {
      return res.status(400).json({ 
        message: `Deposit amount exceeds maximum limit of ${tokenLimits[token]} ${token}` 
      });
    }

    // Start a transaction to ensure data consistency
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. Check if user has wallet configured
      const [walletResult] = await connection.query(
        "SELECT id, wallet_address FROM user_crypto_balances WHERE user_id = ?",
        [userId]
      );

      if (walletResult.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          message: "No wallet configured. Please configure a Web3 wallet first.",
        });
      }

      // 2. Generate contract interaction data for the frontend
      const contractData = {
        contractAddress: "0xSmartTourContractAddress",
        method: "deposit",
        params: {
          amount: depositAmount,
          sourceToken: token, // The token being deposited by user
          user: walletResult[0].wallet_address,
        },
        details: {
          willSwapTo: "USDT", // All deposits are ultimately stored as USDT in the contract
          note: "Smart contract will automatically swap your tokens to USDT"
        }
      };

      // 3. In real app: Frontend would:
      //    - Use this contract data to construct a transaction
      //    - User would sign it with their wallet
      //    - After confirmation on blockchain, backend would be notified via webhook
      //    - Then the balance would be updated
      //    
      // For demo purposes, we'll continue updating the local balance representation:

      // Get exchange rate to convert to USD equivalent
      const getCryptoExchangeRate = async (tokenType) => {
        // In a real app, this would call an exchange rate API
        // For now, return mock rates based on token type
        const rates = {
          'ETH': 3500,
          'BTC': 60000,
          'USDC': 1,
          'USDT': 1
        };
        return rates[tokenType] || 1; // Default to USDT rate if token not found
      };
      
      const cryptoToUsdRate = await getCryptoExchangeRate(token);
      const usdEquivalent = depositAmount * cryptoToUsdRate;
      
      // Update local balance (in production, this would happen after blockchain confirmation)
      await connection.query(
        "UPDATE user_crypto_balances SET crypto_balance = crypto_balance + ? WHERE user_id = ?",
        [usdEquivalent, userId], // We store everything as USD value, matching the USDT value
      );
      
      // Create transaction record - always storing USDT as the final token type
      const [transactionResult] = await connection.query(
        `INSERT INTO savings_transactions
         (user_id, type, amount_usd, description, is_crypto, token_type)
         VALUES (?, 'deposit', ?, ?, ?, ?)`,
        [
          userId, 
          usdEquivalent, 
          `Crypto deposit (${token} → USDT)`, 
          true, 
          'USDT' // Final token type is always USDT
        ],
      );

      // Get updated balance
      const [balanceResult] = await connection.query(
        "SELECT crypto_balance FROM user_crypto_balances WHERE user_id = ?",
        [userId],
      );

      // Commit the transaction
      await connection.commit();

      res.status(200).json({
        message: "Crypto deposit initiated successfully",
        originalAmount: depositAmount,
        originalToken: token,
        finalToken: "USDT", // Always USDT after swap
        usdEquivalent,
        rate: cryptoToUsdRate,
        contractData, // For frontend to construct the transaction
        newUsdtBalance: balanceResult[0].crypto_balance,
        transactionId: transactionResult.insertId,
        note: "In production, this would be a 2-step process: 1) Frontend sends transaction to blockchain 2) Backend updates balance after confirmation"
      });
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      throw error;
    } finally {
      // Always release the connection, whether there was an error or not
      connection.release();
    }
  } catch (error) {
    console.error("Error processing crypto deposit:", error);
    res.status(500).json({
      message: "Failed to process crypto deposit",
      error: error.message,
    });
  }
};

/**
 * Get user's savings balance (both fiat and crypto)
 */
const getSavingsBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get fiat balance
    const fiatQuery =
      "SELECT balance_usd FROM savings_accounts WHERE user_id = ?";
    const [fiatResult] = await db.query(fiatQuery, [userId]);
    const fiatBalance = fiatResult.length > 0 ? fiatResult[0].balance_usd : 0;

    // Get crypto balance
    const cryptoQuery =
      "SELECT crypto_balance, wallet_address FROM user_crypto_balances WHERE user_id = ?";
    const [cryptoResult] = await db.query(cryptoQuery, [userId]);
    const cryptoBalance =
      cryptoResult.length > 0 ? cryptoResult[0].crypto_balance : 0;
    const walletAddress =
      cryptoResult.length > 0 ? cryptoResult[0].wallet_address : null;

    res.status(200).json({
      fiat: {
        balance: fiatBalance,
        currency: "USD",
      },
      crypto: {
        balance: cryptoBalance,
        token: "USDT", // Always USDT as it's stored in the smart contract
        usdValue: cryptoBalance, // USDT is 1:1 with USD
        walletAddress,
        note: "Balance is stored in a smart contract as USDT"
      },
    });
  } catch (error) {
    console.error("Error fetching savings balance:", error);
    res
      .status(500)
      .json({ message: "Failed to get savings balance", error: error.message });
  }
};

module.exports = {
  configureWalletAddress,
  depositFiatFunds,
  depositCryptoFunds,
  getSavingsBalance,
};
