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

    // Temporarily disable foreign key checks to handle circular dependencies
    await db.query("SET FOREIGN_KEY_CHECKS = 0");
    
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
        // Re-enable foreign key checks before throwing
        await db.query("SET FOREIGN_KEY_CHECKS = 1");
        throw error;
      }
    }
    
    // Re-enable foreign key checks after all statements
    await db.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("Database schema created successfully!");
  } catch (error) {
    console.error("Error setting up database schema:", error);
    throw error;
  }
}

// Function to extract CREATE statement for a specific table
function extractCreateTableStatement(schemaSql, tableName) {
  // Split SQL by semicolons to get individual statements
  const statements = schemaSql
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  // Find the CREATE TABLE statement for the specific table
  const createStatement = statements.find((statement) => {
    // Case insensitive search for CREATE TABLE `tableName` or CREATE TABLE tableName
    const regex = new RegExp(
      `CREATE\\s+TABLE\\s+(?:\`?${tableName}\`?|\\b${tableName}\\b)\\s*\\(`,
      "i"
    );
    return regex.test(statement);
  });

  return createStatement;
}

// Function to create a specific table
async function createSpecificTable(tableName) {
  try {
    // Check if the table already exists
    const tableExists = await checkTableExists(tableName);

    if (tableExists) {
      console.log(`Table '${tableName}' already exists. Skipping creation.`);
      return;
    }

    // Read the schema SQL file
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    // Get the CREATE statement for the specific table
    const createStatement = extractCreateTableStatement(schemaSql, tableName);

    if (!createStatement) {
      console.error(`CREATE statement for table '${tableName}' not found in schema.sql`);
      throw new Error(`Table '${tableName}' not found in schema`);
    }

    console.log(`Creating table: ${tableName}`);
    
    // Disable foreign key checks temporarily in case this table has dependencies
    await db.query("SET FOREIGN_KEY_CHECKS = 0");

    // Execute the CREATE TABLE statement
    await db.query(createStatement);

    // Re-enable foreign key checks
    await db.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log(`Table '${tableName}' created successfully.`);
  } catch (error) {
    console.error(`Error creating table '${tableName}':`, error);
    throw error;
  }
}

// Function to handle CLI arguments
function handleCommand() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // If no arguments, create all tables
    return runSchema();
  } else if (args.length === 1) {
    // If one argument, create the specified table
    return createSpecificTable(args[0]);
  } else {
    console.error("Usage: node setupDb.js [tableName]");
    process.exit(1);
  }
}

// Add ability to run directly or as a module
if (require.main === module) {
  handleCommand()
    .then(() => {
      console.log("Schema setup complete.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Schema setup failed:", error);
      process.exit(1);
    });
}

module.exports = { runSchema, createSpecificTable };
