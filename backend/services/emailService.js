"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = exports.sendVerificationEmail = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../env");
console.log('Setting up email transporter with Gmail:');
console.log(`- HOST: ${env_1.env.EMAIL_HOST}`);
console.log(`- PORT: ${env_1.env.EMAIL_PORT}`);
console.log(`- USER: ${env_1.env.EMAIL_USER}`);
// Create a transporter for Gmail
const transporter = nodemailer_1.default.createTransport({
    host: env_1.env.EMAIL_HOST,
    port: Number(env_1.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: env_1.env.EMAIL_USER,
        pass: env_1.env.EMAIL_PASS
    },
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
    }
});
// Test the connection
transporter.verify((error) => {
    if (error) {
        console.error('Email service error:', error);
    }
    else {
        console.log('Gmail SMTP server is ready to send messages');
    }
});
/**
 * Send an email using the configured transport
 */
const sendEmail = async (options) => {
    const mailOptions = {
        from: env_1.env.EMAIL_FROM,
        ...options
    };
    try {
        console.log(`Attempting to send email to: ${options.to}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to: ${options.to}`);
        console.log(`Message ID: ${info.messageId}`);
        // For Mailtrap, we can output the preview URL
        if (env_1.env.EMAIL_HOST.includes('mailtrap')) {
            console.log(`Preview URL: https://mailtrap.io/inboxes`);
        }
    }
    catch (error) {
        console.error('Error sending email:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to send email: ${errorMessage}`);
    }
};
exports.sendEmail = sendEmail;
/**
 * Send a verification email
 */
const sendVerificationEmail = async (to, username, verificationToken) => {
    // Make sure the verification link points correctly to the frontend route
    // Note: using lowercase 'verify-email' to match the route
    const verificationLink = `${env_1.env.APP_URL}/verify-email?token=${verificationToken}`;
    console.log(`Generated verification link: ${verificationLink} for user: ${username}`);
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50; text-align: center;">Welcome to E-Connect!</h2>
      <p>Hello ${username},</p>
      <p>Thank you for registering with E-Connect. To complete your registration, please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" 
           style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Verify Email
        </a>
      </div>
      <p>If the button above doesn't work, please copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${verificationLink}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
      <hr style="border: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #777; font-size: 12px; text-align: center;">
        &copy; ${new Date().getFullYear()} E-Connect. All rights reserved.
      </p>
    </div>
  `;
    const text = `
    Welcome to E-Connect!
    
    Hello ${username},
    
    Thank you for registering with E-Connect. To complete your registration, please verify your email address by clicking the link below:
    
    ${verificationLink}
    
    This link will expire in 24 hours.
    
    If you did not create an account, please ignore this email.
    
    © ${new Date().getFullYear()} E-Connect. All rights reserved.
  `;
    await (0, exports.sendEmail)({
        to,
        subject: 'Verify Your E-Connect Account',
        html,
        text
    });
};
exports.sendVerificationEmail = sendVerificationEmail;
/**
 * Send a password reset email
 */
const sendPasswordResetEmail = async (to, username, resetToken) => {
    // Create the reset link to the frontend route
    const resetLink = `${env_1.env.APP_URL}/reset-password?token=${resetToken}`;
    console.log(`Generated password reset link: ${resetLink} for user: ${username}`);
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50; text-align: center;">Reset Your E-Connect Password</h2>
      <p>Hello ${username},</p>
      <p>We received a request to reset your E-Connect account password. Click the button below to create a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Reset Password
        </a>
      </div>
      <p>If the button above doesn't work, please copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetLink}</p>
      <p>This link will expire in 2 hours.</p>
      <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
      <hr style="border: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #777; font-size: 12px; text-align: center;">
        &copy; ${new Date().getFullYear()} E-Connect. All rights reserved.
      </p>
    </div>
  `;
    const text = `
    Reset Your E-Connect Password
    
    Hello ${username},
    
    We received a request to reset your E-Connect account password. Click the link below to create a new password:
    
    ${resetLink}
    
    This link will expire in 2 hours.
    
    If you did not request a password reset, please ignore this email and your password will remain unchanged.
    
    © ${new Date().getFullYear()} E-Connect. All rights reserved.
  `;
    await (0, exports.sendEmail)({
        to,
        subject: 'Reset Your E-Connect Password',
        html,
        text
    });
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
