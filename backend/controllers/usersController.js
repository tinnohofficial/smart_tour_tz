const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { parsePhoneNumber, isValidPhoneNumber } = require("libphonenumber-js");
const {
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
} = require("../services/emailService");
const crypto = require("crypto");

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

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const [result] = await db.query(
      "INSERT INTO users (email, password_hash, phone_number, role, status, email_verified, email_verification_token, email_verification_expires) VALUES (?, ?, ?, ?, ?, FALSE, ?, ?)",
      [
        email,
        hashedPassword,
        phone_number,
        role,
        initialStatus,
        verificationToken,
        verificationExpires,
      ],
    );

    // Send email verification
    try {
      await sendEmailVerificationEmail(
        email,
        verificationToken,
        email.split("@")[0],
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue with registration even if email fails
    }

    // Return success without token - user needs to verify email first
    res.status(201).json({
      message:
        "Registration successful! Please check your email to verify your account before logging in.",
      user: {
        id: result.insertId,
        email,
        phone_number,
        role,
        status: initialStatus,
        email_verified: false,
      },
      requiresEmailVerification: true,
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
      "SELECT id, email, password_hash, phone_number, role, status, email_verified FROM users WHERE email = ?",
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

    // Check if email is verified (skip for admins and existing users who don't have verification set up)
    if (user.email_verified === false && user.role !== "admin") {
      return res.status(403).json({
        message: "Please verify your email address before logging in.",
        requiresEmailVerification: true,
        email: user.email,
      });
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
        phone_number: user.phone_number,
        role: user.role,
        status: user.status,
        email_verified: user.email_verified,
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
    await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      newHash,
      userId,
    ]);

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
      [email, userId],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Email is already in use by another account",
      });
    }

    // Get current user data for password verification
    const [userResult] = await db.query(
      "SELECT password_hash FROM users WHERE id = ?",
      [userId],
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
    await db.query("UPDATE users SET email = ? WHERE id = ?", [email, userId]);

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
      [phone_number, userId],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Phone number is already in use by another account",
      });
    }

    // Get current user data for password verification
    const [userResult] = await db.query(
      "SELECT password_hash FROM users WHERE id = ?",
      [userId],
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
    await db.query("UPDATE users SET phone_number = ? WHERE id = ?", [
      phone_number,
      userId,
    ]);

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

    if (userRole !== "tourist") {
      return res.status(403).json({
        message: "Only tourists can access balance information",
      });
    }

    const [result] = await db.query("SELECT balance FROM users WHERE id = ?", [
      userId,
    ]);

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      balance: parseFloat(result[0].balance) || 0,
      user_id: userId,
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({
      message: "Failed to get balance",
      error: error.message,
    });
  }
};

// Update user balance (for tourists only)
exports.updateBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { balance } = req.body;

    if (userRole !== "tourist") {
      return res.status(403).json({
        message: "Only tourists can update balance",
      });
    }

    // Validate balance
    if (
      balance === undefined ||
      isNaN(parseFloat(balance)) ||
      parseFloat(balance) < 0
    ) {
      return res.status(400).json({
        message: "Valid balance is required and must be non-negative",
      });
    }

    const newBalance = parseFloat(balance);

    // Get current balance for response
    const [currentResult] = await db.query(
      "SELECT balance FROM users WHERE id = ?",
      [userId],
    );

    if (currentResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousBalance = parseFloat(currentResult[0].balance);

    // Update balance
    await db.query("UPDATE users SET balance = ? WHERE id = ?", [
      newBalance,
      userId,
    ]);

    res.json({
      message: "Balance updated successfully",
      user_id: userId,
      balance: newBalance,
      previous_balance: previousBalance,
    });
  } catch (error) {
    console.error("Error updating balance:", error);
    res.status(500).json({
      message: "Failed to update balance",
      error: error.message,
    });
  }
};

// Simplified profile update methods without password verification (for basic profile info)
exports.updateEmailSimple = async (req, res) => {
  const userId = req.user.id;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required",
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
      [email, userId],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Email is already in use by another account",
      });
    }

    // Update email
    await db.query("UPDATE users SET email = ? WHERE id = ?", [email, userId]);

    res.json({ message: "Email updated successfully" });
  } catch (error) {
    console.error("Error updating email:", error);
    res
      .status(500)
      .json({ message: "Failed to update email", error: error.message });
  }
};

exports.updatePhoneSimple = async (req, res) => {
  const userId = req.user.id;
  const { phone_number } = req.body;

  if (!phone_number) {
    return res.status(400).json({
      message: "Phone number is required",
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
      [phone_number, userId],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Phone number is already in use by another account",
      });
    }

    // Update phone number
    await db.query("UPDATE users SET phone_number = ? WHERE id = ?", [
      phone_number,
      userId,
    ]);

    res.json({ message: "Phone number updated successfully" });
  } catch (error) {
    console.error("Error updating phone number:", error);
    res
      .status(500)
      .json({ message: "Failed to update phone number", error: error.message });
  }
};

// Refresh JWT token with latest user data from database
exports.refreshToken = async (req, res) => {
  try {
    const userId = req.user.id; // From authenticateToken middleware

    // Get fresh user data from database
    const [users] = await db.query(
      "SELECT id, email, phone_number, role, status FROM users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];

    // Create new JWT token with updated user data
    const newToken = jwt.sign(
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

    res.json({
      message: "Token refreshed successfully",
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({
      message: "Failed to refresh token",
      error: error.message,
    });
  }
};

// Forgot password - send reset email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required",
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
    // Check if user exists
    const [users] = await db.query(
      "SELECT id, email, full_name FROM users WHERE email = ?",
      [email],
    );

    // Always return success to prevent email enumeration attacks
    if (users.length === 0) {
      return res.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    const user = users[0];

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Clean up any existing unused tokens for this user
    await db.query(
      "DELETE FROM password_reset_tokens WHERE user_id = ? AND (used = TRUE OR expires_at < NOW())",
      [user.id],
    );

    // Store the reset token
    await db.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, resetToken, expiresAt],
    );

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken, user.full_name);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Don't expose email errors to client for security
      return res.status(500).json({
        message: "Failed to send password reset email. Please try again later.",
      });
    }

    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({
      message: "Error processing password reset request",
    });
  }
};

// Reset password using token
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      message: "Token and new password are required",
    });
  }

  // Validate new password
  if (newPassword.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long",
    });
  }

  try {
    // Find valid reset token
    const [tokens] = await db.query(
      `SELECT prt.*, u.id as user_id, u.email
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token = ? AND prt.used = FALSE AND prt.expires_at > NOW()`,
      [token],
    );

    if (tokens.length === 0) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    const resetData = tokens[0];

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      hashedPassword,
      resetData.user_id,
    ]);

    // Mark token as used
    await db.query(
      "UPDATE password_reset_tokens SET used = TRUE WHERE id = ?",
      [resetData.id],
    );

    // Clean up old tokens for this user
    await db.query(
      "DELETE FROM password_reset_tokens WHERE user_id = ? AND (used = TRUE OR expires_at < NOW())",
      [resetData.user_id],
    );

    res.json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(500).json({
      message: "Error resetting password",
    });
  }
};

// Verify email using token
exports.verifyEmail = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      message: "Verification token is required",
    });
  }

  try {
    // Find user with valid verification token
    const [users] = await db.query(
      "SELECT id, email, email_verified FROM users WHERE email_verification_token = ? AND email_verification_expires > NOW()",
      [token],
    );

    if (users.length === 0) {
      return res.status(400).json({
        message: "Invalid or expired verification token",
      });
    }

    const user = users[0];

    if (user.email_verified) {
      return res.status(400).json({
        message: "Email is already verified",
      });
    }

    // Mark email as verified and clear verification token
    await db.query(
      "UPDATE users SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL WHERE id = ?",
      [user.id],
    );

    res.json({
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error) {
    console.error("Error in email verification:", error);
    res.status(500).json({
      message: "Error verifying email",
    });
  }
};

// Resend email verification
exports.resendEmailVerification = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required",
    });
  }

  try {
    // Find user by email
    const [users] = await db.query(
      "SELECT id, email, email_verified, full_name FROM users WHERE email = ?",
      [email],
    );

    if (users.length === 0) {
      // Don't reveal if email exists or not
      return res.json({
        message:
          "If an account with that email exists and is unverified, a verification email has been sent.",
      });
    }

    const user = users[0];

    if (user.email_verified) {
      return res.status(400).json({
        message: "Email is already verified",
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Update verification token
    await db.query(
      "UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE id = ?",
      [verificationToken, verificationExpires, user.id],
    );

    // Send verification email
    try {
      await sendEmailVerificationEmail(
        email,
        verificationToken,
        user.full_name || email.split("@")[0],
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return res.status(500).json({
        message: "Failed to send verification email. Please try again later.",
      });
    }

    res.json({
      message:
        "If an account with that email exists and is unverified, a verification email has been sent.",
    });
  } catch (error) {
    console.error("Error in resend email verification:", error);
    res.status(500).json({
      message: "Error sending verification email",
    });
  }
};
