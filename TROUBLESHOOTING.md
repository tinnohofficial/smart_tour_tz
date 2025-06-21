# Smart Tour Tanzania - Troubleshooting Guide

## Common Issues and Solutions

### 1. Cart/Database Foreign Key Errors

**Symptoms:**
- Error message: "Cannot add or update a child row: a foreign key constraint fails"
- Cart functionality not working
- User ID not found errors

**Cause:**
This happens when you've recreated the database (using teardown/setup scripts) but your browser still has old authentication tokens that reference user IDs that no longer exist.

**Solution A: Clear Browser Data (Recommended)**
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Run this command:
```javascript
localStorage.clear(); window.location.reload();
```

**Solution B: Manual Cleanup**
1. Open browser Developer Tools (F12)
2. Go to Application/Storage tab
3. Find "Local Storage" → your domain
4. Delete these keys:
   - `token`
   - `userData`
   - `loginTimestamp`
   - `smart-tour-cart`
5. Refresh the page

**Solution C: Re-register/Login**
1. Clear browser data using Solution A
2. Register a new account or login with existing credentials
3. The system will create a new user record with correct ID

---

### 2. Email Verification Issues

**Symptoms:**
- "Please verify your email" message after registration
- Cannot login even with correct password
- Email verification emails not received

**Solutions:**

**For Gmail Setup:**
1. Make sure you're using an App Password (not your regular Gmail password)
2. Enable 2-Factor Authentication on your Gmail account
3. Generate App Password: Google Account → Security → 2-Step Verification → App passwords
4. Use the 16-character app password in `EMAIL_PASS`

**Email Not Received:**
1. Check spam/junk folder
2. Wait up to 5 minutes (email delivery can be delayed)
3. Use "Resend verification email" option on the check-email page
4. Verify your email environment variables are correct

**Skip Email Verification (Development Only):**
```sql
-- Run this SQL command to mark your email as verified
UPDATE users SET email_verified = TRUE WHERE email = 'your-email@example.com';
```

---

### 3. Database Connection Issues

**Symptoms:**
- Server won't start
- "Connection refused" errors
- Database connection timeouts

**Solutions:**
1. Verify MySQL is running: `brew services start mysql` (macOS) or `sudo service mysql start` (Linux)
2. Check database credentials in `.env` file
3. Ensure database exists: `CREATE DATABASE smart_tour_tanzania;`
4. Verify user permissions

---

### 4. Frontend Build Errors

**Symptoms:**
- Next.js build failures
- "useSearchParams should be wrapped in Suspense" warnings
- Component rendering errors

**Solutions:**
1. Clear Next.js cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check for missing Suspense boundaries in pages using `useSearchParams`

---

### 5. Authentication Token Errors

**Symptoms:**
- Sudden logouts
- "User not found" errors
- Permission denied errors

**Quick Fix Script:**
Run this in browser console to reset authentication:
```javascript
// Clear all auth data and redirect to login
localStorage.removeItem('token');
localStorage.removeItem('userData');
localStorage.removeItem('loginTimestamp');
localStorage.removeItem('smart-tour-cart');
window.location.href = '/login';
```

---

### 6. Password Reset Issues

**Symptoms:**
- Reset emails not being sent
- "Email service not configured" errors
- Invalid reset tokens

**Solutions:**
1. Verify email environment variables in backend `.env`
2. Check that `FRONTEND_URL` is set correctly
3. For Gmail: ensure app password is used, not regular password
4. Reset tokens expire in 1 hour - request a new one if expired

---

### 7. Environment Configuration

**Required Backend Environment Variables:**
```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=smart_tour_tanzania

# JWT
JWT_SECRET=your_secure_random_key
JWT_EXPIRES_IN=30d

# Server
PORT=5000

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email (for Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
```

**Required Frontend Environment Variables:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### 8. Database Schema Issues

**Symptoms:**
- Missing table/column errors
- Foreign key constraint failures
- Schema mismatch errors

**Solution:**
Reset database with latest schema:
```bash
cd fyp/backend
node config/teardownDb.js
node config/setupDb.js
```

**Note:** This will delete all existing data!

---

### 9. Development Server Issues

**Backend Won't Start:**
1. Check if port 5000 is available: `lsof -i :5000`
2. Kill existing process: `kill -9 <PID>`
3. Verify all dependencies: `npm install`
4. Check `.env` file exists and is properly configured

**Frontend Won't Start:**
1. Check if port 3000 is available: `lsof -i :3000`
2. Clear Next.js cache: `rm -rf .next`
3. Verify dependencies: `npm install`

---

### 10. Role-Based Access Issues

**Symptoms:**
- "Access denied" errors
- Wrong dashboard redirects
- Missing features for specific roles

**Solutions:**
1. Check user role in localStorage: `JSON.parse(localStorage.getItem('userData')).role`
2. Verify user status is "active" for tourists or appropriate status for other roles
3. For non-tourist roles, ensure profile is completed

---

## Getting Help

If these solutions don't resolve your issue:

1. **Check Browser Console:** Look for error messages in Developer Tools
2. **Check Server Logs:** Look at backend terminal for detailed error messages
3. **Verify Environment:** Ensure all required environment variables are set
4. **Database State:** Check if database exists and has correct schema

## Quick Reset Commands

**Complete System Reset (Development):**
```bash
# Backend
cd fyp/backend
node config/teardownDb.js
node config/setupDb.js

# Frontend (in browser console)
localStorage.clear(); window.location.reload();
```

**Auth Only Reset:**
```javascript
// In browser console
['token', 'userData', 'loginTimestamp', 'smart-tour-cart'].forEach(key => localStorage.removeItem(key));
window.location.href = '/login';
```
