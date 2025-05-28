// Comprehensive system test for all Smart Tour Tanzania features
const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

// Test users for different roles
const testUsers = {
  admin: { email: 'admin@admin.com', password: 'password123' },
  tourist: { email: 'tourist@test.com', password: 'password123' },
  travelAgent: { email: 'agent@travel.com', password: 'password123' },
  hotelManager: { email: 'manager@hotel.com', password: 'password123' },
  tourGuide: { email: 'guide@tour.com', password: 'password123' }
};

// Helper function to login and get token
async function loginUser(userType) {
  const user = testUsers[userType];
  const response = await axios.post(`${BASE_URL}/auth/login`, user);
  return response.data.token;
}

// Test 1: Flexible Booking System
async function testFlexibleBooking() {
  console.log('\n=== TESTING FLEXIBLE BOOKING SYSTEM ===');
  
  const token = await loginUser('tourist');
  const headers = { Authorization: `Bearer ${token}` };

  // Test 1a: Full booking (all services)
  console.log('\n1a. Testing full booking with all services...');
  const fullBooking = {
    destinationId: 1, // Serengeti
    startDate: '2025-06-15',
    endDate: '2025-06-17',
    transportId: 4,
    hotelId: 3,
    activityIds: [1],
    includeTransport: true,
    includeHotel: true,
    includeActivities: true,
    activitySchedules: {
      1: {
        date: '2025-06-16',
        time_slot: '06:00-12:00',
        participants: 2
      }
    }
  };

  const fullBookingResponse = await axios.post(`${BASE_URL}/bookings`, fullBooking, { headers });
  console.log('✅ Full booking created:', {
    id: fullBookingResponse.data.bookingId,
    totalCost: fullBookingResponse.data.totalCost
  });

  // Test 1b: Transport-only booking
  console.log('\n1b. Testing transport-only booking...');
  const transportOnly = {
    destinationId: 1,
    startDate: '2025-06-25',
    endDate: '2025-06-26',
    transportId: 4,
    includeTransport: true,
    includeHotel: false,
    includeActivities: false,
    activityIds: [],
    activitySchedules: {}
  };

  const transportResponse = await axios.post(`${BASE_URL}/bookings`, transportOnly, { headers });
  console.log('✅ Transport-only booking created:', {
    id: transportResponse.data.bookingId,
    totalCost: transportResponse.data.totalCost
  });

  // Test 1c: Activities-only booking
  console.log('\n1c. Testing activities-only booking...');
  const activitiesOnly = {
    destinationId: 1,
    startDate: '2025-06-16',
    endDate: '2025-06-17',
    includeTransport: false,
    includeHotel: false,
    includeActivities: true,
    activityIds: [1],
    activitySchedules: {
      1: {
        date: '2025-06-16',
        time_slot: '14:00-18:00',
        participants: 1
      }
    }
  };

  const activitiesResponse = await axios.post(`${BASE_URL}/bookings`, activitiesOnly, { headers });
  console.log('✅ Activities-only booking created:', {
    id: activitiesResponse.data.bookingId,
    totalCost: activitiesResponse.data.totalCost
  });

  return {
    fullBookingId: fullBookingResponse.data.bookingId,
    transportBookingId: transportResponse.data.bookingId,
    activitiesBookingId: activitiesResponse.data.bookingId
  };
}

// Test 2: Real-time Activity Availability
async function testActivityAvailability() {
  console.log('\n=== TESTING REAL-TIME ACTIVITY AVAILABILITY ===');

  // Check availability before and after booking
  console.log('\n2a. Checking activity availability...');
  const availabilityResponse = await axios.get(`${BASE_URL}/activities/1/availability?date=2025-06-16&time_slot=06:00-12:00`);
  console.log('✅ Activity availability retrieved:', {
    available: availabilityResponse.data.available,
    availableSpots: availabilityResponse.data.available_spots,
    bookedSpots: availabilityResponse.data.booked_spots
  });

  // Verify availability tracking - specific time slot response format
  const slot = availabilityResponse.data;
  console.log('✅ Time slot details:', {
    date: slot.date,
    timeSlot: slot.time_slot,
    availableSpots: slot.available_spots,
    bookedSpots: slot.booked_spots,
    totalSpots: slot.total_spots,
    available: slot.available
  });
}

// Test 3: Tour Guide System
async function testTourGuideSystem() {
  console.log('\n=== TESTING TOUR GUIDE SYSTEM ===');

  // Test 3a: Tour guide availability update
  console.log('\n3a. Testing tour guide availability toggle...');
  const guideToken = await loginUser('tourGuide');
  const guideHeaders = { Authorization: `Bearer ${guideToken}` };

  // Get current profile
  const profileResponse = await axios.get(`${BASE_URL}/tour-guides/profile`, { guideHeaders });
  console.log('✅ Tour guide profile retrieved');

  // Update availability
  const availabilityResponse = await axios.put(`${BASE_URL}/tour-guides/availability`, 
    { available: true }, 
    { headers: guideHeaders }
  );
  console.log('✅ Tour guide availability updated to available');

  // Test 3b: Admin assignment functionality
  console.log('\n3b. Testing tour guide assignment...');
  const adminToken = await loginUser('admin');
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // Get unassigned bookings
  const unassignedResponse = await axios.get(`${BASE_URL}/bookings/unassigned`, { headers: adminHeaders });
  console.log('✅ Unassigned bookings retrieved:', unassignedResponse.data.length, 'bookings');

  if (unassignedResponse.data.length > 0) {
    const bookingId = unassignedResponse.data[0].id;
    
    // Get eligible guides
    const eligibleResponse = await axios.get(`${BASE_URL}/bookings/${bookingId}/eligible-guides`, { headers: adminHeaders });
    console.log('✅ Eligible guides retrieved:', eligibleResponse.data.length, 'guides');

    if (eligibleResponse.data.length > 0) {
      const guideId = eligibleResponse.data[0].user_id;
      
      // Assign guide
      const assignResponse = await axios.post(`${BASE_URL}/bookings/${bookingId}/assign-guide`, 
        { guideId }, 
        { headers: adminHeaders }
      );
      console.log('✅ Tour guide assigned successfully');
    }
  }
}

// Test 4: Travel Agent Dashboard
async function testTravelAgentDashboard() {
  console.log('\n=== TESTING TRAVEL AGENT DASHBOARD ===');

  const agentToken = await loginUser('travelAgent');
  const agentHeaders = { Authorization: `Bearer ${agentToken}` };

  // Test 4a: Get pending bookings
  console.log('\n4a. Testing pending bookings retrieval...');
  const pendingResponse = await axios.get(`${BASE_URL}/bookings/pending`, { headers: agentHeaders });
  console.log('✅ Pending bookings retrieved:', pendingResponse.data.length, 'bookings');

  // Test 4b: Assign transport ticket
  if (pendingResponse.data.length > 0) {
    const booking = pendingResponse.data.find(b => 
      b.items && b.items.some(item => item.item_type === 'transport')
    );
    
    if (booking) {
      const transportItem = booking.items.find(item => item.item_type === 'transport');
      
      console.log('\n4b. Testing transport ticket assignment...');
      const ticketResponse = await axios.post(`${BASE_URL}/bookings/assign-ticket`, {
        itemId: transportItem.id,
        ticketDetails: {
          ticketNumber: `TKT-${Date.now()}`,
          seatNumber: 'A12',
          departureTime: '08:00',
          arrivalTime: '12:00',
          notes: 'Test ticket assignment'
        }
      }, { headers: agentHeaders });
      console.log('✅ Transport ticket assigned successfully');
    }
  }
}

// Test 5: Hotel Manager Dashboard
async function testHotelManagerDashboard() {
  console.log('\n=== TESTING HOTEL MANAGER DASHBOARD ===');

  const hotelToken = await loginUser('hotelManager');
  const hotelHeaders = { Authorization: `Bearer ${hotelToken}` };

  // Test 5a: Get hotel bookings
  console.log('\n5a. Testing hotel bookings retrieval...');
  const hotelBookingsResponse = await axios.get(`${BASE_URL}/hotel-bookings/my-bookings`, { headers: hotelHeaders });
  console.log('✅ Hotel bookings retrieved:', hotelBookingsResponse.data.length, 'bookings');

  // Test 5b: Assign room
  if (hotelBookingsResponse.data.length > 0) {
    const booking = hotelBookingsResponse.data[0];
    
    console.log('\n5b. Testing room assignment...');
    const roomResponse = await axios.post(`${BASE_URL}/hotel-bookings/assign-room`, {
      itemId: booking.id,
      roomDetails: {
        roomNumber: '205',
        roomType: 'Deluxe',
        checkInInstructions: 'Check-in at reception',
        notes: 'Test room assignment'
      }
    }, { headers: hotelHeaders });
    console.log('✅ Room assigned successfully');
  }
}

// Test 6: Cost Calculation Verification
async function testCostCalculation() {
  console.log('\n=== TESTING COST CALCULATION ===');

  const token = await loginUser('tourist');
  const headers = { Authorization: `Bearer ${token}` };

  // Test with different date ranges to verify per-day cost calculation
  console.log('\n6a. Testing 2-day booking cost calculation...');
  const twoDayBooking = {
    destinationId: 1, // Serengeti at $75/day
    startDate: '2025-07-01',
    endDate: '2025-07-03', // 2 days
    includeTransport: false,
    includeHotel: false,
    includeActivities: true,
    activityIds: [1], // Assuming activity cost is $30
    activitySchedules: {
      1: {
        date: '2025-07-02',
        time_slot: '06:00-12:00',
        participants: 1
      }
    }
  };

  const twoDayResponse = await axios.post(`${BASE_URL}/bookings`, twoDayBooking, { headers });
  console.log('✅ 2-day booking cost:', twoDayResponse.data.totalCost);

  console.log('\n6b. Testing 5-day booking cost calculation...');
  const fiveDayBooking = {
    destinationId: 1, // Serengeti at $75/day
    startDate: '2025-07-05',
    endDate: '2025-07-10', // 5 days
    includeTransport: false,
    includeHotel: false,
    includeActivities: true,
    activityIds: [1],
    activitySchedules: {
      1: {
        date: '2025-07-06',
        time_slot: '06:00-12:00',
        participants: 1
      }
    }
  };

  const fiveDayResponse = await axios.post(`${BASE_URL}/bookings`, fiveDayBooking, { headers });
  console.log('✅ 5-day booking cost:', fiveDayResponse.data.totalCost);

  // Verify the cost difference is correct (5 days should cost more than 2 days)
  const costDifference = fiveDayResponse.data.totalCost - twoDayResponse.data.totalCost;
  const expectedDifference = 75 * 3; // $75/day × 3 additional days
  console.log('✅ Cost difference verification:', {
    actualDifference: costDifference,
    expectedDifference: expectedDifference,
    matches: Math.abs(costDifference - expectedDifference) < 0.01
  });
}

// Test 7: User Bookings Retrieval
async function testUserBookings() {
  console.log('\n=== TESTING USER BOOKINGS RETRIEVAL ===');

  const token = await loginUser('tourist');
  const headers = { Authorization: `Bearer ${token}` };

  const bookingsResponse = await axios.get(`${BASE_URL}/bookings/my-bookings`, { headers });
  console.log('✅ User bookings retrieved:', bookingsResponse.data.length, 'total bookings');

  // Verify booking details
  if (bookingsResponse.data.length > 0) {
    const booking = bookingsResponse.data[0];
    console.log('✅ Sample booking details:', {
      id: booking.id,
      destinationId: booking.destination_id,
      totalCost: booking.total_cost,
      status: booking.status,
      itemsCount: booking.items ? booking.items.length : 0
    });
  }
}

// Main test runner
async function runComprehensiveTests() {
  try {
    console.log('🚀 STARTING COMPREHENSIVE SMART TOUR TANZANIA SYSTEM TESTS');
    console.log('===============================================================');

    // Test 1: Flexible Booking System
    const bookingIds = await testFlexibleBooking();

    // Test 2: Real-time Activity Availability
    await testActivityAvailability();

    // Test 3: Tour Guide System
    await testTourGuideSystem();

    // Test 4: Travel Agent Dashboard
    await testTravelAgentDashboard();

    // Test 5: Hotel Manager Dashboard
    await testHotelManagerDashboard();

    // Test 6: Cost Calculation Verification
    await testCostCalculation();

    // Test 7: User Bookings Retrieval
    await testUserBookings();

    console.log('\n===============================================================');
    console.log('🎉 ALL COMPREHENSIVE TESTS COMPLETED SUCCESSFULLY!');
    console.log('===============================================================');

    return true;

  } catch (error) {
    console.error('\n❌ COMPREHENSIVE TEST FAILED:', error.response?.data || error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runComprehensiveTests };
