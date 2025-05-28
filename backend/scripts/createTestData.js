const db = require("../config/db");
const bcrypt = require("bcrypt");

const createTestData = async () => {
  try {
    console.log("Creating comprehensive test data...");

    // 1. Create test travel agent
    console.log("1. Creating travel agent...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    let agentUserId;
    try {
      const [agentResult] = await db.query(
        `INSERT INTO users (email, password_hash, role, status) 
         VALUES (?, ?, 'travel_agent', 'active')`,
        ["agent1@example.com", hashedPassword]
      );
      agentUserId = agentResult.insertId;
      console.log(`Travel agent created with ID: ${agentUserId}`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        // User already exists, get the existing ID
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', ["agent1@example.com"]);
        agentUserId = existing[0].id;
        console.log(`Travel agent already exists with ID: ${agentUserId}`);
      } else {
        throw error;
      }
    }

    // Create travel agency profile (if not exists)
    try {
      await db.query(
        `INSERT INTO travel_agencies (id, name, contact_phone, contact_email)
         VALUES (?, ?, ?, ?)`,
        [agentUserId, "Safari Express Travel", "+255123456789", "agent1@example.com"]
      );
      console.log("Travel agency profile created");
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log("Travel agency profile already exists");
      } else {
        throw error;
      }
    }

    // 2. Create test destinations (if they don't exist)
    console.log("2. Creating destinations...");
    const destinations = [
      { name: "Serengeti National Park", region: "Mara", cost: 50.00, description: "Famous wildlife park" },
      { name: "Mount Kilimanjaro", region: "Moshi", cost: 75.00, description: "Africa's highest peak" },
      { name: "Zanzibar Beach", region: "Zanzibar", cost: 40.00, description: "Beautiful beaches and culture" },
    ];

    const destinationIds = [];
    for (const dest of destinations) {
      try {
        const [result] = await db.query(
          `INSERT INTO destinations (name, region, cost, description) 
           VALUES (?, ?, ?, ?)`,
          [dest.name, dest.region, dest.cost, dest.description]
        );
        destinationIds.push(result.insertId);
        console.log(`  Created destination: ${dest.name} (ID: ${result.insertId})`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          // Destination already exists, get its ID
          const [existing] = await db.query('SELECT id FROM destinations WHERE name = ?', [dest.name]);
          if (existing.length > 0) {
            destinationIds.push(existing[0].id);
            console.log(`  Destination already exists: ${dest.name} (ID: ${existing[0].id})`);
          }
        } else {
          throw error;
        }
      }
    }

    // 3. Get some transport origins (we already have 20 from seeding)
    console.log("3. Getting transport origins...");
    const [origins] = await db.query('SELECT id, name FROM transport_origins LIMIT 10');
    console.log(`Found ${origins.length} transport origins`);

    // 4. Create transport routes
    console.log("4. Creating transport routes...");
    const transportTypes = ['bus', 'air', 'train'];
    const routes = [];

    // Create routes from different origins to our destinations
    for (let i = 0; i < Math.min(5, origins.length); i++) {
      for (let j = 0; j < Math.min(2, destinationIds.length); j++) {
        const origin = origins[i];
        const destinationId = destinationIds[j];
        const transportType = transportTypes[Math.floor(Math.random() * transportTypes.length)];
        const cost = (Math.random() * 100 + 20).toFixed(2); // Random cost between 20-120

        const routeDetails = {
          departure_times: ['08:00', '14:00', '20:00'],
          booking_info: `Book via ${transportType} from ${origin.name}`,
          contact_details: `Contact: +255123456789`
        };

        try {
          const [routeResult] = await db.query(
            `INSERT INTO transports (agency_id, origin_id, destination_id, transportation_type, cost, description, route_details)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              agentUserId,
              origin.id,
              destinationId,
              transportType,
              cost,
              `${transportType.charAt(0).toUpperCase() + transportType.slice(1)} service from ${origin.name}`,
              JSON.stringify(routeDetails)
            ]
          );

          routes.push({
            id: routeResult.insertId,
            origin: origin.name,
            destination: destinationId,
            type: transportType,
            cost: cost
          });

          console.log(`  Created route: ${origin.name} → Destination ${destinationId} (${transportType}, $${cost})`);
        } catch (error) {
          console.error(`  Error creating route from ${origin.name}:`, error.message);
        }
      }
    }

    // 5. Create a test tourist
    console.log("5. Creating test tourist...");
    let touristUserId;
    try {
      const [touristResult] = await db.query(
        `INSERT INTO users (email, password_hash, role, status) 
         VALUES (?, ?, 'tourist', 'active')`,
        ["tourist1@example.com", hashedPassword]
      );
      touristUserId = touristResult.insertId;
      console.log(`Tourist created with ID: ${touristUserId}`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', ["tourist1@example.com"]);
        touristUserId = existing[0].id;
        console.log(`Tourist already exists with ID: ${touristUserId}`);
      } else {
        throw error;
      }
    }

    // 6. Create savings account for tourist (if not exists)
    try {
      await db.query(
        `INSERT INTO savings_accounts (user_id, balance) VALUES (?, ?)`,
        [touristUserId, 500.00]
      );
      console.log("Savings account created for tourist");
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log("Savings account already exists for tourist");
      } else {
        throw error;
      }
    }

    console.log("✅ Test data creation completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`- Travel Agent: agent1@example.com (password: password123)`);
    console.log(`- Tourist: tourist1@example.com (password: password123)`);
    console.log(`- Destinations: ${destinationIds.length}`);
    console.log(`- Transport Routes: ${routes.length}`);
    console.log(`- Transport Origins: ${origins.length} available`);
    
    console.log("\n🧪 Test Instructions:");
    console.log("1. Login as tourist1@example.com");
    console.log("2. Go to any destination booking page");
    console.log("3. Select an origin from the dropdown in step 2");
    console.log("4. Verify that transport routes are filtered based on the selected origin");
    console.log("5. Complete a booking to test the full flow");

    return {
      agentUserId,
      touristUserId,
      destinationIds,
      routes,
      origins: origins.slice(0, 5)
    };

  } catch (error) {
    console.error("❌ Error creating test data:", error);
    throw error;
  }
};

// Run the script
if (require.main === module) {
  createTestData()
    .then(() => {
      console.log("\n🎉 Test data creation script completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

module.exports = createTestData;
