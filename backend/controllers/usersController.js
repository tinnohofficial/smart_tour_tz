const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');

const saltRounds = 10;

exports.register = async (req, res) => {
  const { email, password, phone_number, role } = req.body;

  // Basic Validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    // Check if user exists
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ? OR phone_number = ?",
      [email, phone_number],
    );
    if (existingUsers.length > 0) {
      return res
        .status(409)
        .json({ message: "Email or phone number already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const initialStatus = role === "tourist" ? "active" : "pending_profile"; // Tourists are active immediately, others need profile/approval

    const [result] = await db.query(
      "INSERT INTO users (email, password_hash, phone_number, role, status) VALUES (?, ?, ?, ?, ?)",
      [email, hashedPassword, phone_number, role, initialStatus],
    );

    // Tourist users already have balance initialized in users table

    // Generate JWT token just like in login
    const token = jwt.sign(
      {
        id: result.insertId,
        email,
        role,
        status: initialStatus,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "30d",
      }
    );

    // Return token and user info like in login
    res.status(201).json({
      message: "User registered successfully. Please complete your profile if required.",
      token,
      user: {
        id: result.insertId,
        email,
        role,
        status: initialStatus,
      }
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Error registering user." });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const [users] = await db.query(
      "SELECT id, email, password_hash, role, status FROM users WHERE email = ?",
      [email],
    );
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (user.status === "inactive" || user.status === "rejected") {
      return res.status(403).json({
        message: `Account not active. Status: ${user.status}. Please contact support.`,
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "30d",
      },
    );

    // Send user info (excluding password) and token
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        // Add other relevant non-sensitive info if needed
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Error logging in." });
  }
};

exports.updatePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Current password and new password are required",
    });
  }

  // Validate new password (simple validation, can be enhanced)
  if (newPassword.length < 8) {
    return res.status(400).json({
      message: "New password must be at least 8 characters long",
    });
  }

  try {
    // Get current password hash
    const userQuery = "SELECT password_hash FROM users WHERE id = ?";
    const [userResult] = await db.query(userQuery, [userId]);

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentHash = userResult[0].password_hash;

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, currentHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.query(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [newHash, userId],
    );

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res
      .status(500)
      .json({ message: "Failed to update password", error: error.message });
  }
};

exports.updateEmail = async (req, res) => {
  const userId = req.user.id;
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and current password are required",
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Please provide a valid email address",
    });
  }

  try {
    // Check if email already exists for another user
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, userId]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        message: "Email is already in use by another account" 
      });
    }

    // Get current user data for password verification
    const [userResult] = await db.query(
      "SELECT password_hash FROM users WHERE id = ?", 
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordHash = userResult[0].password_hash;

    // Verify current password
    const isPasswordValid = await bcrypt.compare(password, passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    // Update email
    await db.query(
      "UPDATE users SET email = ? WHERE id = ?",
      [email, userId]
    );

    res.json({ message: "Email updated successfully" });
  } catch (error) {
    console.error("Error updating email:", error);
    res
      .status(500)
      .json({ message: "Failed to update email", error: error.message });
  }
};

exports.updatePhone = async (req, res) => {
  const userId = req.user.id;
  const { phone_number, password } = req.body;

  if (!phone_number || !password) {
    return res.status(400).json({
      message: "Phone number and current password are required",
    });
  }

  // Validate phone number using international standards
  if (phone_number && !isValidPhoneNumber(phone_number)) {
    return res.status(400).json({
      message: "Please provide a valid international phone number",
    });
  }

  try {
    // Check if phone number already exists for another user
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE phone_number = ? AND id != ?",
      [phone_number, userId]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        message: "Phone number is already in use by another account" 
      });
    }

    // Get current user data for password verification
    const [userResult] = await db.query(
      "SELECT password_hash FROM users WHERE id = ?", 
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordHash = userResult[0].password_hash;

    // Verify current password
    const isPasswordValid = await bcrypt.compare(password, passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    // Update phone number
    await db.query(
      "UPDATE users SET phone_number = ? WHERE id = ?",
      [phone_number, userId]
    );

    res.json({ message: "Phone number updated successfully" });
  } catch (error) {
    console.error("Error updating phone number:", error);
    res
      .status(500)
      .json({ message: "Failed to update phone number", error: error.message });
  }
};

// Get user balance (for tourists only)
exports.getBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'tourist') {
      return res.status(403).json({ 
        message: "Only tourists can access balance information" 
      });
    }

    const [result] = await db.query(
      "SELECT balance FROM users WHERE id = ?",
      [userId]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      balance: parseFloat(result[0].balance) || 0,
      user_id: userId
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ 
      message: "Failed to get balance", 
      error: error.message 
    });
  }
};

// Update user balance (for tourists only)
exports.updateBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { balance } = req.body;

    if (userRole !== 'tourist') {
      return res.status(403).json({ 
        message: "Only tourists can update balance" 
      });
    }

    // Validate balance
    if (balance === undefined || isNaN(parseFloat(balance)) || parseFloat(balance) < 0) {
      return res.status(400).json({ 
        message: "Valid balance is required and must be non-negative" 
      });
    }

    const newBalance = parseFloat(balance);

    // Get current balance for response
    const [currentResult] = await db.query(
      "SELECT balance FROM users WHERE id = ?",
      [userId]
    );

    if (currentResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousBalance = parseFloat(currentResult[0].balance);

    // Update balance
    await db.query(
      "UPDATE users SET balance = ? WHERE id = ?",
      [newBalance, userId]
    );

    res.json({
      message: "Balance updated successfully",
      user_id: userId,
      balance: newBalance,
      previous_balance: previousBalance
    });
  } catch (error) {
    console.error("Error updating balance:", error);
    res.status(500).json({ 
      message: "Failed to update balance", 
      error: error.message 
    });
  }
};

