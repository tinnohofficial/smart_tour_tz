const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3002/api';
const TEST_USER = {
  email: 'test-tourist@example.com',
  password: 'testpassword123',
  role: 'tourist'
};

let authToken = '';

// Helper function to make authenticated requests
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  const data = await response.json();
  
  return {
    status: response.status,
    ok: response.ok,
    data
  };
}

// Test functions
async function testUserRegistration() {
  console.log('🧪 Testing user registration...');
  
  const result = await makeRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });
  
  if (result.ok) {
    console.log('✅ User registration successful');
    authToken = result.data.token;
    return true;
  } else {
    console.log('❌ User registration failed:', result.data.message);
    return false;
  }
}

async function testCreateSavingsAccount() {
  console.log('🧪 Testing savings account creation...');
  
  const result = await makeRequest('/savings', {
    method: 'POST'
  });
  
  if (result.ok) {
    console.log('✅ Savings account created successfully');
    console.log('   Balance:', result.data.balance);
    return true;
  } else {
    console.log('❌ Savings account creation failed:', result.data.message);
    return false;
  }
}

async function testUpdateBalance() {
  console.log('🧪 Testing balance update...');
  
  const newBalance = 1500.50;
  const result = await makeRequest('/savings', {
    method: 'PUT',
    body: JSON.stringify({ balance: newBalance })
  });
  
  if (result.ok) {
    console.log('✅ Balance updated successfully');
    console.log('   New balance:', result.data.balance);
    console.log('   Previous balance:', result.data.previous_balance);
    return true;
  } else {
    console.log('❌ Balance update failed:', result.data.message);
    return false;
  }
}

async function testDuplicateAccountCreation() {
  console.log('🧪 Testing duplicate account creation (should fail)...');
  
  const result = await makeRequest('/savings', {
    method: 'POST'
  });
  
  if (!result.ok && result.data.message.includes('already exists')) {
    console.log('✅ Duplicate account creation properly rejected');
    return true;
  } else {
    console.log('❌ Duplicate account creation test failed');
    return false;
  }
}

async function testInvalidBalanceUpdate() {
  console.log('🧪 Testing invalid balance update (should fail)...');
  
  const result = await makeRequest('/savings', {
    method: 'PUT',
    body: JSON.stringify({ balance: -100 })
  });
  
  if (!result.ok && result.data.message.includes('non-negative')) {
    console.log('✅ Invalid balance properly rejected');
    return true;
  } else {
    console.log('❌ Invalid balance test failed');
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('🧪 Testing unauthorized access (should fail)...');
  
  const originalToken = authToken;
  authToken = '';
  
  const result = await makeRequest('/savings', {
    method: 'POST'
  });
  
  authToken = originalToken;
  
  if (!result.ok && (result.status === 401 || result.status === 403)) {
    console.log('✅ Unauthorized access properly rejected');
    return true;
  } else {
    console.log('❌ Unauthorized access test failed');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Simplified Savings API Tests\n');
  
  const tests = [
    testUserRegistration,
    testCreateSavingsAccount,
    testUpdateBalance,
    testDuplicateAccountCreation,
    testInvalidBalanceUpdate,
    testUnauthorizedAccess
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
      console.log('');
    } catch (error) {
      console.log('❌ Test error:', error.message);
      console.log('');
    }
  }
  
  console.log('📊 Test Results:');
  console.log(`   Passed: ${passed}/${total}`);
  console.log(`   Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Simplified savings system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };