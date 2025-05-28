const axios = require('axios');

async function debug() {
  try {
    const response = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'tourist@test.com',
      password: 'password123'
    });
    
    console.log('Login response:', response.data);
    const token = response.data.token;
    
    const bookingsResponse = await axios.get('http://localhost:3002/api/bookings/my-bookings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Bookings count:', bookingsResponse.data.length);
    const pending = bookingsResponse.data.filter(b => b.status === 'pending_payment');
    console.log('Pending payment bookings:', pending.length);
    
    if (pending.length > 0) {
      console.log('First pending booking:', {
        id: pending[0].id,
        status: pending[0].status,
        total_cost: pending[0].total_cost
      });
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

debug();
