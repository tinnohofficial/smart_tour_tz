// Create test users for comprehensive system testing
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const testUsers = [
  { email: 'guide@tour.com', password: 'password123', role: 'tour_guide', first_name: 'John', last_name: 'Guide' },
  { email: 'agent@travel.com', password: 'password123', role: 'travel_agent', first_name: 'Jane', last_name: 'Agent' },
  { email: 'manager@hotel.com', password: 'password123', role: 'hotel_manager', first_name: 'Bob', last_name: 'Manager' }
];

async function createTestUsers() {
  try {
    console.log('Creating test users...');
    
    for (const user of testUsers) {
      // Check if user already exists
      const [existingUser] = await db.query('SELECT id FROM users WHERE email = ?', [user.email]);
      
      if (existingUser.length > 0) {
        console.log(`User ${user.email} already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Insert user
      await db.query(
        'INSERT INTO users (email, password, role, first_name, last_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [user.email, hashedPassword, user.role, user.first_name, user.last_name]
      );
      
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    }
    
    console.log('Test users creation completed!');
    
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await db.end();
  }
}

createTestUsers();
