const db = require("./db");
const fs = require("fs");
const path = require("path");

// Function to clean up uploads directory
function cleanUploadsDirectory() {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    // Check if the uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      console.log("Uploads directory doesn't exist. Nothing to clean.");
      return;
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(uploadsDir);
    
    // Keep .gitkeep file, delete everything else
    let deletedCount = 0;
    for (const file of files) {
      if (file !== '.gitkeep') {
        const filePath = path.join(uploadsDir, file);
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
    
    console.log(`Cleaned uploads directory: ${deletedCount} files removed.`);
  } catch (error) {
    console.error("Error cleaning uploads directory:", error);
  }
}

async function dropAllTables() {
  try {
    // Disable foreign key checks to avoid constraint errors when dropping tables
    await db.query("SET FOREIGN_KEY_CHECKS = 0");

    // Get all tables in the current database
    const [tables] = await db.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
    `);

    console.log(`Found ${tables.length} tables to drop.`);

    // Drop each table
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`Dropping table: ${tableName}`);
      await db.query(`DROP TABLE \`${tableName}\``);
    }

    // Re-enable foreign key checks
    await db.query("SET FOREIGN_KEY_CHECKS = 1");
    
    // Clean uploads directory
    cleanUploadsDirectory();

    console.log("All tables dropped successfully.");
  } catch (error) {
    console.error("Error dropping tables:", error);
    throw error;
  }
}

async function dropSpecificTable(tableName) {
  try {
    // Check if the table exists
    const [exists] = await db.query(
      `
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = ?
    `,
      [tableName],
    );

    if (exists[0].count === 0) {
      console.log(`Table '${tableName}' does not exist. Nothing to drop.`);
      return;
    }

    // Disable foreign key checks to avoid constraint errors
    await db.query("SET FOREIGN_KEY_CHECKS = 0");

    // Drop the specified table
    console.log(`Dropping table: ${tableName}`);
    await db.query(`DROP TABLE \`${tableName}\``);

    // Re-enable foreign key checks
    await db.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log(`Table '${tableName}' dropped successfully.`);
  } catch (error) {
    console.error(`Error dropping table '${tableName}':`, error);
    throw error;
  }
}

// Function to handle CLI arguments
function handleCommand() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // If no arguments, drop all tables and clean uploads
    return dropAllTables();
  } else if (args.length === 1 && args[0] === 'clean-uploads') {
    // Just clean uploads without dropping tables
    cleanUploadsDirectory();
    return Promise.resolve();
  } else if (args.length === 1) {
    // If one argument, drop the specified table
    return dropSpecificTable(args[0]);
  } else {
    console.error("Usage: node teardownDb.js [tableName|clean-uploads]");
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  handleCommand()
    .then(() => {
      console.log("Database teardown complete.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Database teardown failed:", error);
      process.exit(1);
    });
}

module.exports = { dropAllTables, dropSpecificTable, cleanUploadsDirectory };
