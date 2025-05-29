const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const API_URL = 'http://localhost:3002/api';
const TEST_OUTPUT_DIR = path.join(__dirname, 'test-output');

// Create output directory if it doesn't exist
if (!fs.existsSync(TEST_OUTPUT_DIR)) {
  fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
}

// Test credentials
const TEST_USERS = {
  admin: { email: 'admin@example.com', password: 'password123' },
  travelAgent: { email: 'agent1@example.com', password: 'password123' },
  tourist: { email: 'tourist1@example.com', password: 'password123' }
};

let authTokens = {};

// Helper function to authenticate users
async function authenticateUser(userType) {
  try {
    const user = TEST_USERS[userType];
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });

    if (!response.ok) {
      throw new Error(`Authentication failed for ${userType}: ${response.statusText}`);
    }

    const data = await response.json();
    authTokens[userType] = data.token;
    console.log(`✅ ${userType} authenticated successfully`);
    return data.token;
  } catch (error) {
    console.error(`❌ Authentication failed for ${userType}:`, error.message);
    throw error;
  }
}

// Test creating multi-leg transport route
async function testCreateMultiLegRoute() {
  console.log('\n🚀 Testing Multi-leg Transport Route Creation...');
  
  const multiLegRoute = {
    origin_id: 1, // Assuming origin ID 1 exists
    destination_id: 1, // Assuming destination ID 1 exists  
    transportation_type: 'air',
    cost: 1250.00,
    description: 'Complex multi-leg journey from Manchester to Ngorongoro with connecting flights and ground transport',
    route_details: {
      legs: [
        {
          departure: 'Manchester Airport (MAN)',
          arrival: 'Doha International Airport (DOH)',
          carrier: 'Qatar Airways',
          departure_time: '14:30',
          arrival_time: '23:45',
          flight_number: 'QR23',
          duration_hours: 7.5,
          gate_info: 'Gate B12',
          seat_class: 'Economy'
        },
        {
          departure: 'Doha International Airport (DOH)',
          arrival: 'Kilimanjaro International Airport (JRO)',
          carrier: 'Qatar Airways',
          departure_time: '02:15',
          arrival_time: '08:30',
          flight_number: 'QR1463',
          duration_hours: 4.5,
          layover_duration: 2.5,
          gate_info: 'Gate A5'
        },
        {
          departure: 'Kilimanjaro International Airport (JRO)',
          arrival: 'Arusha Bus Station',
          carrier: 'Kilimanjaro Express',
          departure_time: '10:00',
          arrival_time: '11:30',
          duration_hours: 1.5,
          transport_mode: 'bus',
          pickup_location: 'Airport Terminal Exit'
        },
        {
          departure: 'Arusha Bus Station',
          arrival: 'Ngorongoro Conservation Area',
          carrier: 'Safari Transport Co.',
          departure_time: '13:00',
          arrival_time: '16:30',
          duration_hours: 3.5,
          transport_mode: 'safari_vehicle',
          vehicle_type: '4WD Safari Jeep'
        }
      ],
      total_duration: '26 hours',
      booking_instructions: 'Check-in 3 hours before international flights. Layover in Doha includes lounge access. Ground transport tickets will be provided at Kilimanjaro Airport. Safari vehicle includes game drive equipment.',
      included_services: ['meals', 'baggage', 'lounge_access', 'game_drive_equipment'],
      contact_info: {
        emergency_contact: '+255 27 250 4058',
        whatsapp: '+255 768 123 456'
      },
      special_notes: 'Passport required for international flights. Yellow fever vaccination certificate may be required. Safari portion includes park entry fees.'
    }
  };

  try {
    const response = await fetch(`${API_URL}/transports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens.travelAgent}`
      },
      body: JSON.stringify(multiLegRoute)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to create route: ${response.statusText} - ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log(`  ✅ Multi-leg route created successfully: ID ${result.id}`);
    console.log(`  📊 Route: ${result.origin} → ${result.destination}`);
    console.log(`  💰 Cost: TZS ${result.cost} /=`);
    
    return result;
  } catch (error) {
    console.error(`  ❌ Failed to create multi-leg route:`, error.message);
    return null;
  }
}

// Test fetching transport routes with filtering
async function testFetchTransportRoutes() {
  console.log('\n📋 Testing Transport Routes Retrieval...');
  
  try {
    // Test without filters
    console.log('  📝 Fetching all routes...');
    let response = await fetch(`${API_URL}/transports`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch routes: ${response.statusText}`);
    }
    
    let routes = await response.json();
    console.log(`  ✅ Retrieved ${routes.length} total routes`);
    
    // Test with origin filter
    console.log('  📝 Fetching routes with origin filter...');
    response = await fetch(`${API_URL}/transports?origin_id=1`);
    
    if (response.ok) {
      const filteredRoutes = await response.json();
      console.log(`  ✅ Retrieved ${filteredRoutes.length} routes from origin ID 1`);
    }
    
    // Test route details parsing
    if (routes.length > 0) {
      const routeWithDetails = routes.find(route => route.route_details && route.route_details.legs);
      if (routeWithDetails) {
        console.log(`  ✅ Found route with detailed leg information: ${routeWithDetails.id}`);
        console.log(`  📊 Legs: ${routeWithDetails.route_details.legs.length}`);
        console.log(`  🕒 Total duration: ${routeWithDetails.route_details.total_duration || 'Not specified'}`);
      }
    }
    
    return routes;
  } catch (error) {
    console.error(`  ❌ Failed to fetch transport routes:`, error.message);
    return [];
  }
}

// Test booking flow with multi-leg transport
async function testBookingWithMultiLegTransport(transportId) {
  console.log('\n🎫 Testing Booking with Multi-leg Transport...');
  
  if (!transportId) {
    console.log('  ⚠️ No transport ID provided, skipping booking test');
    return null;
  }
  
  const bookingData = {
    transportId: transportId,
    hotelId: null,
    activityIds: [],
    startDate: '2024-06-15',
    endDate: '2024-06-20',
    destinationId: 1,
    includeTransport: true,
    includeHotel: false,
    includeActivities: false
  };
  
  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens.tourist}`
      },
      body: JSON.stringify(bookingData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Booking failed: ${response.statusText} - ${errorData.message || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log(`  ✅ Booking created successfully: ID ${result.bookingId}`);
    console.log(`  💰 Total cost: $${result.totalCost}`);
    
    return result;
  } catch (error) {
    console.error(`  ❌ Booking failed:`, error.message);
    return null;
  }
}

// Test transport origins management
async function testTransportOrigins() {
  console.log('\n🌍 Testing Transport Origins...');
  
  try {
    const response = await fetch(`${API_URL}/transport-origins`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch origins: ${response.statusText}`);
    }
    
    const origins = await response.json();
    console.log(`  ✅ Retrieved ${origins.length} transport origins`);
    
    if (origins.length > 0) {
      console.log(`  📍 Sample origins:`);
      origins.slice(0, 5).forEach(origin => {
        console.log(`    - ${origin.name} (${origin.country || 'Tanzania'})`);
      });
    }
    
    return origins;
  } catch (error) {
    console.error(`  ❌ Failed to fetch transport origins:`, error.message);
    return [];
  }
}

// Main test runner
async function runTransportRouteTests() {
  console.log('🧪 Starting Transport Route Tests');
  console.log('='.repeat(50));
  
  const results = {
    testDate: new Date().toISOString(),
    tests: {},
    summary: {}
  };
  
  try {
    // Authenticate users
    console.log('\n🔐 Authenticating test users...');
    await authenticateUser('admin');
    await authenticateUser('travelAgent');
    await authenticateUser('tourist');
    
    // Test 1: Transport Origins
    const origins = await testTransportOrigins();
    results.tests.origins = {
      success: origins.length > 0,
      count: origins.length,
      data: origins.slice(0, 3)
    };
    
    // Test 2: Create Multi-leg Route
    const createdRoute = await testCreateMultiLegRoute();
    results.tests.routeCreation = {
      success: createdRoute !== null,
      routeId: createdRoute?.id || null,
      data: createdRoute
    };
    
    // Test 3: Fetch Routes
    const routes = await testFetchTransportRoutes();
    results.tests.routeRetrieval = {
      success: routes.length > 0,
      count: routes.length,
      multiLegCount: routes.filter(r => r.route_details && r.route_details.legs).length
    };
    
    // Test 4: Booking with Multi-leg Transport
    const booking = await testBookingWithMultiLegTransport(createdRoute?.id);
    results.tests.booking = {
      success: booking !== null,
      bookingId: booking?.bookingId || null,
      data: booking
    };
    
    // Generate summary
    const successfulTests = Object.values(results.tests).filter(test => test.success).length;
    const totalTests = Object.keys(results.tests).length;
    
    results.summary = {
      totalTests,
      successfulTests,
      failedTests: totalTests - successfulTests,
      successRate: Math.round((successfulTests / totalTests) * 100)
    };
    
    // Save results
    const resultsFile = path.join(TEST_OUTPUT_DIR, 'transport-routes-test-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    // Print summary
    console.log('\n📋 Test Summary');
    console.log('='.repeat(50));
    console.log(`📊 Tests completed: ${totalTests}`);
    console.log(`✅ Tests passed: ${successfulTests}`);
    console.log(`❌ Tests failed: ${results.summary.failedTests}`);
    console.log(`📈 Success rate: ${results.summary.successRate}%`);
    
    if (origins.length > 0) {
      console.log(`🌍 Transport origins available: ${origins.length}`);
    }
    
    if (routes.length > 0) {
      const multiLegRoutes = routes.filter(r => r.route_details && r.route_details.legs);
      console.log(`🚗 Total transport routes: ${routes.length}`);
      console.log(`🔗 Multi-leg routes: ${multiLegRoutes.length}`);
    }
    
    console.log(`\n💾 Detailed results saved to: ${resultsFile}`);
    console.log(`\n✅ Transport route testing completed!`);
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTransportRouteTests().catch(console.error);
}

module.exports = {
  runTransportRouteTests,
  authenticateUser,
  testCreateMultiLegRoute,
  testFetchTransportRoutes,
  testBookingWithMultiLegTransport,
  testTransportOrigins
};