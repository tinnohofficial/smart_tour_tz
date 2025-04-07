// backend/utils/authUtils.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const saltRounds = 10; // Adjust salt rounds as needed for security/performance balance

async function hashPassword(password) {
  return await bcrypt.hash(password, saltRounds);
}

async function comparePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

function generateAccessToken(user) {
  // Include necessary non-sensitive user info in the token payload
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status, // Include status if needed for frontend logic
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  }); // Use env var for expiry
}

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
};
