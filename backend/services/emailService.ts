import nodemailer from 'nodemailer'
import { env } from '../env'

console.log('Setting up email transporter with Gmail:')
console.log(`- HOST: ${env.EMAIL_HOST}`)
console.log(`- PORT: ${env.EMAIL_PORT}`)
console.log(`- USER: ${env.EMAIL_USER}`)

// Create a transporter for Gmail
const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: Number(env.EMAIL_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS
  },
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false
  }
})

// Test the connection
transporter.verify((error) => {
  if (error) {
    console.error('Email service error:', error)
  } else {
    console.log('Gmail SMTP server is ready to send messages')
  }
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email using the configured transport
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: env.EMAIL_FROM,
    ...options
  }
  
  try {
    console.log(`Attempting to send email to: ${options.to}`)
    const info = await transporter.sendMail(mailOptions)
    console.log(`Email sent to: ${options.to}`)
    console.log(`Message ID: ${info.messageId}`)
    
    // For Mailtrap, we can output the preview URL
    if (env.EMAIL_HOST.includes('mailtrap')) {
      console.log(`Preview URL: https://mailtrap.io/inboxes`)
    }
  } catch (error: unknown) {
    console.error('Error sending email:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to send email: ${errorMessage}`)
  }
}

/**
 * Send a verification email
 */
export const sendVerificationEmail = async (
  to: string,
  username: string,
  verificationToken: string
): Promise<void> => {
  // Make sure the verification link points correctly to the frontend route
  // Note: using lowercase 'verify-email' to match the route
  const verificationLink = `${env.APP_URL}/verify-email?token=${verificationToken}`
  
  console.log(`Generated verification link: ${verificationLink} for user: ${username}`)
  
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
  `
  
  const text = `
    Welcome to E-Connect!
    
    Hello ${username},
    
    Thank you for registering with E-Connect. To complete your registration, please verify your email address by clicking the link below:
    
    ${verificationLink}
    
    This link will expire in 24 hours.
    
    If you did not create an account, please ignore this email.
    
    © ${new Date().getFullYear()} E-Connect. All rights reserved.
  `
  
  await sendEmail({
    to,
    subject: 'Verify Your E-Connect Account',
    html,
    text
  })
}

/**
 * Send a password reset email
 */
export const sendPasswordResetEmail = async (
  to: string,
  username: string,
  resetToken: string
): Promise<void> => {
  // Create the reset link to the frontend route
  const resetLink = `${env.APP_URL}/reset-password?token=${resetToken}`
  
  console.log(`Generated password reset link: ${resetLink} for user: ${username}`)
  
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
  `
  
  const text = `
    Reset Your E-Connect Password
    
    Hello ${username},
    
    We received a request to reset your E-Connect account password. Click the link below to create a new password:
    
    ${resetLink}
    
    This link will expire in 2 hours.
    
    If you did not request a password reset, please ignore this email and your password will remain unchanged.
    
    © ${new Date().getFullYear()} E-Connect. All rights reserved.
  `
  
  await sendEmail({
    to,
    subject: 'Reset Your E-Connect Password',
    html,
    text
  })
}
