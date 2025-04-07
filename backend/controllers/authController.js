// backend/controllers/authController.js
const db = require("../db");
const {
  hashPassword,
  comparePassword,
  generateAccessToken,
} = require("../utils/authUtils");

exports.register = async (req, res) => {
  const { email, password, phone_number, role } = req.body;

  // Basic Validation
  if (!email || !password || !role) {
    return res
      .status(400)
      .json({ message: "Email, password, and role are required." });
  }
  if (
    !["tourist", "tour_guide", "hotel_manager", "travel_agent"].includes(role)
  ) {
    return res
      .status(400)
      .json({ message: "Invalid role selected for registration." });
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

    const hashedPassword = await hashPassword(password);
    const initialStatus = role === "tourist" ? "active" : "pending_profile"; // Tourists are active immediately, others need profile/approval

    const [result] = await db.query(
      "INSERT INTO users (email, password_hash, phone_number, role, status) VALUES (?, ?, ?, ?, ?)",
      [email, hashedPassword, phone_number, role, initialStatus],
    );

    // If tourist, create savings account
    if (role === "tourist") {
      await db.query(
        "INSERT INTO savings_accounts (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id=user_id",
        [result.insertId],
      );
    }

    // Don't send password hash back!
    res.status(201).json({
      message:
        "User registered successfully. Please complete your profile if required.",
      userId: result.insertId,
      role,
      status: initialStatus,
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

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (user.status !== "active") {
      // Handle different statuses appropriately (e.g., prompt profile completion, inform about pending approval)
      return res.status(403).json({
        message: `Account not active. Status: ${user.status}. Please complete profile or wait for approval.`,
      });
    }

    const token = generateAccessToken(user);

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
