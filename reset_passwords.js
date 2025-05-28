const bcrypt = require('bcrypt');
const db = require('./backend/config/db');

async function resetUserPasswords() {
  try {
    console.log('Resetting user passwords...');
    
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update all users with the same hashed password
    const [result] = await db.query(
      'UPDATE users SET password_hash = ?',
      [hashedPassword]
    );
    
    console.log(`Updated ${result.affectedRows} users with hashed password`);
    console.log('All users now have password: password123');
    
    // Show current users
    const [users] = await db.query('SELECT id, email, role FROM users');
    console.log('\nCurrent users:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    
  } catch (error) {
    console.error('Error resetting passwords:', error);
  } finally {
    process.exit(0);
  }
}

resetUserPasswords();
