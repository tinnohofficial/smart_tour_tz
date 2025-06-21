const nodemailer = require("nodemailer");

// Email configuration
const createTransporter = () => {
  // Check if we have email configuration
  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS
  ) {
    console.warn(
      "Email configuration missing. Email functionality will be disabled.",
    );
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName = "") => {
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error("Email service not configured");
  }

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Smart Tour Tanzania" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request - Smart Tour Tanzania",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button {
            display: inline-block;
            background-color: #f59e0b;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Smart Tour Tanzania</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hello${userName ? ` ${userName}` : ""},</p>
            <p>We received a request to reset your password for your Smart Tour Tanzania account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
            <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from Smart Tour Tanzania. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Smart Tour Tanzania - Password Reset Request

      Hello${userName ? ` ${userName}` : ""},

      We received a request to reset your password for your Smart Tour Tanzania account.

      Please visit the following link to reset your password:
      ${resetUrl}

      This link will expire in 1 hour for security reasons.

      If you didn't request this password reset, please ignore this email and your password will remain unchanged.

      Best regards,
      Smart Tour Tanzania Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

// Send email verification email (for future use)
const sendEmailVerificationEmail = async (
  email,
  verificationToken,
  userName = "",
) => {
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error("Email service not configured");
  }

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: `"Smart Tour Tanzania" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - Smart Tour Tanzania",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button {
            display: inline-block;
            background-color: #f59e0b;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Smart Tour Tanzania</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hello${userName ? ` ${userName}` : ""},</p>
            <p>Welcome to Smart Tour Tanzania! Please verify your email address to complete your registration.</p>
            <p>Click the button below to verify your email:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p><strong>This link will expire in 24 hours.</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email from Smart Tour Tanzania. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Smart Tour Tanzania - Email Verification

      Hello${userName ? ` ${userName}` : ""},

      Welcome to Smart Tour Tanzania! Please verify your email address to complete your registration.

      Please visit the following link to verify your email:
      ${verificationUrl}

      This link will expire in 24 hours.

      Best regards,
      Smart Tour Tanzania Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email verification sent to ${email}`);
  } catch (error) {
    console.error("Error sending email verification:", error);
    throw new Error("Failed to send email verification");
  }
};

// Send general notification email (for future use)
const sendNotificationEmail = async (
  email,
  subject,
  message,
  userName = "",
) => {
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error("Email service not configured");
  }

  const mailOptions = {
    from: `"Smart Tour Tanzania" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${subject} - Smart Tour Tanzania`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Smart Tour Tanzania</h1>
          </div>
          <div class="content">
            <p>Hello${userName ? ` ${userName}` : ""},</p>
            <div>${message}</div>
          </div>
          <div class="footer">
            <p>This is an automated email from Smart Tour Tanzania. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Smart Tour Tanzania - ${subject}

      Hello${userName ? ` ${userName}` : ""},

      ${message.replace(/<[^>]*>/g, "")}

      Best regards,
      Smart Tour Tanzania Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Notification email sent to ${email}`);
  } catch (error) {
    console.error("Error sending notification email:", error);
    throw new Error("Failed to send notification email");
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
  sendNotificationEmail,
};
