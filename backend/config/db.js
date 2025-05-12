const mysql = require("mysql2/promise");
require("dotenv").config();

// Log environment variables for debugging (without sensitive info)
console.log("Database connection info:");
console.log("- DB_HOST:", process.env.DB_HOST ? `${process.env.DB_HOST.substring(0, 10)}...` : 'not set');
console.log("- DB_NAME:", process.env.DB_NAME || 'not set');
console.log("- JAWSDB_URL:", process.env.JAWSDB_URL ? 'set (value hidden)' : 'not set');

let pool;

// Try to use JAWSDB_URL if available (Heroku), otherwise use individual credentials
if (process.env.JAWSDB_URL) {
  // Parse the JAWSDB_URL to get the connection details
  pool = mysql.createPool(process.env.JAWSDB_URL);
  console.log("Using JawsDB connection via URL");
} else if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
  // Fallback to using individual credentials from .env
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Add SSL configuration for Heroku JawsDB
    ssl: {
      rejectUnauthorized: false
    }
  };
  
  pool = mysql.createPool(config);
  console.log("Using database connection with credentials from .env");
} else {
  console.error("ERROR: Database configuration missing! Check your .env file.");
  console.error("Required variables: DB_HOST, DB_USER, DB_NAME or JAWSDB_URL");
  process.exit(1); // Exit the application to prevent further errors
}

// Test database connection function - outside the if/else block
async function testConnection() {
  const MAX_RETRIES = 3;
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      const connection = await pool.getConnection();
      console.log("Database connection established successfully!");
      connection.release();
      return true;
    } catch (error) {
      retries++;
      console.error(`Failed to connect to database (attempt ${retries}/${MAX_RETRIES}):`, error);
      
      if (retries < MAX_RETRIES) {
        console.log(`Retrying connection in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
      } else {
        console.error("Could not connect to MySQL database. Please ensure that:");
        console.error("1. Your .env file has the correct JawsDB credentials");
        console.error("2. Your network can reach the JawsDB instance");
        console.error("3. The database exists and is accessible with the provided credentials");
        console.error("\nMySQL connection error details:", error);
        return false;
      }
    }
  }
  return false;
}

// Call the test connection function
testConnection();

module.exports = pool;
