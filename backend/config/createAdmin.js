require("dotenv").config();
const db = require("../config/db");
const bcrypt = require("bcrypt");

async function createAdminUser(email, password, phoneNumber) {
  try {
    // Check if admin already exists
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ? OR role = 'admin'",
      [email],
    );

    if (existingUsers.length > 0) {
      console.log("Admin user already exists or email is already in use");
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert admin user
    const [result] = await db.query(
      "INSERT INTO users (email, password_hash, phone_number, role, status) VALUES (?, ?, ?, 'admin', 'active')",
      [email, hashedPassword, phoneNumber],
    );

    console.log(`Admin created successfully with ID: ${result.insertId}`);
    return result.insertId;
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
  // Removed process.exit() from finally block to make function reusable
}

// Only execute the standalone creation flow if this file is run directly
if (require.main === module) {
  // Get arguments from command line
  const args = process.argv.slice(2);
  const email = args[0] || "admin@example.com";
  const password = args[1] || "password123"; // You should use a stronger password in production
  const phoneNumber = args[2] || "+1234567890";

  // Run the function
  createAdminUser(email, password, phoneNumber)
    .then(() => {
      console.log("Admin creation process complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed to create admin:", error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };
