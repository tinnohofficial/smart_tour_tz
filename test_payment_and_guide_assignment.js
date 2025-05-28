// Test script for payment processing and tour guide assignment workflow
const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

// Test data
const testUser = {
  email: 'tourist@test.com',
  password: 'password123'
};

const adminUser = {
  email: 'admin@smarttour.com',
  password: 'admin123'
};

async function testPaymentAndGuideAssignment() {
  try {
    console.log('=== PAYMENT AND GUIDE ASSIGNMENT TEST ===\n');

    // 1. Login as test user to get their bookings
    console.log('1. Logging in as test user...');
    const userLoginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    const userToken = userLoginResponse.data.token;
    const userHeaders = { Authorization: `Bearer ${userToken}` };
    console.log('✅ User login successful');

    // 2. Get user's pending bookings
    console.log('\n2. Getting user bookings...');
    const userBookingsResponse = await axios.get(`${BASE_URL}/bookings/my-bookings`, { headers: userHeaders });
    const pendingBookings = userBookingsResponse.data.filter(booking => booking.status === 'pending_payment');
    console.log(`✅ Found ${pendingBookings.length} pending payment bookings`);

    if (pendingBookings.length === 0) {
      console.log('⚠️ No pending payment bookings found. Creating a new booking first...');
      
      // Create a new booking for testing
      const newBookingData = {
        destinationId: 1, // Serengeti
        startDate: '2025-06-25',
        endDate: '2025-06-27',
        transportId: 4,
        hotelId: 3,
        activityIds: [1],
        includeTransport: true,
        includeHotel: true,
        includeActivities: true,
        activitySchedules: {
          1: {
            date: '2025-06-26',
            time_slot: '06:00-12:00',
            participants: 2
          }
        }
      };

      const newBookingResponse = await axios.post(`${BASE_URL}/bookings`, newBookingData, { headers: userHeaders });
      console.log('✅ New booking created:', {
        id: newBookingResponse.data.bookingId,
        totalCost: newBookingResponse.data.totalCost
      });
      
      pendingBookings.push({
        id: newBookingResponse.data.bookingId,
        total_cost: newBookingResponse.data.totalCost,
        status: 'pending_payment'
      });
    }

    // 3. Process payment for the first pending booking
    console.log('\n3. Processing payment for booking...');
    const bookingToPayFor = pendingBookings[0];
    console.log(`Processing payment for booking ID: ${bookingToPayFor.id}, Amount: $${bookingToPayFor.total_cost}`);

    const paymentResponse = await axios.post(
      `${BASE_URL}/bookings/${bookingToPayFor.id}/pay`,
      {
        paymentMethod: 'credit_card',
        amount: bookingToPayFor.total_cost
      },
      { headers: userHeaders }
    );
    console.log('✅ Payment processed successfully:', paymentResponse.data);

    // 4. Verify booking status changed to confirmed
    console.log('\n4. Verifying booking status...');
    const updatedBookingsResponse = await axios.get(`${BASE_URL}/bookings/my-bookings`, { headers: userHeaders });
    const confirmedBooking = updatedBookingsResponse.data.find(b => b.id === bookingToPayFor.id);
    console.log('✅ Booking status updated:', {
      id: confirmedBooking.id,
      status: confirmedBooking.status,
      paymentStatus: confirmedBooking.payment_status
    });

    // 5. Login as admin
    console.log('\n5. Logging in as admin...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, adminUser);
    const adminToken = adminLoginResponse.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    console.log('✅ Admin login successful');

    // 6. Get unassigned bookings (confirmed bookings without tour guides)
    console.log('\n6. Getting unassigned bookings...');
    const unassignedBookingsResponse = await axios.get(`${BASE_URL}/bookings/unassigned`, { headers: adminHeaders });
    console.log(`✅ Found ${unassignedBookingsResponse.data.length} unassigned bookings`);
    
    if (unassignedBookingsResponse.data.length > 0) {
      console.log('Unassigned bookings:', unassignedBookingsResponse.data.map(b => ({
        id: b.id,
        status: b.status,
        destination: b.destination_name,
        startDate: b.start_date
      })));
    }

    // 7. Get available tour guides
    console.log('\n7. Getting available tour guides...');
    const tourGuidesResponse = await axios.get(`${BASE_URL}/tour-guides`, { headers: adminHeaders });
    const availableGuides = tourGuidesResponse.data.filter(guide => guide.is_available);
    console.log(`✅ Found ${availableGuides.length} available tour guides`);
    
    if (availableGuides.length > 0) {
      console.log('Available guides:', availableGuides.map(g => ({
        id: g.id,
        name: g.full_name,
        location: g.location,
        expertise: g.expertise
      })));
    }

    // 8. Assign tour guide to booking (if we have both)
    if (unassignedBookingsResponse.data.length > 0 && availableGuides.length > 0) {
      console.log('\n8. Assigning tour guide to booking...');
      const bookingToAssign = unassignedBookingsResponse.data[0];
      const guideToAssign = availableGuides[0];

      const assignmentResponse = await axios.post(
        `${BASE_URL}/bookings/${bookingToAssign.id}/assign-guide`,
        { tourGuideId: guideToAssign.id },
        { headers: adminHeaders }
      );
      console.log('✅ Tour guide assigned successfully:', assignmentResponse.data);

      // 9. Verify guide availability status changed
      console.log('\n9. Verifying guide availability status...');
      const updatedGuidesResponse = await axios.get(`${BASE_URL}/tour-guides`, { headers: adminHeaders });
      const assignedGuide = updatedGuidesResponse.data.find(g => g.id === guideToAssign.id);
      console.log('✅ Guide availability updated:', {
        id: assignedGuide.id,
        name: assignedGuide.full_name,
        isAvailable: assignedGuide.is_available
      });

      // 10. Verify booking now has tour guide assigned
      console.log('\n10. Verifying booking assignment...');
      const finalBookingCheck = await axios.get(`${BASE_URL}/bookings/unassigned`, { headers: adminHeaders });
      const stillUnassigned = finalBookingCheck.data.find(b => b.id === bookingToAssign.id);
      
      if (!stillUnassigned) {
        console.log('✅ Booking successfully removed from unassigned list');
      } else {
        console.log('⚠️ Booking still appears in unassigned list');
      }

    } else {
      console.log('\n⚠️ Cannot test assignment: Need both unassigned bookings and available guides');
      if (unassignedBookingsResponse.data.length === 0) {
        console.log('   - No unassigned bookings found');
      }
      if (availableGuides.length === 0) {
        console.log('   - No available tour guides found');
      }
    }

    console.log('\n=== PAYMENT AND GUIDE ASSIGNMENT TESTS COMPLETED ===');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPaymentAndGuideAssignment().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testPaymentAndGuideAssignment };
