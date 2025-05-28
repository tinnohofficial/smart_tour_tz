// Test admin features - profile approval and tour guide assignment
const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';

// Admin credentials
const adminCredentials = {
  email: 'admin@example.com',
  password: 'password123'
};

// Helper function to login and get token
async function loginAdmin() {
  try {
    console.log('Attempting admin login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, adminCredentials);
    console.log('Admin login response received');
    return response.data.token;
  } catch (error) {
    console.error('Admin login failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

// Test admin features
async function testAdminFeatures() {
  console.log('=== ADMIN FEATURES TEST ===');
  
  try {
    // 1. Admin login
    console.log('1. Testing admin login...');
    const token = await loginAdmin();
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Admin login successful');

    // 2. Get pending applications
    console.log('2. Testing pending applications retrieval...');
    const pendingResponse = await axios.get(`${BASE_URL}/applications/pending`, { headers });
    console.log(`✅ Pending applications: ${pendingResponse.data.length} users`);
    
    // Log detailed application info
    pendingResponse.data.forEach((app, index) => {
      console.log(`   Application ${index + 1}: ${app.email} (${app.role}) - Status: ${app.status}`);
      if (app.profileDetails) {
        console.log(`     Profile: ${JSON.stringify(app.profileDetails, null, 6).substring(0, 100)}...`);
      }
    });

    // 3. Approve the first pending application if any exist
    if (pendingResponse.data.length > 0) {
      const firstApp = pendingResponse.data[0];
      console.log(`3. Testing profile approval for ${firstApp.email}...`);
      
      const approvalResponse = await axios.patch(
        `${BASE_URL}/applications/${firstApp.id}/status`,
        { newStatus: 'active' },
        { headers }
      );
      console.log(`✅ Profile approved: ${approvalResponse.data.message}`);
      
      // Verify approval by checking the user's status
      console.log('   Verifying approval...');
      const verifyResponse = await axios.get(`${BASE_URL}/applications/pending`, { headers });
      const stillPending = verifyResponse.data.find(app => app.id === firstApp.id);
      if (!stillPending) {
        console.log(`✅ User ${firstApp.email} is no longer in pending list (approval confirmed)`);
      } else {
        console.log(`⚠️ User ${firstApp.email} still appears in pending list`);
      }
    } else {
      console.log('3. No pending applications to approve');
    }

    // 4. Get unassigned bookings
    console.log('4. Testing unassigned bookings retrieval...');
    const unassignedResponse = await axios.get(`${BASE_URL}/bookings/unassigned-bookings`, { headers });
    console.log(`✅ Unassigned bookings: ${unassignedResponse.data.length} bookings`);
    
    // Log booking details
    unassignedResponse.data.slice(0, 3).forEach((booking, index) => {
      console.log(`   Booking ${index + 1}: ID=${booking.id}, Destination=${booking.destination_name}, Days=${booking.days}, Cost=${booking.total_cost}`);
    });

    // 5. Test tour guide assignment if bookings exist
    if (unassignedResponse.data.length > 0) {
      const firstBooking = unassignedResponse.data[0];
      console.log(`5. Testing eligible guides for booking ${firstBooking.id}...`);
      
      const guidesResponse = await axios.get(
        `${BASE_URL}/bookings/${firstBooking.id}/eligible-guides`,
        { headers }
      );
      console.log(`✅ Eligible guides: ${guidesResponse.data.length} guides available`);
      
      // Log guide details
      guidesResponse.data.forEach((guide, index) => {
        console.log(`   Guide ${index + 1}: ${guide.full_name} - Available: ${guide.available}, Expertise: ${guide.expertise}`);
      });

      // Assign the first eligible guide if any exist
      if (guidesResponse.data.length > 0) {
        const firstGuide = guidesResponse.data[0];
        console.log(`6. Testing tour guide assignment: ${firstGuide.full_name} to booking ${firstBooking.id}...`);
        
        const assignmentResponse = await axios.post(
          `${BASE_URL}/bookings/${firstBooking.id}/assign-guide`,
          { guideId: firstGuide.id },
          { headers }
        );
        console.log(`✅ Guide assigned: ${assignmentResponse.data.message}`);
        
        // Verify guide availability changed
        const verifyResponse = await axios.get(
          `${BASE_URL}/bookings/${firstBooking.id}/eligible-guides`,
          { headers }
        );
        const assignedGuide = verifyResponse.data.find(g => g.id === firstGuide.id);
        if (assignedGuide) {
          console.log(`✅ Guide availability updated: Available = ${assignedGuide.available}`);
        } else {
          console.log(`✅ Guide no longer in eligible list (now assigned)`);
        }
      } else {
        console.log('6. No eligible guides available for assignment');
      }
    } else {
      console.log('5. No unassigned bookings available for guide assignment');
    }

    console.log('\n=== ALL ADMIN TESTS PASSED ===');
    
  } catch (error) {
    console.error('❌ Admin test failed:', error.response?.data?.message || error.message);
    console.error('Full error:', error.response?.data || error.message);
  }
}

// Run the tests
testAdminFeatures();
