// filepath: /Users/tinnoh/fyp/backend/savings/controller.js
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

    // Validate payment method
    const paymentQuery =
      "SELECT id FROM user_payment_methods WHERE id = ? AND user_id = ?";
    const [paymentResult] = await db.query(paymentQuery, [
      paymentMethodId,
      userId,
    ]);

    if (paymentResult.length === 0) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    // Process payment (in a real app, we'd use a payment gateway API here)
    // For this implementation, we'll assume the payment was successful

    // Check if user already has a savings account
    const accountQuery = "SELECT id FROM savings_accounts WHERE user_id = ?";
    const [accountResult] = await db.query(accountQuery, [userId]);

    let accountId;
    if (accountResult.length === 0) {
      // Create new savings account
      const [newAccountResult] = await db.query(
        "INSERT INTO savings_accounts (user_id, balance_usd, created_at) VALUES (?, ?, NOW())",
        [userId, depositAmount],
      );
      accountId = newAccountResult.insertId;
    } else {
      // Update existing account
      accountId = accountResult[0].id;
      await db.query(
        "UPDATE savings_accounts SET balance_usd = balance_usd + ? WHERE user_id = ?",
        [depositAmount, userId],
      );
    }

    // Create transaction record
    const [transactionResult] = await db.query(
      `INSERT INTO savings_transactions
       (user_id, type, amount_usd, payment_method_id, description)
       VALUES (?, 'deposit', ?, ?, 'Fiat deposit to savings account')`,
      [userId, depositAmount, paymentMethodId],
    );

    // Create payment record
    await db.query(
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
    const [balanceResult] = await db.query(
      "SELECT balance_usd FROM savings_accounts WHERE user_id = ?",
      [userId],
    );

    res.status(200).json({
      message: "Deposit completed successfully",
      amount: depositAmount,
      newBalance: balanceResult[0].balance_usd,
      transactionId: transactionResult.insertId,
    });
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

    // In a production app, this endpoint would generate necessary data for Smart Contract interaction
    // Here we'll simulate the blockchain interaction and update our internal representation

    // 1. Check if user has wallet configured
    const walletQuery =
      "SELECT id, wallet_address FROM user_crypto_balances WHERE user_id = ?";
    const [walletResult] = await db.query(walletQuery, [userId]);

    if (walletResult.length === 0) {
      return res.status(404).json({
        message: "No wallet configured. Please configure a Web3 wallet first.",
      });
    }

    // 2. Generate contract interaction data (would be actual data in production)
    const contractData = {
      contractAddress: "0xSmartTourContractAddress",
      method: "deposit",
      params: {
        amount: depositAmount,
        token: tokenType || "ETH",
        user: walletResult[0].wallet_address,
      },
    };

    // 3. In real app: User would sign/submit this transaction through frontend
    //    Here we'll simulate successful deposit

    // 4. Update user's crypto balance (represent internal state of contract)
    await db.query(
      "UPDATE user_crypto_balances SET crypto_balance = crypto_balance + ? WHERE user_id = ?",
      [depositAmount, userId],
    );

    // 5. Create transaction record
    const [transactionResult] = await db.query(
      `INSERT INTO savings_transactions
       (user_id, type, amount_usd, description, is_crypto, token_type)
       VALUES (?, 'deposit', ?, 'Crypto deposit to savings', TRUE, ?)`,
      [userId, depositAmount, tokenType || "ETH"],
    );

    // 6. Get updated balance
    const [balanceResult] = await db.query(
      "SELECT crypto_balance FROM user_crypto_balances WHERE user_id = ?",
      [userId],
    );

    res.status(200).json({
      message: "Crypto deposit initiated successfully",
      amount: depositAmount,
      token: tokenType || "ETH",
      contractData, // Would return to frontend for wallet interaction
      newBalance: balanceResult[0].crypto_balance,
      transactionId: transactionResult.insertId,
      note: "In a real app, this would require wallet interaction in the frontend",
    });
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
        walletAddress,
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
