const db = require("../config/db");
const bcrypt = require("bcrypt");

const addTestHotel = async () => {
  try {
    console.log("Adding test hotel and hotel manager...");

    // 1. Create hotel manager user
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    let hotelManagerId;
    try {
      const [managerResult] = await db.query(
        `INSERT INTO users (email, password_hash, role, status) 
         VALUES (?, ?, 'hotel_manager', 'active')`,
        ["hotel1@example.com", hashedPassword]
      );
      hotelManagerId = managerResult.insertId;
      console.log(`Hotel manager created with ID: ${hotelManagerId}`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', ["hotel1@example.com"]);
        hotelManagerId = existing[0].id;
        console.log(`Hotel manager already exists with ID: ${hotelManagerId}`);
      } else {
        throw error;
      }
    }

    // 2. Create hotel
    try {
      // First get Serengeti destination ID
      const [serengetiDest] = await db.query(
        "SELECT id FROM destinations WHERE name = ?",
        ["Serengeti National Park"]
      );
      
      if (serengetiDest.length === 0) {
        throw new Error("Serengeti National Park destination not found. Please run createTestData.js first.");
      }
      
      const [hotelResult] = await db.query(
        `INSERT INTO hotels (id, name, destination_id, description, capacity, base_price_per_night)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          hotelManagerId,
          "Safari Lodge Serengeti",
          serengetiDest[0].id,
          "Luxury safari lodge with stunning wildlife views",
          50,
          120.00
        ]
      );
      console.log("Hotel created successfully");
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log("Hotel already exists");
      } else {
        throw error;
      }
    }

    // 3. Add another hotel for Mount Kilimanjaro
    let hotelManager2Id;
    try {
      const [manager2Result] = await db.query(
        `INSERT INTO users (email, password_hash, role, status) 
         VALUES (?, ?, 'hotel_manager', 'active')`,
        ["hotel2@example.com", hashedPassword]
      );
      hotelManager2Id = manager2Result.insertId;
      console.log(`Second hotel manager created with ID: ${hotelManager2Id}`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', ["hotel2@example.com"]);
        hotelManager2Id = existing[0].id;
        console.log(`Second hotel manager already exists with ID: ${hotelManager2Id}`);
      } else {
        throw error;
      }
    }

    try {
      // First get Mount Kilimanjaro destination ID
      const [kiliDest] = await db.query(
        "SELECT id FROM destinations WHERE name = ?",
        ["Mount Kilimanjaro"]
      );
      
      if (kiliDest.length === 0) {
        throw new Error("Mount Kilimanjaro destination not found. Please run createTestData.js first.");
      }
      
      const [hotel2Result] = await db.query(
        `INSERT INTO hotels (id, name, destination_id, description, capacity, base_price_per_night)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          hotelManager2Id,
          "Kilimanjaro View Lodge",
          kiliDest[0].id,
          "Mountain lodge with breathtaking views of Kilimanjaro",
          30,
          95.00
        ]
      );
      console.log("Second hotel created successfully");
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log("Second hotel already exists");
      } else {
        throw error;
      }
    }

    console.log("✅ Test hotels created successfully!");
    console.log("Test accounts:");
    console.log("- Hotel Manager 1: hotel1@example.com (password: password123)");
    console.log("- Hotel Manager 2: hotel2@example.com (password: password123)");

  } catch (error) {
    console.error("❌ Error creating test hotel:", error);
    throw error;
  }
};

// Run the script
if (require.main === module) {
  addTestHotel()
    .then(() => {
      console.log("🎉 Test hotel creation completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
} else {
  // When required as a module, still run the function
  addTestHotel().catch(console.error);
}

module.exports = addTestHotel;
