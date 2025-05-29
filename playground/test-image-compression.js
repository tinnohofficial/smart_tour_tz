// Simple test script for image compression functionality
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:3002/api';
const TEST_IMAGES_DIR = path.join(__dirname, 'test-images');
const OUTPUT_DIR = path.join(__dirname, 'test-output');

// Create directories if they don't exist
[TEST_IMAGES_DIR, OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Test credentials
const TEST_USER = {
  email: 'admin@example.com',
  password: 'password123'
};

let authToken = null;

// Helper function to authenticate
async function authenticate() {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_USER)
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    authToken = data.token;
    console.log('✅ Authentication successful');
    return authToken;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    throw error;
  }
}

// Helper function to create a simple test image file
function createSimpleTestImage(filename, sizeKB = 100) {
  const filePath = path.join(TEST_IMAGES_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    // Create a simple JPEG-like header and random data
    const targetSize = sizeKB * 1024;
    const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    const randomData = Buffer.alloc(targetSize - jpegHeader.length);
    
    // Fill with random data that looks like image data
    for (let i = 0; i < randomData.length; i++) {
      randomData[i] = Math.floor(Math.random() * 256);
    }
    
    const fileData = Buffer.concat([jpegHeader, randomData]);
    fs.writeFileSync(filePath, fileData);
    console.log(`Created test file: ${filename} (${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)`);
  }
  
  return filePath;
}

// Helper function to download a real test image
async function downloadTestImage() {
  const imagePath = path.join(TEST_IMAGES_DIR, 'real-test-image.jpg');
  
  if (!fs.existsSync(imagePath)) {
    try {
      console.log('📥 Downloading real test image...');
      const response = await fetch('https://picsum.photos/1200/800.jpg');
      
      if (response.ok) {
        const buffer = await response.buffer();
        fs.writeFileSync(imagePath, buffer);
        console.log(`✅ Downloaded real test image (${(buffer.length / 1024).toFixed(1)} KB)`);
      } else {
        console.log('⚠️ Could not download real image, will use generated test file');
        return null;
      }
    } catch (error) {
      console.log('⚠️ Could not download real image, will use generated test file');
      return null;
    }
  }
  
  return imagePath;
}

// Helper function to upload and test compression
async function testFileUpload(filePath) {
  try {
    const fileName = path.basename(filePath);
    const fileStats = fs.statSync(filePath);
    const originalSize = fileStats.size;
    
    console.log(`\n🚀 Testing upload: ${fileName} (${(originalSize / 1024).toFixed(1)} KB)`);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    // Upload file
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    
    // Analyze results
    console.log(`  📤 Upload successful: ${result.filename}`);
    console.log(`  📊 Original size: ${(originalSize / 1024).toFixed(1)} KB`);
    console.log(`  📊 Final size: ${(result.size / 1024).toFixed(1)} KB`);
    
    if (result.compression) {
      if (result.compression.compressed) {
        console.log(`  🗜️ Compressed: YES`);
        console.log(`  📉 Compression ratio: ${result.compression.compressionRatio}%`);
        console.log(`  💾 Space saved: ${(result.compression.savedBytes / 1024).toFixed(1)} KB`);
        console.log(`  ✅ Compression was beneficial`);
      } else {
        console.log(`  🗜️ Compressed: NO`);
        console.log(`  ℹ️ Reason: ${result.compression.reason}`);
      }
    } else {
      console.log(`  ⚠️ No compression data available`);
    }
    
    // Test accessing the uploaded file
    console.log(`  🌐 Testing file access...`);
    const accessResponse = await fetch(`http://localhost:3002${result.url}`);
    if (accessResponse.ok) {
      console.log(`  ✅ File is accessible via URL`);
    } else {
      console.log(`  ❌ File is not accessible via URL`);
    }
    
    // Save result to output
    const outputFile = path.join(OUTPUT_DIR, `${fileName}-result.json`);
    fs.writeFileSync(outputFile, JSON.stringify({
      fileName,
      originalSize,
      result,
      testTime: new Date().toISOString()
    }, null, 2));
    
    return result;
    
  } catch (error) {
    console.error(`  ❌ Upload failed: ${error.message}`);
    return null;
  }
}

// Helper function to test document upload
function createAndTestDocument() {
  console.log('\n📄 Creating test document...');
  
  const docPath = path.join(TEST_IMAGES_DIR, 'test-document.txt');
  const docContent = `
This is a test document for file upload testing.
It contains some sample text to test non-image file uploads.
The compression system should not attempt to compress this file.

Generated on: ${new Date().toISOString()}
File size: This text will be repeated to make the file larger.
${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50)}
  `.trim();
  
  fs.writeFileSync(docPath, docContent);
  console.log(`Created test document (${(fs.statSync(docPath).size / 1024).toFixed(1)} KB)`);
  
  return testFileUpload(docPath);
}

// Main test function
async function runCompressionTests() {
  console.log('🧪 Starting File Compression Tests\n');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Authenticate
    await authenticate();
    
    // Step 2: Create/download test files
    console.log('\n📁 Preparing test files...');
    
    const testFiles = [];
    
    // Try to download a real image
    const realImage = await downloadTestImage();
    if (realImage) {
      testFiles.push(realImage);
    }
    
    // Create test images of different sizes
    testFiles.push(createSimpleTestImage('small-test.jpg', 30));
    testFiles.push(createSimpleTestImage('medium-test.jpg', 500));
    testFiles.push(createSimpleTestImage('large-test.jpg', 2000));
    
    // Step 3: Test image uploads
    console.log('\n🖼️ Testing image compression...');
    console.log('-'.repeat(40));
    
    const results = [];
    for (const filePath of testFiles) {
      const result = await testFileUpload(filePath);
      if (result) {
        results.push(result);
      }
      // Small delay between uploads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Step 4: Test document upload
    const docResult = await createAndTestDocument();
    if (docResult) {
      results.push(docResult);
    }
    
    // Step 5: Generate summary
    console.log('\n📋 Test Summary');
    console.log('='.repeat(50));
    
    const compressedFiles = results.filter(r => r.compression?.compressed);
    const uncompressedFiles = results.filter(r => r.compression && !r.compression.compressed);
    const totalOriginalSize = results.reduce((sum, r) => sum + (r.compression?.originalSize || 0), 0);
    const totalFinalSize = results.reduce((sum, r) => sum + r.size, 0);
    const totalSaved = totalOriginalSize - totalFinalSize;
    
    console.log(`📊 Total files tested: ${results.length}`);
    console.log(`🗜️ Files compressed: ${compressedFiles.length}`);
    console.log(`📄 Files not compressed: ${uncompressedFiles.length}`);
    console.log(`📏 Total original size: ${(totalOriginalSize / 1024).toFixed(1)} KB`);
    console.log(`📏 Total final size: ${(totalFinalSize / 1024).toFixed(1)} KB`);
    console.log(`💾 Total space saved: ${(totalSaved / 1024).toFixed(1)} KB`);
    
    if (totalOriginalSize > 0) {
      const overallReduction = ((totalSaved / totalOriginalSize) * 100).toFixed(1);
      console.log(`📉 Overall size reduction: ${overallReduction}%`);
    }
    
    // Test specific compression features
    console.log('\n🔍 Compression Feature Analysis:');
    compressedFiles.forEach((result, index) => {
      console.log(`  File ${index + 1}: ${result.filename}`);
      console.log(`    Original: ${(result.compression.originalSize / 1024).toFixed(1)} KB`);
      console.log(`    Compressed: ${(result.size / 1024).toFixed(1)} KB`);
      console.log(`    Reduction: ${result.compression.compressionRatio}%`);
    });
    
    if (uncompressedFiles.length > 0) {
      console.log('\n📝 Files not compressed:');
      uncompressedFiles.forEach((result, index) => {
        console.log(`  File ${index + 1}: ${result.filename}`);
        console.log(`    Reason: ${result.compression.reason}`);
      });
    }
    
    // Save comprehensive results
    const summaryFile = path.join(OUTPUT_DIR, 'compression-test-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify({
      testDate: new Date().toISOString(),
      summary: {
        totalFiles: results.length,
        compressedFiles: compressedFiles.length,
        uncompressedFiles: uncompressedFiles.length,
        totalOriginalSize,
        totalFinalSize,
        totalSaved,
        overallReduction: totalOriginalSize > 0 ? ((totalSaved / totalOriginalSize) * 100) : 0
      },
      results
    }, null, 2));
    
    console.log(`\n✅ Test completed successfully!`);
    console.log(`📁 Results saved to: ${OUTPUT_DIR}`);
    console.log(`📊 Summary file: compression-test-summary.json`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runCompressionTests().catch(console.error);
}

module.exports = {
  runCompressionTests,
  authenticate,
  testFileUpload
};