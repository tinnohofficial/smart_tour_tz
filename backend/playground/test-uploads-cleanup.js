/**
 * Test script to verify uploads directory cleanup functionality
 */

const fs = require('fs');
const path = require('path');
const { cleanUploadsDirectory } = require('../config/teardownDb');

// Path to uploads directory
const uploadsDir = path.join(__dirname, '../uploads');

// Function to create test files in uploads directory
function createTestFiles(count = 5) {
  console.log(`Creating ${count} test files in uploads directory...`);
  
  // Ensure the directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
  }
  
  // Create some test files
  for (let i = 1; i <= count; i++) {
    const filePath = path.join(uploadsDir, `test-file-${i}.txt`);
    fs.writeFileSync(filePath, `This is test file ${i}`);
    console.log(`Created test file: ${filePath}`);
  }
  
  // Create a fake image file
  const imageFilePath = path.join(uploadsDir, 'test-image.jpg');
  fs.writeFileSync(imageFilePath, 'Fake image content');
  console.log(`Created test image: ${imageFilePath}`);
  
  // Count files in the directory (excluding .gitkeep)
  const files = fs.readdirSync(uploadsDir).filter(file => file !== '.gitkeep');
  console.log(`Total files in uploads directory: ${files.length}`);
}

// Function to check uploads directory content
function checkUploadsDirectory() {
  if (!fs.existsSync(uploadsDir)) {
    console.log('Uploads directory does not exist.');
    return;
  }
  
  // Get all files except .gitkeep
  const files = fs.readdirSync(uploadsDir).filter(file => file !== '.gitkeep');
  
  console.log(`Files in uploads directory: ${files.length}`);
  if (files.length > 0) {
    console.log('Files found:');
    files.forEach(file => console.log(` - ${file}`));
  } else {
    console.log('Directory is empty (except for .gitkeep).');
  }
  
  // Check if .gitkeep exists
  const gitkeepExists = fs.existsSync(path.join(uploadsDir, '.gitkeep'));
  console.log(`.gitkeep exists: ${gitkeepExists}`);
}

// Run test
async function runTest() {
  console.log('=== UPLOADS CLEANUP TEST ===');
  
  // Initial state
  console.log('\n1. Initial state:');
  checkUploadsDirectory();
  
  // Create test files
  console.log('\n2. After creating test files:');
  createTestFiles();
  checkUploadsDirectory();
  
  // Run cleanup
  console.log('\n3. After cleanup:');
  cleanUploadsDirectory();
  checkUploadsDirectory();
  
  console.log('\nTest completed successfully!');
}

// Run the test if this script is executed directly
if (require.main === module) {
  runTest()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Test failed:', err);
      process.exit(1);
    });
}

module.exports = { createTestFiles, checkUploadsDirectory, runTest };