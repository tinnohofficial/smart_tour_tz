const db = require("./db");
const fs = require("fs");
const path = require("path");

async function checkTableExists(tableName) {
  try {
    const [rows] = await db.query(
      `
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = ?
    `,
      [tableName],
    );

    return rows[0].count > 0;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    throw error;
  }
}

async function runSchema() {
  try {
    // Check if users table exists as a benchmark for database setup
    const usersTableExists = await checkTableExists("users");

    if (usersTableExists) {
      console.log("Database tables already exist. Skipping schema creation.");
      return;
    }

    console.log("Setting up database schema...");

    // Read the schema SQL file
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    // Split SQL by semicolons to execute each statement separately
    const statements = schemaSql
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    // Execute each statement individually for better error tracking
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await db.query(statement);
        console.log(
          `Statement ${i + 1}/${statements.length} executed successfully`,
        );
      } catch (error) {
        console.error(
          `Error executing statement ${i + 1}/${statements.length}:`,
        );
        console.error(statement);
        throw error; // Re-throw to stop execution
      }
    }

    console.log("Database schema created successfully!");
  } catch (error) {
    console.error("Error setting up database schema:", error);
    throw error;
  }
}

// Add ability to run directly or as a module
if (require.main === module) {
  runSchema()
    .then(() => {
      console.log("Schema setup complete.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Schema setup failed:", error);
      process.exit(1);
    });
}

module.exports = { runSchema };
