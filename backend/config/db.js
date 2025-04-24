const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

// Check if we're running on Heroku (with JAWSDB_URL)
if (process.env.JAWSDB_URL) {
  // Parse the JAWSDB_URL to get the connection details
  pool = mysql.createPool(process.env.JAWSDB_URL);
  console.log("Using JawsDB connection on Heroku");
} else {
  // Local development connection
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  console.log("Using local database connection");
}

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Database connection established successfully!");
    connection.release();
    return true;
  } catch (error) {
    console.error("Failed to connect to database:", error);
    return false;
  }
}

testConnection();

module.exports = pool;
