// Test script to check if applications feature is working
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000';

async function testApplicationsAPI() {
  try {
    console.log('Testing applications API...');
    
    // First test the base API endpoint
    const response = await fetch(`${API_BASE_URL}/api/`);
    if (response.ok) {
      const data = await response.text();
      console.log('✅ Backend is running:', data);
    } else {
      console.log('❌ Backend not accessible');
      return;
    }

    // Test the applications endpoint (this will fail without auth, but we can see if route exists)
    const appsResponse = await fetch(`${API_BASE_URL}/api/applications/pending`);
    console.log('Applications endpoint status:', appsResponse.status);
    
    if (appsResponse.status === 401) {
      console.log('✅ Applications endpoint exists (401 = unauthorized, which is expected)');
    } else if (appsResponse.status === 404) {
      console.log('❌ Applications endpoint not found');
    } else {
      console.log('⚠️ Unexpected status:', appsResponse.status);
    }

  } catch (error) {
    console.error('❌ Error testing applications API:', error.message);
  }
}

testApplicationsAPI();
