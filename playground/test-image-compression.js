// Test script for image compression functionality
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

// Test configuration
const API_URL = 'http://localhost:3002/api';
const TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=2000&h=1500'; // Large test image

async function testImageCompression() {
  console.log('🧪 Starting image compression test...\n');

  try {
    // Step 1: Login as admin to get authentication token
    console.log('📝 Logging in as admin...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful\n');

    // Step 2: Download a test image
    console.log('⬇️ Downloading test image...');
    const imageResponse = await fetch(TEST_IMAGE_URL);
    if (!imageResponse.ok) {
      throw new Error('Failed to download test image');
    }

    const imageBuffer = await imageResponse.buffer();
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    fs.writeFileSync(testImagePath, imageBuffer);
    
    const originalSize = fs.statSync(testImagePath).size;
    console.log(`📊 Original image size: ${(originalSize / 1024 / 1024).toFixed(2)} MB\n`);

    // Step 3: Upload the image to test compression
    console.log('⬆️ Uploading image to test compression...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });

    const uploadResponse = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.text();
      throw new Error(`Upload failed: ${errorData}`);
    }

    const uploadData = await uploadResponse.json();
    console.log('✅ Upload successful!');
    console.log(`📊 Compressed size: ${(uploadData.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🔧 Was compressed: ${uploadData.compressed ? 'Yes' : 'No'}`);
    
    if (uploadData.compressed) {
      const compressionRatio = ((originalSize - uploadData.size) / originalSize * 100).toFixed(1);
      console.log(`📉 Size reduction: ${compressionRatio}%`);
    }
    
    console.log(`🔗 File URL: ${uploadData.url}\n`);

    // Step 4: Test accessing the compressed image
    console.log('🌐 Testing compressed image access...');
    const accessResponse = await fetch(`http://localhost:3002${uploadData.url}`);
    if (accessResponse.ok) {
      console.log('✅ Compressed image is accessible via URL\n');
    } else {
      console.log('❌ Failed to access compressed image\n');
    }

    // Step 5: Cleanup
    console.log('🧹 Cleaning up...');
    // Delete uploaded file
    const deleteResponse = await fetch(`${API_URL}/upload/${uploadData.filename}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (deleteResponse.ok) {
      console.log('✅ Uploaded file deleted');
    }

    // Delete local test file
    fs.unlinkSync(testImagePath);
    console.log('✅ Local test file deleted');

    console.log('\n🎉 Image compression test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testImageCompression();
