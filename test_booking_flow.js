// Test script for comprehensive booking flow testing
const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

// Test data
const testUser = {
  email: 'tourist@test.com',
  password: 'password123'
};

const bookingData = {
  destinationId: 1, // Serengeti
  startDate: '2025-06-15',
  endDate: '2025-06-17',
  transportId: 4, // Dar es Salaam to Serengeti
  hotelId: 3, // Serengeti Safari Lodge
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

async function testBookingFlow() {
  try {
    console.log('=== COMPREHENSIVE BOOKING FLOW TEST ===\n');

    // 1. Test user login
    console.log('1. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // 2. Test flexible booking (all services included)
    console.log('\n2. Testing full booking with all services...');
    const headers = { Authorization: `Bearer ${token}` };
    
    const fullBookingResponse = await axios.post(`${BASE_URL}/bookings`, bookingData, { headers });
    console.log('✅ Full booking created:', {
      id: fullBookingResponse.data.bookingId,
      totalCost: fullBookingResponse.data.totalCost,
      flexibleOptions: fullBookingResponse.data.flexibleOptions
    });

    // 3. Test transport-only booking
    console.log('\n3. Testing transport-only booking...');
    const transportOnlyBooking = {
      ...bookingData,
      startDate: '2025-06-18',
      endDate: '2025-06-20',
      includeHotel: false,
      includeActivities: false,
      activityIds: [],
      activitySchedules: {}
    };
    
    const transportResponse = await axios.post(`${BASE_URL}/bookings`, transportOnlyBooking, { headers });
    console.log('✅ Transport-only booking created:', {
      id: transportResponse.data.bookingId,
      totalCost: transportResponse.data.totalCost
    });

    // 4. Test activity availability after booking
    console.log('\n4. Testing activity availability after booking...');
    const availabilityResponse = await axios.get(`${BASE_URL}/activities/1/availability?date=2025-06-16&timeSlot=06:00-12:00`);
    const bookedSlot = availabilityResponse.data.availability.find(
      slot => slot.date === '2025-06-16' && slot.time_slot === '06:00-12:00'
    );
    console.log('✅ Activity availability updated:', {
      date: bookedSlot.date,
      timeSlot: bookedSlot.time_slot,
      availableSpots: bookedSlot.available_spots,
      bookedSpots: bookedSlot.booked_spots
    });

    // 5. Test getting user bookings
    console.log('\n5. Testing user bookings retrieval...');
    const userBookingsResponse = await axios.get(`${BASE_URL}/bookings/my-bookings`, { headers });
    console.log('✅ User bookings retrieved:', userBookingsResponse.data.length, 'bookings');

    console.log('\n=== ALL BOOKING TESTS PASSED ===');
    return true;

  } catch (error) {
    console.error('❌ Booking test failed:', error.response?.data || error.message);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testBookingFlow().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testBookingFlow };
