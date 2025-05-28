// Sync test version
console.log('Starting test...');

const axios = require('axios');

// Use a synchronous approach with explicit error handling
(async () => {
  console.log('Async function started');
  
  try {
    console.log('Attempting login...');
    
    const loginData = {
      email: 'tourist@test.com',
      password: 'password123'
    };
    
    console.log('Login data:', loginData);
    
    const response = await axios.post('http://localhost:3002/api/auth/login', loginData);
    
    console.log('Response received, status:', response.status);
    console.log('Token received, length:', response.data.token.length);
    
    // Test bookings
    const token = response.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('Getting bookings...');
    const bookingsResponse = await axios.get('http://localhost:3002/api/bookings/my-bookings', { headers });
    
    console.log('Bookings response status:', bookingsResponse.status);
    console.log('Total bookings:', bookingsResponse.data.length);
    
    const pendingBookings = bookingsResponse.data.filter(b => b.status === 'pending_payment');
    console.log('Pending payment bookings:', pendingBookings.length);
    
    if (pendingBookings.length > 0) {
      const booking = pendingBookings[0];
      console.log('Processing payment for booking:', booking.id);
      console.log('Booking cost:', booking.total_cost);
      
      const paymentData = {
        paymentMethod: 'credit_card',
        amount: booking.total_cost
      };
      
      console.log('Sending payment request...');
      const paymentResponse = await axios.post(
        `http://localhost:3002/api/bookings/${booking.id}/pay`,
        paymentData,
        { headers }
      );
      
      console.log('Payment response status:', paymentResponse.status);
      console.log('Payment successful:', paymentResponse.data);
    }
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Error occurred:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    console.error('Stack:', error.stack);
  }
  
  console.log('Async function completed');
})().then(() => {
  console.log('Promise chain completed');
  process.exit(0);
}).catch(err => {
  console.error('Final catch:', err);
  process.exit(1);
});
