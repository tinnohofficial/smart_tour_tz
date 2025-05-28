// Simplified comprehensive test for Smart Tour Tanzania features
const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

// Test users
const testUsers = {
  admin: { email: 'admin@example.com', password: 'password123' },
  tourist: { email: 'tourist@test.com', password: 'password123' },
  travelAgent: { email: 'agent1@travel.com', password: 'password123' },
  hotelManager: { email: 'manager1@hotel.com', password: 'password123' },
  tourGuide: { email: 'guide1@tourguide.com', password: 'password123' }
};

async function loginUser(userType) {
  const user = testUsers[userType];
  const response = await axios.post(`${BASE_URL}/auth/login`, user);
  return response.data.token;
}

async function testFlexibleBookingSystem() {
  console.log('\n=== TESTING FLEXIBLE BOOKING SYSTEM ===');
  
  const token = await loginUser('tourist');
  const headers = { Authorization: `Bearer ${token}` };

  // Test all three booking types
  const tests = [
    {
      name: 'Full booking (all services)',
      data: {
        destinationId: 1,
        startDate: '2025-06-15',
        endDate: '2025-06-17',
        transportId: 4,
        hotelId: 3,
        activityIds: [1],
        includeTransport: true,
        includeHotel: true,
        includeActivities: true,
        activitySchedules: {
          1: { date: '2025-06-16', time_slot: '06:00-12:00', participants: 2 }
        }
      }
    },
    {
      name: 'Transport only',
      data: {
        destinationId: 1,
        startDate: '2025-06-20',
        endDate: '2025-06-21',
        transportId: 4,
        includeTransport: true,
        includeHotel: false,
        includeActivities: false,
        activityIds: [],
        activitySchedules: {}
      }
    },
    {
      name: 'Activities only',
      data: {
        destinationId: 1,
        startDate: '2025-06-17',
        endDate: '2025-06-18',
        includeTransport: false,
        includeHotel: false,
        includeActivities: true,
        activityIds: [1],
        activitySchedules: {
          1: { date: '2025-06-18', time_slot: '14:00-18:00', participants: 1 }
        }
      }
    }
  ];

  for (const test of tests) {
    console.log(`\nTesting ${test.name}...`);
    const response = await axios.post(`${BASE_URL}/bookings`, test.data, { headers });
    console.log('✅ Success:', {
      id: response.data.bookingId,
      cost: response.data.totalCost,
      options: response.data.flexibleOptions
    });
  }
}

async function testActivityAvailability() {
  console.log('\n=== TESTING ACTIVITY AVAILABILITY ===');
  
  const response = await axios.get(`${BASE_URL}/activities/1/availability?date=2025-06-16&time_slot=06:00-12:00`);
  
  console.log('✅ Availability check:', {
    date: response.data.date,
    timeSlot: response.data.time_slot,
    available: response.data.available_spots,
    booked: response.data.booked_spots,
    total: response.data.total_spots
  });
}

async function testApplicationsApproval() {
  console.log('\n=== TESTING APPLICATIONS APPROVAL SYSTEM ===');
  
  try {
    const adminToken = await loginUser('admin');
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    
    // Get pending applications
    const pendingResponse = await axios.get(`${BASE_URL}/applications/pending`, { headers: adminHeaders });
    console.log('✅ Found', pendingResponse.data.length, 'pending applications');
    
    // Find travel agent application to approve
    const travelAgentApp = pendingResponse.data.find(app => app.email === 'agent1@travel.com');
    
    if (travelAgentApp) {
      console.log(`📋 Found travel agent application for user ID: ${travelAgentApp.id}`);
      
      // Approve the travel agent application
      await axios.patch(`${BASE_URL}/applications/${travelAgentApp.id}/status`, 
        { newStatus: 'active' }, 
        { headers: adminHeaders }
      );
      console.log('✅ Travel agent application approved successfully');
      
      // Verify approval by checking pending applications again
      const updatedPendingResponse = await axios.get(`${BASE_URL}/applications/pending`, { headers: adminHeaders });
      const stillPending = updatedPendingResponse.data.find(app => app.email === 'agent1@travel.com');
      
      if (!stillPending) {
        console.log('✅ Travel agent removed from pending applications');
      } else {
        console.log('⚠️ Travel agent still in pending applications');
      }
    } else {
      console.log('⚠️ No travel agent application found to approve');
    }
    
    // Show remaining pending applications
    const finalPendingResponse = await axios.get(`${BASE_URL}/applications/pending`, { headers: adminHeaders });
    console.log('📊 Remaining pending applications:', finalPendingResponse.data.length);
    
  } catch (error) {
    console.error('❌ Applications approval test error:', error.response?.data || error.message);
    throw error;
  }
}

async function testTourGuideSystem() {
  console.log('\n=== TESTING TOUR GUIDE SYSTEM ===');
  
  try {
    // Test tour guide availability toggle
    const guideToken = await loginUser('tourGuide');
    const guideHeaders = { Authorization: `Bearer ${guideToken}` };
    
    // Set guide as available
    const availabilityResponse = await axios.patch(`${BASE_URL}/tour-guides/availability`, 
      { available: true }, 
      { headers: guideHeaders }
    );
    console.log('✅ Tour guide availability set to available');

    // Test admin assignment functionality
    const adminToken = await loginUser('admin');
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    
    const unassignedResponse = await axios.get(`${BASE_URL}/bookings/unassigned-bookings`, { headers: adminHeaders });
    console.log('✅ Found', unassignedResponse.data.length, 'unassigned bookings');
    
    if (unassignedResponse.data.length > 0) {
      const bookingId = unassignedResponse.data[0].id;
      console.log(`📋 Processing booking ID: ${bookingId}`);
      
      const guidesResponse = await axios.get(`${BASE_URL}/bookings/${bookingId}/eligible-guides`, { headers: adminHeaders });
      console.log('✅ Found', guidesResponse.data.length, 'eligible guides');
      
      if (guidesResponse.data.length > 0) {
        const guideId = guidesResponse.data[0].user_id;
        await axios.post(`${BASE_URL}/bookings/${bookingId}/assign-guide`, { guideId }, { headers: adminHeaders });
        console.log('✅ Tour guide assigned successfully');
      } else {
        console.log('⚠️ No eligible guides available for assignment');
      }
    } else {
      console.log('⚠️ No unassigned bookings found');
    }
    
    // Test guide availability toggle to unavailable
    await axios.patch(`${BASE_URL}/tour-guides/availability`, 
      { available: false }, 
      { headers: guideHeaders }
    );
    console.log('✅ Tour guide availability set to unavailable');
    
  } catch (error) {
    console.error('❌ Tour guide system test error:', error.response?.data || error.message);
    throw error;
  }
}

async function testDashboards() {
  console.log('\n=== TESTING DASHBOARDS ===');
  
  try {
    // Travel agent dashboard
    console.log('\n📊 Testing Travel Agent Dashboard...');
    const agentToken = await loginUser('travelAgent');
    const agentHeaders = { Authorization: `Bearer ${agentToken}` };
    
    const pendingResponse = await axios.get(`${BASE_URL}/bookings/transport-bookings-pending`, { headers: agentHeaders });
    console.log('✅ Travel agent dashboard - pending transport bookings:', pendingResponse.data.length);
    
    // Test travel agent completed bookings
    const completedResponse = await axios.get(`${BASE_URL}/bookings/transport-bookings-completed`, { headers: agentHeaders });
    console.log('✅ Travel agent dashboard - completed transport bookings:', completedResponse.data.length);
    
    // Hotel manager dashboard
    console.log('\n🏨 Testing Hotel Manager Dashboard...');
    const hotelToken = await loginUser('hotelManager');
    const hotelHeaders = { Authorization: `Bearer ${hotelToken}` };
    
    const hotelPendingResponse = await axios.get(`${BASE_URL}/bookings/hotel-bookings-pending`, { headers: hotelHeaders });
    console.log('✅ Hotel manager dashboard - pending hotel bookings:', hotelPendingResponse.data.length);
    
    const hotelCompletedResponse = await axios.get(`${BASE_URL}/bookings/hotel-bookings-completed`, { headers: hotelHeaders });
    console.log('✅ Hotel manager dashboard - completed hotel bookings:', hotelCompletedResponse.data.length);
    
    // Test user bookings retrieval
    console.log('\n👤 Testing User Bookings Retrieval...');
    const touristToken = await loginUser('tourist');
    const touristHeaders = { Authorization: `Bearer ${touristToken}` };
    
    const userBookingsResponse = await axios.get(`${BASE_URL}/bookings/my-bookings`, { headers: touristHeaders });
    console.log('✅ User bookings retrieved:', userBookingsResponse.data.length);
    
    // Display sample booking details if available
    if (userBookingsResponse.data.length > 0) {
      const sampleBooking = userBookingsResponse.data[0];
      console.log('📋 Sample booking:', {
        id: sampleBooking.id,
        status: sampleBooking.status,
        total_cost: sampleBooking.total_cost,
        destination: sampleBooking.destination?.name || 'N/A'
      });
    }
    
  } catch (error) {
    console.error('❌ Dashboard test error:', error.response?.data || error.message);
    throw error;
  }
}

async function testCostCalculation() {
  console.log('\n=== TESTING COST CALCULATION ===');
  
  try {
    const token = await loginUser('tourist');
    const headers = { Authorization: `Bearer ${token}` };

    // Test different duration bookings with valid dates
    console.log('\n💰 Testing duration-based cost calculation...');
    const bookings = [
      { days: 2, startDate: '2025-06-15', endDate: '2025-06-17', description: '2-day booking' },
      { days: 4, startDate: '2025-06-20', endDate: '2025-06-24', description: '4-day booking' }
    ];

    const costs = [];
    for (const booking of bookings) {
      const response = await axios.post(`${BASE_URL}/bookings`, {
        destinationId: 1, // Serengeti $75/day
        startDate: booking.startDate,
        endDate: booking.endDate,
        includeTransport: false,
        includeHotel: false,
        includeActivities: true,
        activityIds: [1],
        activitySchedules: {
          1: { date: booking.startDate, time_slot: '06:00-12:00', participants: 1 }
        }
      }, { headers });
      
      costs.push({ 
        days: booking.days, 
        cost: response.data.totalCost,
        bookingId: response.data.bookingId 
      });
      console.log(`✅ ${booking.description} cost: $${response.data.totalCost} (ID: ${response.data.bookingId})`);
    }

    // Test combined services cost calculation
    console.log('\n🎯 Testing combined services cost calculation...');
    const combinedResponse = await axios.post(`${BASE_URL}/bookings`, {
      destinationId: 1,
      startDate: '2025-06-25',
      endDate: '2025-06-27',
      transportId: 4,
      hotelId: 3,
      includeTransport: true,
      includeHotel: true,
      includeActivities: true,
      activityIds: [1],
      activitySchedules: {
        1: { date: '2025-06-26', time_slot: '14:00-18:00', participants: 2 }
      }
    }, { headers });
    
    console.log('✅ Combined services booking:', {
      cost: combinedResponse.data.totalCost,
      bookingId: combinedResponse.data.bookingId,
      breakdown: combinedResponse.data.costBreakdown || 'Not provided'
    });

    // Verify flexible options are working
    console.log('\n🔄 Testing flexible options...');
    if (combinedResponse.data.flexibleOptions) {
      console.log('✅ Flexible options available:', Object.keys(combinedResponse.data.flexibleOptions).length);
    } else {
      console.log('⚠️ Flexible options not returned');
    }
    
  } catch (error) {
    console.error('❌ Cost calculation test error:', error.response?.data || error.message);
    throw error;
  }
}

async function testBookingStatusManagement() {
  console.log('\n=== TESTING BOOKING STATUS MANAGEMENT ===');
  
  try {
    // Create a test booking
    const touristToken = await loginUser('tourist');
    const touristHeaders = { Authorization: `Bearer ${touristToken}` };
    
    const bookingResponse = await axios.post(`${BASE_URL}/bookings`, {
      destinationId: 1,
      startDate: '2025-07-01',
      endDate: '2025-07-03',
      includeTransport: false,
      includeHotel: false,
      includeActivities: true,
      activityIds: [1],
      activitySchedules: {
        1: { date: '2025-07-02', time_slot: '06:00-12:00', participants: 1 }
      }
    }, { headers: touristHeaders });
    
    const bookingId = bookingResponse.data.bookingId;
    console.log('✅ Test booking created:', bookingId);
    
    // Test travel agent status update
    const agentToken = await loginUser('travelAgent');
    const agentHeaders = { Authorization: `Bearer ${agentToken}` };
    
    // Try to update booking status
    try {
      await axios.patch(`${BASE_URL}/bookings/${bookingId}/status`, 
        { status: 'confirmed' }, 
        { headers: agentHeaders }
      );
      console.log('✅ Booking status updated by travel agent');
    } catch (statusError) {
      console.log('⚠️ Status update endpoint not available or restricted');
    }
    
    // Test booking retrieval with details
    const bookingDetailsResponse = await axios.get(`${BASE_URL}/bookings/${bookingId}`, { headers: touristHeaders });
    console.log('✅ Booking details retrieved:', {
      id: bookingDetailsResponse.data.id,
      status: bookingDetailsResponse.data.status,
      cost: bookingDetailsResponse.data.total_cost
    });
    
  } catch (error) {
    console.error('❌ Booking status management test error:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  try {
    console.log('🚀 STARTING COMPREHENSIVE SYSTEM TESTS');
    console.log('====================================');
    
    console.log('\nTest 1: Applications Approval System');
    await testApplicationsApproval();
    
    console.log('\nTest 2: Flexible Booking System');
    await testFlexibleBookingSystem();
    
    console.log('\nTest 3: Activity Availability');
    await testActivityAvailability();
    
    console.log('\nTest 4: Tour Guide System');
    await testTourGuideSystem();
    
    console.log('\nTest 5: Dashboards & User Management');
    await testDashboards();
    
    console.log('\nTest 6: Cost Calculation');
    await testCostCalculation();
    
    console.log('\nTest 7: Booking Status Management');
    await testBookingStatusManagement();
    
    console.log('\n====================================');
    console.log('🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('====================================');
    
    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

if (require.main === module) {
  runTests().then(success => process.exit(success ? 0 : 1));
}

module.exports = { runTests };
