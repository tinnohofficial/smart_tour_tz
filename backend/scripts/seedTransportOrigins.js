const db = require("../config/db");

const seedTransportOrigins = async () => {
  console.log("Starting transport origins seeding...");
  
  try {
    // Clear existing data
    await db.query("DELETE FROM transport_origins");
    console.log("Cleared existing transport origins");
    
    // Insert common Tanzania origins
    const origins = [
      { name: "Dar es Salaam", description: "Commercial capital and largest city of Tanzania" },
      { name: "Arusha", description: "Gateway to northern Tanzania safari circuit" },
      { name: "Mwanza", description: "Port city on Lake Victoria" },
      { name: "Dodoma", description: "Capital city of Tanzania" },
      { name: "Mbeya", description: "Highland city in southern Tanzania" },
      { name: "Tanga", description: "Coastal city in northern Tanzania" },
      { name: "Morogoro", description: "University town in eastern Tanzania" },
      { name: "Tabora", description: "Historic trade center in central Tanzania" },
      { name: "Kigoma", description: "Port town on Lake Tanganyika" },
      { name: "Iringa", description: "Highland town in southern Tanzania" },
      { name: "Mtwara", description: "Coastal town in southern Tanzania" },
      { name: "Lindi", description: "Coastal town in southern Tanzania" },
      { name: "Songea", description: "Town in southern Tanzania near Mozambique border" },
      { name: "Musoma", description: "Port town on Lake Victoria" },
      { name: "Bukoba", description: "Town on western shore of Lake Victoria" },
      { name: "Kilifi", description: "Airport serving Arusha and northern safari circuit" },
      { name: "Julius Nyerere International Airport", description: "Main international airport in Dar es Salaam" },
      { name: "Kilimanjaro International Airport", description: "International airport serving Arusha region" },
      { name: "Stone Town", description: "Historic center of Zanzibar City" },
      { name: "Zanzibar", description: "Semi-autonomous archipelago" }
    ];
    
    for (const origin of origins) {
      await db.query(
        "INSERT INTO transport_origins (name, description) VALUES (?, ?)",
        [origin.name, origin.description]
      );
    }
    
    console.log(`Seeded ${origins.length} transport origins successfully`);
    
    // Display the created origins
    const [created] = await db.query("SELECT * FROM transport_origins ORDER BY name");
    console.log("Created transport origins:");
    created.forEach(origin => {
      console.log(`- ${origin.id}: ${origin.name} - ${origin.description}`);
    });
    
  } catch (error) {
    console.error("Error seeding transport origins:", error);
    throw error;
  }
};

// Run the seeding if called directly
if (require.main === module) {
  seedTransportOrigins()
    .then(() => {
      console.log("Transport origins seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Transport origins seeding failed:", error);
      process.exit(1);
    });
}

module.exports = { seedTransportOrigins };
