# Email Service Documentation

This directory contains centralized email services for the Smart Tour Tanzania application.

## Email Service (`emailService.js`)

The email service provides functionality for sending various types of emails including password reset, email verification, and general notifications.

### Features

- **Password Reset Emails**: Secure password reset functionality with time-limited tokens
- **Email Verification**: For user registration verification (ready for future implementation)
- **General Notifications**: Flexible notification system for various app events
- **HTML + Text**: All emails include both HTML and plain text versions
- **Branded Templates**: Consistent Smart Tour Tanzania branding

### Setup

#### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL (for reset links)
FRONTEND_URL=http://localhost:3000
```

#### 2. Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Use the app password** (not your regular Gmail password) in `EMAIL_PASS`

#### 3. Alternative Email Providers

**Outlook/Hotmail:**
```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Yahoo:**
```bash
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Custom SMTP:**
```bash
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587  # or 465 for SSL
EMAIL_SECURE=true  # true for port 465, false for other ports
```

### Usage

#### Password Reset Email

```javascript
const { sendPasswordResetEmail } = require('../services/emailService');

try {
  await sendPasswordResetEmail(
    'user@example.com',
    'reset_token_here',
    'User Name' // optional
  );
} catch (error) {
  console.error('Failed to send password reset email:', error);
}
```

#### Email Verification (Future Use)

```javascript
const { sendEmailVerificationEmail } = require('../services/emailService');

try {
  await sendEmailVerificationEmail(
    'user@example.com',
    'verification_token_here',
    'User Name' // optional
  );
} catch (error) {
  console.error('Failed to send verification email:', error);
}
```

#### General Notifications

```javascript
const { sendNotificationEmail } = require('../services/emailService');

try {
  await sendNotificationEmail(
    'user@example.com',
    'Booking Confirmed',
    '<p>Your booking has been confirmed!</p>',
    'User Name' // optional
  );
} catch (error) {
  console.error('Failed to send notification email:', error);
}
```

### Error Handling

The email service includes comprehensive error handling:

- **Configuration Missing**: Returns helpful error if email environment variables are not set
- **Send Failures**: Catches and logs email sending errors
- **Security**: Doesn't expose internal email errors to clients

### Security Features

- **Token-based Authentication**: Uses secure random tokens for password resets
- **Time-limited Links**: Password reset links expire after 1 hour
- **No Email Enumeration**: Always returns success message regardless of email existence
- **HTML Sanitization**: Safe handling of dynamic content in emails

### Email Templates

All emails use responsive HTML templates with:
- Smart Tour Tanzania branding
- Consistent styling and colors
- Fallback text versions
- Clear call-to-action buttons
- Professional footer

### Database Requirements

The password reset functionality requires the `password_reset_tokens` table:

```sql
CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_password_reset_token (token),
    INDEX idx_password_reset_user_id (user_id),
    INDEX idx_password_reset_expires (expires_at)
);
```

### Testing

To test email functionality:

1. Ensure environment variables are properly configured
2. Use a real email address for testing
3. Check spam folder if emails don't arrive
4. Monitor server logs for email sending errors

### Troubleshooting

**Common Issues:**

1. **"Authentication failed"**: Check that you're using an app password (not regular password) for Gmail
2. **"Connection timeout"**: Verify EMAIL_HOST and EMAIL_PORT settings
3. **"Email not configured"**: Ensure all required environment variables are set
4. **Emails in spam**: Add your domain to SPF/DKIM records or use a dedicated email service

**Production Recommendations:**

- Use a dedicated email service (SendGrid, AWS SES, Mailgun) instead of Gmail
- Set up proper SPF, DKIM, and DMARC records for your domain
- Monitor email delivery rates and bounce handling
- Implement email rate limiting to prevent abuse