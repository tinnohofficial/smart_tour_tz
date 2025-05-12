// Script to add the 'cost' column to the destinations table
const db = require('./db');

async function addCostColumnToDestinations() {
  try {
    console.log('Checking if cost column exists in destinations table...');
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'destinations' 
      AND COLUMN_NAME = 'cost'
    `);

    if (columns.length > 0) {
      console.log('Cost column already exists in destinations table.');
      return;
    }

    console.log('Adding cost column to destinations table...');
    await db.query(`
      ALTER TABLE destinations
      ADD COLUMN cost DECIMAL(10, 2) DEFAULT 0 CHECK (cost >= 0)
    `);
    
    console.log('Setting default cost for all existing destinations...');
    await db.query(`
      UPDATE destinations
      SET cost = 0
      WHERE cost IS NULL
    `);

    console.log('Column added successfully!');
  } catch (error) {
    console.error('Error adding cost column to destinations table:', error);
    throw error;
  }
}

// Run the migration
addCostColumnToDestinations()
  .then(() => {
    console.log('Migration completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
