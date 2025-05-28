const db = require('../config/db');
const bcrypt = require('bcrypt');

async function createTestUsers() {
  try {
    // Create travel agent
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', ['agent1@example.com']);
    
    let agentId;
    if (existing.length > 0) {
      console.log('Travel agent already exists');
      agentId = existing[0].id;
    } else {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const [result] = await db.query(
        'INSERT INTO users (email, password_hash, phone_number, role, status) VALUES (?, ?, ?, ?, ?)',
        ['agent1@example.com', hashedPassword, '+255987654321', 'travel_agent', 'active']
      );
      agentId = result.insertId;
      console.log('Travel agent created with ID:', agentId);
    }
    
    // Create travel agency
    await db.query(
      'INSERT INTO travel_agencies (id, name, document_url) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)',
      [agentId, 'Safari Express Transport', 'https://example.com/license.pdf']
    );
    
    // Get origins and destinations
    const [origins] = await db.query('SELECT id, name FROM transport_origins ORDER BY name LIMIT 5');
    const [destinations] = await db.query('SELECT id, name FROM destinations ORDER BY name LIMIT 3');
    
    if (origins.length === 0 || destinations.length === 0) {
      console.log('No origins or destinations found. Please seed them first.');
      return;
    }
    
    // Create transport routes if they don't exist
    const [existingRoutes] = await db.query('SELECT COUNT(*) as count FROM transports WHERE agency_id = ?', [agentId]);
    
    if (existingRoutes[0].count === 0) {
      const routes = [
        { origin_id: origins[0].id, destination_id: destinations[0].id, type: 'bus', cost: 50000, desc: 'Daily bus service' },
        { origin_id: origins[1].id, destination_id: destinations[0].id, type: 'plane', cost: 250000, desc: 'Flight service' },
        { origin_id: origins[0].id, destination_id: destinations[1]?.id || destinations[0].id, type: 'bus', cost: 75000, desc: 'Express bus service' },
        { origin_id: origins[2]?.id || origins[0].id, destination_id: destinations[1]?.id || destinations[0].id, type: 'train', cost: 45000, desc: 'Train service' }
      ];
      
      for (const route of routes) {
        await db.query(
          'INSERT INTO transports (agency_id, origin_id, destination_id, transportation_type, cost, description) VALUES (?, ?, ?, ?, ?, ?)',
          [agentId, route.origin_id, route.destination_id, route.type, route.cost, route.desc]
        );
      }
      
      console.log('Created transport routes successfully');
    } else {
      console.log('Transport routes already exist');
    }
    
    console.log('Test setup complete!');
    
  } catch (error) {
    console.error('Error creating test users:', error);
  }
}

// Run if called directly
if (require.main === module) {
  createTestUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestUsers };
