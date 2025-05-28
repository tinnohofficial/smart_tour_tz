// Simple payment test
const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

async function simplePaymentTest() {
  try {
    console.log('=== SIMPLE PAYMENT TEST ===');
    
    // 1. Login as tourist
    console.log('1. Logging in as tourist...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'tourist@test.com',
      password: 'password123'
    });
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful');

    // 2. Get user bookings
    console.log('2. Getting user bookings...');
    const bookingsResponse = await axios.get(`${BASE_URL}/bookings/my-bookings`, { headers });
    console.log(`✅ Found ${bookingsResponse.data.length} bookings`);
    
    const pendingBookings = bookingsResponse.data.filter(b => b.status === 'pending_payment');
    console.log(`   - ${pendingBookings.length} pending payment`);

    if (pendingBookings.length > 0) {
      const booking = pendingBookings[0];
      console.log(`3. Processing payment for booking ${booking.id}...`);
      
      const paymentResponse = await axios.post(
        `${BASE_URL}/bookings/${booking.id}/pay`,
        {
          paymentMethod: 'credit_card',
          amount: booking.total_cost
        },
        { headers }
      );
      console.log('✅ Payment processed:', paymentResponse.data);
    } else {
      console.log('⚠️ No pending bookings to process payment for');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

simplePaymentTest();
