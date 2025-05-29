// Test phone input length validation
// To test this, you can copy the PhoneInput component and test manually

const testPhoneNumbers = [
  { country: 'Tanzania (+255)', valid: '+255744117544', invalid: '+2557441175449' },
  { country: 'US (+1)', valid: '+15551234567', invalid: '+155512345678' },
  { country: 'UK (+44)', valid: '+447700900123', invalid: '+4477009001234' },
  { country: 'India (+91)', valid: '+919876543210', invalid: '+9198765432101' },
  { country: 'Kenya (+254)', valid: '+254700123456', invalid: '+2547001234567' },
  { country: 'Uganda (+256)', valid: '+256700123456', invalid: '+2567001234567' }
]

console.log('Phone Number Length Validation Tests:')
console.log('=====================================')

testPhoneNumbers.forEach(test => {
  console.log(`\n${test.country}:`)
  console.log(`  Valid (${test.valid.length} chars): ${test.valid}`)
  console.log(`  Invalid (${test.invalid.length} chars): ${test.invalid}`)
  
  // Simulate the validation logic
  const value = test.invalid
  let maxLength = 15 // Default for most countries
  
  if (value.startsWith('+255')) maxLength = 13      // Tanzania
  else if (value.startsWith('+1')) maxLength = 12   // US
  else if (value.startsWith('+44')) maxLength = 13  // UK
  else if (value.startsWith('+91')) maxLength = 13  // India
  else if (value.startsWith('+254')) maxLength = 13 // Kenya
  else if (value.startsWith('+256')) maxLength = 13 // Uganda
  
  const shouldBlock = value.length > maxLength
  console.log(`  Max allowed: ${maxLength}, Should block: ${shouldBlock}`)
})

console.log('\nThe PhoneInput component should now prevent typing beyond these limits!')
