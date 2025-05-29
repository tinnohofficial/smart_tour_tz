// Test script to validate phone number functionality
const { isValidPhoneNumber, parsePhoneNumber } = require('libphonenumber-js');

console.log('Testing phone number validation...\n');

const testNumbers = [
  '+255712345678',    // Tanzania (valid)
  '+2557123456789',   // Tanzania (too long)
  '+25571234567',     // Tanzania (too short)
  '+1234567890',      // US (valid)
  '+12345678901',     // US (too long)
  '+44123456789',     // UK (valid)
  '+441234567890',    // UK (too long)
  '+919876543210',    // India (valid)
  '+91987654321012',  // India (too long)
  '255712345678',     // No + sign (invalid)
  '+255abc123456',    // Contains letters (invalid)
  '',                 // Empty (invalid)
];

testNumbers.forEach(number => {
  try {
    const isValid = isValidPhoneNumber(number);
    let formatted = '';
    if (isValid) {
      const parsed = parsePhoneNumber(number);
      formatted = ` | Formatted: ${parsed.formatInternational()}`;
    }
    console.log(`${number.padEnd(15)} | Valid: ${isValid}${formatted}`);
  } catch (error) {
    console.log(`${number.padEnd(15)} | Error: ${error.message}`);
  }
});

console.log('\nValidation complete!');
