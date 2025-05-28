const axios = require('axios');

console.log('Starting debug script...');

async function debug() {
  console.log('Debug function started');
  try {
    console.log('Attempting login...');
    const response = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'tourist@test.com',
      password: 'password123'
    });
    
    console.log('Login successful!');
    console.log('Token length:', response.data.token.length);
    
  } catch (error) {
    console.error('Error during debug:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
  console.log('Debug function finished');
}

debug().then(() => {
  console.log('Promise resolved');
}).catch(err => {
  console.error('Promise rejected:', err);
});
