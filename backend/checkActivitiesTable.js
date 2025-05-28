const db = require('./config/db');

async function checkActivitiesTable() {
  try {
    console.log('Checking activities table structure...');
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'activities'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('Activities table columns:');
    columns.forEach(col => {
      console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\nChecking for time_slots column...');
    const hasTimeSlots = columns.some(col => col.COLUMN_NAME === 'time_slots');
    console.log(`time_slots column exists: ${hasTimeSlots}`);

    process.exit(0);
  } catch (error) {
    console.error('Error checking table structure:', error);
    process.exit(1);
  }
}

checkActivitiesTable();
