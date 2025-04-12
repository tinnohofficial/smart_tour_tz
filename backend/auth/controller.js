const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const saltRounds = 10;

exports.register = async (req, res) => {
  const { email, password, phone_number, role } = req.body;
  console.log(email, password, phone_number, role);
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

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (user.status !== "active") {
      // Handle different statuses appropriately (e.g., prompt profile completion, inform about pending approval)
      return res.status(403).json({
        message: `Account not active. Status: ${user.status}. Please complete profile or wait for approval.`,
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
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
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
