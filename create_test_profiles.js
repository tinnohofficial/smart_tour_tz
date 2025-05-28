// Create profiles for test users to move them from pending_profile status
const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

// Test users data
const testUsers = {
  tourGuide: { 
    email: 'guide@tour.com', 
    password: 'password123',
    profileData: {
      full_name: 'John Guide',
      location: 'Arusha',
      expertise: 'Wildlife safaris, Cultural tours, Mountain hiking',
      license_document_url: 'https://example.com/license.pdf',
      activity_expertise: [1, 2] // Safari and cultural activities
    }
  },
  travelAgent: { 
    email: 'agent@travel.com', 
    password: 'password123',
    profileData: {
      name: 'Tanzania Travel Agency',
      document_url: JSON.stringify(['https://example.com/license.pdf']),
      routes: [
        {
          origin: 'Arusha',
          destination: 'Serengeti',
          transport_type: 'Bus',
          price: 50.00,
          description: 'Daily bus service to Serengeti'
        },
        {
          origin: 'Moshi',
          destination: 'Kilimanjaro Airport',
          transport_type: 'Van',
          price: 30.00,
          description: 'Airport transfer service'
        }
      ]
    }
  },
  hotelManager: { 
    email: 'manager@hotel.com', 
    password: 'password123',
    profileData: {
      name: 'Safari Lodge Hotel',
      location: 'Serengeti',
      description: 'Luxury safari lodge in the heart of Serengeti',
      capacity: 50,
      base_price_per_night: 150.00
    }
  }
};

// Helper function to login and get token
async function loginUser(credentials) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    return response.data.token;
  } catch (error) {
    console.error(`Login failed for ${credentials.email}:`, error.response?.data?.message || error.message);
    throw error;
  }
}

// Create tour guide profile
async function createTourGuideProfile() {
  console.log('\n=== Creating Tour Guide Profile ===');
  try {
    const token = await loginUser(testUsers.tourGuide);
    const headers = { Authorization: `Bearer ${token}` };

    const response = await axios.post(`${BASE_URL}/tour-guides/profile`, 
      testUsers.tourGuide.profileData, 
      { headers }
    );
    console.log('✅ Tour guide profile created successfully');
    console.log('Response:', response.data.message);
  } catch (error) {
    console.error('❌ Failed to create tour guide profile:', error.response?.data?.message || error.message);
  }
}

// Create travel agent profile
async function createTravelAgentProfile() {
  console.log('\n=== Creating Travel Agent Profile ===');
  try {
    const token = await loginUser(testUsers.travelAgent);
    const headers = { Authorization: `Bearer ${token}` };

    const response = await axios.post(`${BASE_URL}/travel-agents/profile`, 
      testUsers.travelAgent.profileData, 
      { headers }
    );
    console.log('✅ Travel agent profile created successfully');
    console.log('Response:', response.data.message);
  } catch (error) {
    console.error('❌ Failed to create travel agent profile:', error.response?.data?.message || error.message);
  }
}

// Create hotel manager profile
async function createHotelManagerProfile() {
  console.log('\n=== Creating Hotel Manager Profile ===');
  try {
    const token = await loginUser(testUsers.hotelManager);
    const headers = { Authorization: `Bearer ${token}` };

    const response = await axios.post(`${BASE_URL}/hotels/manager/profile`, 
      testUsers.hotelManager.profileData, 
      { headers }
    );
    console.log('✅ Hotel manager profile created successfully');
    console.log('Response:', response.data.message);
  } catch (error) {
    console.error('❌ Failed to create hotel manager profile:', error.response?.data?.message || error.message);
  }
}

// Verify profile creation by checking user status
async function verifyProfileCreation() {
  console.log('\n=== Verifying Profile Creation ===');
  
  for (const [role, userData] of Object.entries(testUsers)) {
    try {
      const token = await loginUser(userData);
      const headers = { Authorization: `Bearer ${token}` };

      // Check user status
      const statusResponse = await axios.get(`${BASE_URL}/auth/status`, { headers });
      console.log(`${role}: ${statusResponse.data.status}`);
    } catch (error) {
      console.error(`❌ Failed to check status for ${role}:`, error.response?.data?.message || error.message);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Creating test user profiles...');
  
  try {
    await createTourGuideProfile();
    await createTravelAgentProfile();
    await createHotelManagerProfile();
    await verifyProfileCreation();
    
    console.log('\n✅ Profile creation process completed!');
    console.log('Note: Users are now in "pending_approval" status and need admin approval to be "active"');
    
  } catch (error) {
    console.error('❌ Process failed:', error.message);
  }
}

main();
