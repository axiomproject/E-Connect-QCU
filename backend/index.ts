import express from 'express'
import { type Handler } from 'vite-plugin-mix'
const { env } = require('./env');
import cors from 'cors'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt' // Import bcrypt
import crypto from 'crypto' // For generating verification tokens
const emailService = require('./services/emailService');
const notificationServiceModule = require('./services/notificationService');
const dbModule = require('./db');
import multer from 'multer'; // Import multer for file uploads
import path from 'path'; // Import path for file paths
import fs from 'fs'; // Import fs for file system operations


// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Notice how SECRET, from `.env` is loaded like this.
console.log(`Secret: ${env.JWT_SECRET}, hostname: ${env.HOSTNAME}`)

const app = express()

// Middleware
app.use(cors())
app.use(bodyParser.json())

const sendVerificationEmail = emailService.sendVerificationEmail;
const sendPasswordResetEmail = emailService.sendPasswordResetEmail;
const NotificationService = notificationServiceModule.NotificationService;
const pool = dbModule.pool;


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use path.resolve with process.cwd() instead of __dirname
    const uploadDir = path.resolve(process.cwd(), 'public/uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with user id
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Simple in-memory user database (replace with real DB in production)
interface User {
  id: number;
  username: string;
  email: string;
  password: string;
}

const users: User[] = []

// Authentication middleware
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) return res.status(401).json({ message: 'Authentication required' })
  
  jwt.verify(token, env.JWT_SECRET, (err: jwt.VerifyErrors | null, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' })
    req.user = user
    next()
  })
}

// Admin middleware to check if user is an admin
const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) return res.status(401).json({ message: 'Authentication required' })
  
  jwt.verify(token, env.JWT_SECRET, async (err: jwt.VerifyErrors | null, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' })
    
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' })
    }
    
    // Verify the admin still exists and is active
    try {
      const adminResult = await pool.query(
        'SELECT * FROM admin_users WHERE id = $1 AND is_active = TRUE',
        [user.id]
      );
      
      if (adminResult.rowCount === 0) {
        return res.status(403).json({ message: 'Admin account not found or inactive' })
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error('Admin authentication error:', error);
      return res.status(500).json({ message: 'Server error during admin authentication' });
    }
  })
}

// Helper function to generate a random token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex')
}

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body
    
    // Check if user already exists in the database
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    
    if (userCheck?.rowCount && userCheck.rowCount > 0) {
      return res.status(400).json({ message: 'User already exists' })
    }
    
    // Hash the password with bcrypt
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    // Start a transaction
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      
      // Insert new user
      const userResult = await client.query(
        'INSERT INTO users (username, email, password, is_verified) VALUES ($1, $2, $3, $4) RETURNING id',
        [username, email, hashedPassword, false]
      )
      
      const userId = userResult.rows[0].id
      
      // Generate verification token
      const verificationToken = generateToken()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // Token valid for 24 hours
      
      // Store verification token
      await client.query(
        'INSERT INTO email_verification (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [userId, verificationToken, expiresAt]
      )

      try {
        await NotificationService.createNewUserNotification(userId, username);
      } catch (notificationError) {
        // Log but don't fail registration if notification creation fails
        console.error('Failed to create notification for new user registration:', notificationError);
      }
      
      await client.query('COMMIT')
      
      // Send the verification email
      const verificationLink = `${env.APP_URL}/verify-email?token=${verificationToken}`
      await sendVerificationEmail(email, username, verificationToken);
      console.log(`Verification link: ${verificationLink}`)
      
      res.status(201).json({ 
        message: 'User created! Please check your email to verify your account.',
        verificationLink: verificationLink // Only for testing - remove in production
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Server error during registration' })
  }
})

// Add this endpoint to record ad clicks
app.post('/api/ad-click', async (req, res) => {
  try {
    const { adName } = req.body;
    if (!adName) {
      return res.status(400).json({ message: 'adName is required' });
    }

    // Upsert: increment click_count if exists, else insert new row
    await pool.query(
      `
      INSERT INTO ad_clicks (ad_name, click_count, last_clicked_at)
      VALUES ($1, 1, NOW())
      ON CONFLICT (ad_name)
      DO UPDATE SET click_count = ad_clicks.click_count + 1, last_clicked_at = NOW()
      `,
      [adName]
    );

    res.json({ message: 'Ad click recorded' });
  } catch (error) {
    console.error('Error recording ad click:', error);
    res.status(500).json({ message: 'Error recording ad click' });
  }
})

// Admin endpoint to fetch ad click stats
app.get('/api/admin/ad-clicks', authenticateAdmin, async (req, res) => {
  try {
    // Fetch all ad clicks, order by most clicks
    const result = await pool.query(
      'SELECT ad_name, click_count, last_clicked_at FROM ad_clicks ORDER BY click_count DESC, last_clicked_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ad clicks:', error);
    res.status(500).json({ message: 'Error fetching ad clicks' });
  }
});

// User Goal Management API endpoints
app.get('/api/user/goals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Query to get all goals for the user
    const result = await pool.query(
      `SELECT * FROM user_goals WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user goals:', error);
    res.status(500).json({ message: 'Error fetching goals' });
  }
});

app.post('/api/user/goals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      title, description, category, target, 
      unit, startDate, endDate 
    } = req.body;
    
    // Validate required fields
    if (!title || !category || !target || !unit || !startDate || !endDate) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Insert new goal
    const result = await pool.query(
      `INSERT INTO user_goals 
        (user_id, title, description, category, target, current, unit, start_date, end_date, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [userId, title, description, category, target, 0, unit, startDate, endDate]
    );

    // Add this part - Record this activity
    const newGoalId = result.rows[0].id;
    await pool.query(
      `INSERT INTO goal_activities 
       (user_id, goal_id, activity_type, activity_date) 
       VALUES ($1, $2, 'created', NOW())`,
      [userId, newGoalId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ 
      message: 'Error creating goal', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

app.put('/api/user/goals/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;
    const { current } = req.body;
    
    // Validate input
    if (current === undefined) {
      return res.status(400).json({ message: 'Current progress value is required' });
    }
    
    // Get the goal's target to calculate progress percentage
    const goalResult = await pool.query(
      'SELECT * FROM user_goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );
    
    if (goalResult.rowCount === 0) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    const goal = goalResult.rows[0];
    const progress = Math.min(Math.round((current / goal.target) * 100), 100);
    
    // Update the goal progress
    const result = await pool.query(
      `UPDATE user_goals 
       SET current = $1, progress = $2, updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [current, progress, goalId, userId]
    );

     // Add this part - Record this update activity
     await pool.query(
      `INSERT INTO goal_activities 
       (user_id, goal_id, activity_type, progress, activity_date) 
       VALUES ($1, $2, 'updated', $3, NOW())`,
      [userId, goalId, progress]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating goal progress:', error);
    res.status(500).json({ message: 'Error updating goal progress' });
  }
});

app.delete('/api/user/goals/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = req.params.id;
    
    // Delete the goal
    await pool.query(
      'DELETE FROM user_goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );
    
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: 'Error deleting goal' });
  }
});

// Password reset endpoints
app.post('/api/reset-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    console.log(`Processing password reset request for email: ${email}`);
    
    // Find user by email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    // Don't reveal if email exists or not for security reasons
    if (userResult.rowCount === 0) {
      console.log(`No user found with email: ${email}`);
      // Return the same success message even if user doesn't exist
      return res.status(200).json({ 
        message: 'If your email exists in our system, a password reset link will be sent'
      });
    }
    
    // Generate a password reset token
    const resetToken = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); // Token valid for 2 hours
    
    const user = userResult.rows[0];
    console.log(`Found user: ${user.username} (ID: ${user.id}), generating reset token`);
    
    try {
      // First check if table exists and create it if not
      await pool.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        )
      `);
      
      // Then try to insert or update the token
      await pool.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
        [user.id]
      );
      
      await pool.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, resetToken, expiresAt]
      );
      
      console.log(`Reset token stored for user ${user.id}`);
    } catch (dbError) {
      console.error('Database error storing reset token:', dbError);
      throw new Error('Failed to store reset token: ' + (dbError instanceof Error ? dbError.message : 'Unknown error'));
    }
    
    // Send password reset email
    try {
      console.log(`Attempting to send password reset email to ${email}`);
      await sendPasswordResetEmail(email, user.username, resetToken);
      console.log(`Password reset link: ${env.APP_URL}/reset-password?token=${resetToken}`);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      return res.status(500).json({ message: 'Failed to send password reset email' });
    }
    
    res.json({ 
      message: 'If your email exists in our system, a password reset link will be sent',
      // Only for testing - remove in production
      resetLink: `${env.APP_URL}/reset-password?token=${resetToken}`
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Server error processing password reset request' });
  }
});

// Verify password reset token
app.post('/api/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }
    
    // Find token in database
    const tokenResult = await pool.query(
      'SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1',
      [token]
    );
    
    if (tokenResult.rowCount === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Check if token is expired
    const tokenData = tokenResult.rows[0];
    const expiresAt = new Date(tokenData.expires_at);
    
    if (expiresAt < new Date()) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }
    
    res.json({ message: 'Token is valid', userId: tokenData.user_id });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Server error verifying reset token' });
  }
});

// Reset password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    
    // Find token in database
    const tokenResult = await pool.query(
      'SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1',
      [token]
    );
    
    if (tokenResult.rowCount === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Check if token is expired
    const tokenData = tokenResult.rows[0];
    const expiresAt = new Date(tokenData.expires_at);
    
    if (expiresAt < new Date()) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }
    
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Update user's password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, tokenData.user_id]
    );
    
    // Delete the used token
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE token = $1',
      [token]
    );
    
    res.json({ message: 'Password has been reset successfully' });
    
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error resetting password' });
  }
});

// Email verification endpoint - simplified for troubleshooting
app.get('/api/verify-email', async (req, res) => {
  const client = await pool.connect(); // Get a client for transaction
  
  try {
    const { token: verificationToken } = req.query
    
    if (!verificationToken) {
      return res.status(400).json({ message: 'Verification token is required' })
    }
    
    console.log(`Processing verification token: ${verificationToken}`)
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Find the user ID associated with this token
    const tokenResult = await client.query(
      `SELECT user_id FROM email_verification WHERE token = $1`,
      [verificationToken]
    );
    
    if (tokenResult.rowCount === 0) {
      console.log('No verification record found for token');
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid verification token' })
    }
    
    const userId = tokenResult.rows[0].user_id;
    console.log(`Found user ID: ${userId}`);
    
    // Get user information
    const userResult = await client.query(
      `SELECT id, email, username, is_verified FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rowCount === 0) {
      console.log('User not found');
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'User not found' })
    }
    
    const user = userResult.rows[0];
    console.log(`User data:`, user);
    
    // Check if already verified
    if (user.is_verified === true) {
      console.log(`User ${userId} is already verified`);
      await client.query('COMMIT');
      return res.json({ 
        message: 'Email already verified',
        alreadyVerified: true,
        token: jwt.sign({ 
          id: userId, 
          email: user.email 
        }, env.JWT_SECRET, { expiresIn: '24h' }),
        user
      });
    }
    
    // Update the user as verified with direct SQL
    console.log(`Setting is_verified=TRUE for user ${userId}`);
    await client.query(
      `UPDATE users SET is_verified = TRUE WHERE id = $1`, 
      [userId]
    );
    
    // Verify the update succeeded
    const checkResult = await client.query(
      `SELECT is_verified FROM users WHERE id = $1`,
      [userId]
    );
    
    console.log(`Verification status after update: ${checkResult.rows[0].is_verified}`);
    
    // Delete the verification token
    await client.query(
      `DELETE FROM email_verification WHERE token = $1`,
      [verificationToken]
    );
    
    // Generate JWT token
    const token = jwt.sign({ 
      id: userId, 
      email: user.email 
    }, env.JWT_SECRET, { expiresIn: '24h' });
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log(`Verification completed successfully for ${user.email}`);
    
    // Send response
    res.json({ 
      message: 'Email verified successfully',
      token,
      user: {
        id: userId,
        email: user.email,
        username: user.username,
        is_verified: true
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Email verification error:', error)
    res.status(500).json({ message: 'Server error during email verification' })
  } finally {
    client.release();
  }
})

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Validate request
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    
    // Store the message in the database
    const result = await pool.query(
      'INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3) RETURNING id',
      [name, email, message]
    );
    
    const messageId = result.rows[0].id;
    console.log('Contact message saved with ID:', messageId);
    
    // Create notification for admin
    try {
      await NotificationService.createContactMessageNotification(messageId, name, email);
    } catch (notificationError) {
      // Log but don't fail if notification creation fails
      console.error('Failed to create notification for contact message:', notificationError);
    }
    
    res.status(201).json({
      message: 'Your message has been received',
      id: messageId
    });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ message: 'Server error while saving your message' });
  }
});

// Admin endpoint to get contact messages (requires admin authentication)
app.get('/api/admin/contact-messages', authenticateAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    // Build query based on filters
    let query = 'SELECT * FROM contact_messages';
    const params = [];
    let paramIndex = 1;
    let whereClauseAdded = false;
    
    if (status) {
      query += ' WHERE status = $' + paramIndex++;
      params.push(status);
      whereClauseAdded = true;
    }
    
    // Add search filter if provided
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      if (whereClauseAdded) {
        query += ' AND (name ILIKE $' + paramIndex + ' OR email ILIKE $' + paramIndex + ' OR message ILIKE $' + paramIndex + ')';
      } else {
        query += ' WHERE (name ILIKE $' + paramIndex + ' OR email ILIKE $' + paramIndex + ' OR message ILIKE $' + paramIndex + ')';
        whereClauseAdded = true;
      }
      params.push(searchTerm);
      paramIndex++;
    }
    
    // Add ordering and pagination
    query += ' ORDER BY created_at DESC LIMIT $' + paramIndex++ + ' OFFSET $' + paramIndex++;
    params.push(limit, offset);
    
    console.log('Contact messages query:', query, params);
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM contact_messages';
    const countParams = [];
    let countParamIndex = 1;
    let countWhereClauseAdded = false; // Separate flag for count query
    
    if (status) {
      countQuery += ' WHERE status = $' + countParamIndex++;
      countParams.push(status);
      countWhereClauseAdded = true;
    }
    
    // Add search filter to count query as well
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      if (countWhereClauseAdded) {
        countQuery += ' AND (name ILIKE $' + countParamIndex + ' OR email ILIKE $' + countParamIndex + ' OR message ILIKE $' + countParamIndex + ')';
      } else {
        countQuery += ' WHERE (name ILIKE $' + countParamIndex + ' OR email ILIKE $' + countParamIndex + ' OR message ILIKE $' + countParamIndex + ')';
        // Don't need to update countWhereClauseAdded here as we won't add more conditions
      }
      countParams.push(searchTerm);
    }
    
    console.log('Count query:', countQuery, countParams);
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      messages: result.rows,
      pagination: {
        total: totalCount,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalCount / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ message: 'Server error while fetching contact messages' });
  }
});

// Add this new endpoint to update contact message status
app.put('/api/admin/contact-messages/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const messageId = req.params.id;
    const { status } = req.body;
    
    // Validate status
    if (!status || !['unread', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Update message status
    const result = await pool.query(
      'UPDATE contact_messages SET status = $1 WHERE id = $2 RETURNING *',
      [status, messageId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json({
      message: 'Message status updated successfully',
      contactMessage: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ message: 'Server error while updating message status' });
  }
});

// Admin Challenge Management endpoints
app.get('/api/admin/challenges', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, category, difficulty, carbon_reduction, points, steps, benefits, 
      is_active, created_at FROM challenges ORDER BY created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admin challenges:', error);
    res.status(500).json({ message: 'Error fetching challenges' });
  }
});

app.post('/api/admin/challenges', authenticateAdmin, async (req, res) => {
  try {
    const { 
      title, description, category, difficulty, carbon_reduction, 
      points, steps, benefits, is_active 
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !category || !difficulty) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Parse steps ensuring it's a valid JSON array or use an empty array as default
    let stepsJson = [];
    try {
      if (typeof steps === 'string') {
        stepsJson = JSON.parse(steps);
      } else if (Array.isArray(steps)) {
        stepsJson = steps;
      }
    } catch (e) {
      console.error('Error parsing steps:', e);
      stepsJson = []; // Default to empty array on error
    }
    
    // Insert challenge using JSONB for steps
    const result = await pool.query(
      `INSERT INTO challenges 
        (title, description, category, difficulty, carbon_reduction, points, steps, benefits, is_active, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [title, description, category, difficulty, carbon_reduction, points, JSON.stringify(stepsJson), benefits, is_active ?? true]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error: unknown) {
    console.error('Error creating challenge:', error);
    res.status(500).json({ 
      message: 'Error creating challenge', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

app.put('/api/admin/challenges/:id', authenticateAdmin, async (req, res) => {
  try {
    const challengeId = req.params.id;
    const { 
      title, description, category, difficulty, carbon_reduction, 
      points, steps, benefits, is_active 
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !category || !difficulty) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Parse steps ensuring it's a valid JSON array or use an empty array as default
    let stepsJson = [];
    try {
      if (typeof steps === 'string') {
        stepsJson = JSON.parse(steps);
      } else if (Array.isArray(steps)) {
        stepsJson = steps;
      }
    } catch (e) {
      console.error('Error parsing steps:', e);
      stepsJson = []; // Default to empty array on error
    }
    
    // Update challenge using JSONB for steps
    const result = await pool.query(
      `UPDATE challenges SET
        title = $1,
        description = $2,
        category = $3,
        difficulty = $4,
        carbon_reduction = $5,
        points = $6,
        steps = $7,
        benefits = $8,
        is_active = $9
      WHERE id = $10
      RETURNING *`,
      [title, description, category, difficulty, carbon_reduction, points, JSON.stringify(stepsJson), 
        benefits, is_active, challengeId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating challenge:', error);
    res.status(500).json({ 
      message: 'Error updating challenge', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

app.patch('/api/admin/challenges/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const challengeId = req.params.id;
    const { is_active } = req.body;
    
    if (is_active === undefined) {
      return res.status(400).json({ message: 'is_active status is required' });
    }
    
    const result = await pool.query(
      'UPDATE challenges SET is_active = $1 WHERE id = $2 RETURNING *',
      [is_active, challengeId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error toggling challenge status:', error);
    res.status(500).json({ message: 'Error updating challenge status' });
  }
});

app.delete('/api/admin/challenges/:id', authenticateAdmin, async (req, res) => {
  try {
    const challengeId = req.params.id;
    
    // First check if the challenge exists
    const checkResult = await pool.query(
      'SELECT id FROM challenges WHERE id = $1',
      [challengeId]
    );
    
    if (checkResult.rowCount === 0) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    // Then delete it
    await pool.query('DELETE FROM challenges WHERE id = $1', [challengeId]);
    
    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    res.status(500).json({ message: 'Error deleting challenge' });
  }
});

// Add this new endpoint for popular challenges
app.get('/api/admin/challenges/popular', authenticateAdmin, async (req, res) => {
  try {
    // Query to get challenges with completion counts and rates
    const result = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.category,
        COUNT(uc.id) FILTER (WHERE uc.completed = TRUE) AS completion_count,
        COUNT(uc.id) AS total_attempts
      FROM challenges c
      LEFT JOIN user_challenges uc ON c.id = uc.challenge_id
      GROUP BY c.id, c.title, c.category
      ORDER BY completion_count DESC
      LIMIT 10
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching popular challenges:', error);
    res.status(500).json({ message: 'Error fetching popular challenges' });
  }
});

// Admin Badge Management endpoints
app.get('/api/admin/badges', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, icon, short_description, description, requirement, 
      category, rarity, points, created_at FROM badges ORDER BY created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admin badges:', error);
    res.status(500).json({ message: 'Error fetching badges' });
  }
});

app.post('/api/admin/badges', authenticateAdmin, async (req, res) => {
  try {
    const { 
      name, icon, short_description, description, requirement,
      category, rarity, points 
    } = req.body;
    
    // Validate required fields
    if (!name || !icon || !short_description || !description || !requirement || !category || !rarity) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Insert badge
    const result = await pool.query(
      `INSERT INTO badges 
        (name, icon, short_description, description, requirement, category, rarity, points, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [name, icon, short_description, description, requirement, category, rarity, points || 10]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating badge:', error);
    res.status(500).json({ 
      message: 'Error creating badge', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

app.put('/api/admin/badges/:id', authenticateAdmin, async (req, res) => {
  try {
    const badgeId = req.params.id;
    const { 
      name, icon, short_description, description, requirement,
      category, rarity, points
    } = req.body;
    
    // Validate required fields
    if (!name || !icon || !short_description || !description || !requirement || !category || !rarity) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Update badge
    const result = await pool.query(
      `UPDATE badges SET
        name = $1,
        icon = $2,
        short_description = $3,
        description = $4,
        requirement = $5,
        category = $6,
        rarity = $7,
        points = $8
      WHERE id = $9
      RETURNING *`,
      [name, icon, short_description, description, requirement, category, rarity, points, badgeId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating badge:', error);
    res.status(500).json({ 
      message: 'Error updating badge', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
});

app.delete('/api/admin/badges/:id', authenticateAdmin, async (req, res) => {
  try {
    const badgeId = req.params.id;
    
    // First check if the badge exists
    const checkResult = await pool.query(
      'SELECT id FROM badges WHERE id = $1',
      [badgeId]
    );
    
    if (checkResult.rowCount === 0) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    
    // Delete related user badge entries first to maintain referential integrity
    await pool.query('DELETE FROM user_badges WHERE badge_id = $1', [badgeId]);
    
    // Then delete the badge
    await pool.query('DELETE FROM badges WHERE id = $1', [badgeId]);
    
    res.json({ message: 'Badge deleted successfully' });
  } catch (error) {
    console.error('Error deleting badge:', error);
    res.status(500).json({ message: 'Error deleting badge' });
  }
});

// Update login endpoint to include admin status
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    // Find user in database
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    
    if (result.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    
    const user = result.rows[0]
    
    // Compare provided password with hashed password in database
    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    
    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in',
        isVerificationError: true
      })
    }

    // Add this check for account active status
if (!user.is_active) {
  return res.status(403).json({ 
    message: 'Your account has been archived. Please contact support to reactivate.',
    cause: 'account_inactive'
  })
}
    
    // Get admin details if user is an admin
    let adminDetails = null;
    if (user.is_admin) {
      const adminResult = await pool.query(
        'SELECT admin_level, permissions FROM admin_users WHERE user_id = $1',
        [user.id]
      );
      
      if (adminResult?.rowCount && adminResult.rowCount > 0) {
        adminDetails = adminResult.rows[0];
        
        // Update last admin login time
        await pool.query(
          'UPDATE admin_users SET last_admin_login = NOW() WHERE user_id = $1',
          [user.id]
        );
      }
    }
    
    // Generate token with isAdmin flag included
    const token = jwt.sign({ 
      id: user.id, 
      email: user.email,
      isAdmin: user.is_admin || false,
      adminLevel: adminDetails ? adminDetails.admin_level : null
    }, env.JWT_SECRET, { expiresIn: '24h' })
    
    res.json({ 
      message: 'Login successful', 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        is_active: user.is_active,
        isAdmin: user.is_admin || false,
        adminDetails: user.is_admin ? adminDetails : null
      } 
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
})

// Update the admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find the admin user in the admin_users table
    const adminResult = await pool.query(
      'SELECT * FROM admin_users WHERE email = $1',
      [email]
    );
    
    if (adminResult.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    
    const admin = adminResult.rows[0];
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }
    
    // Update last login time
    await pool.query(
      'UPDATE admin_users SET last_login = NOW() WHERE id = $1',
      [admin.id]
    );
    
    // Create admin details object
    const adminDetails = {
      admin_level: admin.admin_level,
      permissions: admin.permissions
    };
    
    // Generate token
    const token = jwt.sign({ 
      id: admin.id, 
      email: admin.email,
      isAdmin: true,
      adminLevel: admin.admin_level
    }, env.JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      message: 'Admin login successful', 
      token,
      user: { 
        id: admin.id, 
        username: admin.username, 
        email: admin.email,
        isAdmin: true,
        adminDetails
      } 
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// Admin settings routes
app.get('/api/admin/settings', authenticateAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // Fetch admin user data
    const adminResult = await pool.query(
      'SELECT id, username, email, avatar, admin_level, permissions FROM admin_users WHERE id = $1',
      [adminId]
    );
    
    if (adminResult.rowCount === 0) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    const admin = adminResult.rows[0];
    
    res.json({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      avatar: admin.avatar,
      admin_level: admin.admin_level,
      permissions: admin.permissions
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ message: 'Server error while fetching admin settings' });
  }
});

app.put('/api/admin/settings/profile', authenticateAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { username, email } = req.body;
    
    // Validate inputs
    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required' });
    }
    
    // Check if email is already in use by another admin
    const emailCheck = await pool.query(
      'SELECT id FROM admin_users WHERE email = $1 AND id != $2',
      [email, adminId]
    );
    
    if (emailCheck?.rowCount && emailCheck.rowCount > 0) {
      return res.status(400).json({ message: 'Email is already in use by another admin user' });
    }
    
    // Update admin profile
    await pool.query(
      'UPDATE admin_users SET username = $1, email = $2, updated_at = NOW() WHERE id = $3',
      [username, email, adminId]
    );
    
    res.json({ 
      message: 'Admin profile updated successfully',
      user: {
        id: adminId,
        username,
        email
      }
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ message: 'Server error while updating admin profile' });
  }
});

app.put('/api/admin/settings/password', authenticateAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Get current password from database
    const result = await pool.query(
      'SELECT password FROM admin_users WHERE id = $1',
      [adminId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    const admin = result.rows[0];
    
    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the password
    await pool.query(
      'UPDATE admin_users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, adminId]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing admin password:', error);
    res.status(500).json({ message: 'Server error while changing password' });
  }
});

app.post('/api/admin/settings/avatar', authenticateAdmin, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const adminId = req.user.id;
    const avatarUrl = `/uploads/${req.file.filename}`;

    // Store avatar URL in the database
    await pool.query(
      'UPDATE admin_users SET avatar = $1, updated_at = NOW() WHERE id = $2',
      [avatarUrl, adminId]
    );

    res.json({ 
      message: 'Avatar uploaded successfully',
      avatarUrl 
    });
  } catch (error) {
    console.error('Error uploading admin avatar:', error);
    res.status(500).json({ message: 'Server error while uploading avatar' });
  }
});

app.delete('/api/admin/settings/avatar', authenticateAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // First, get the current avatar to delete the file
    const result = await pool.query(
      'SELECT avatar FROM admin_users WHERE id = $1',
      [adminId]
    );
    
    // Update the avatar to null in the database
    await pool.query(
      'UPDATE admin_users SET avatar = NULL, updated_at = NOW() WHERE id = $1',
      [adminId]
    );
    
    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin avatar:', error);
    res.status(500).json({ message: 'Server error while deleting avatar' });
  }
});

app.use('/uploads', express.static(path.resolve(process.cwd(), 'public/uploads')));
// Add this new endpoint after your existing /api/admin/avatar-upload endpoint

// Improved admin avatar upload that doesn't require user ID in the filename
app.post('/api/admin/user-avatar-upload', authenticateAdmin, async (req, res) => {
  // Custom multer instance with simpler configuration
  const adminUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.resolve(process.cwd(), 'public/uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        // Get the userId from query parameter
        const userId = req.query.userId || '0';
        
        // Create unique filename with user id pattern matching your requirements
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
      }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    }
  }).single('avatar');

  // Process the upload
  adminUpload(req, res, (err) => {
    if (err) {
      console.error('Error in multer upload:', err);
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    console.log('Avatar uploaded successfully:', avatarUrl);
    
    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl
    });
  });
});

// User notification routes
app.get('/api/user/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;
    
    const options: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };
    
    const notifications = await NotificationService.getUserNotifications(userId, options);
    const unreadCount = await NotificationService.getUserNotificationCount(userId, false);
    const total = await NotificationService.getUserNotificationCount(userId); // All notifications (read and unread)
    
    res.json({
      notifications,
      unreadCount,
      total
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

app.put('/api/user/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);
    
    await NotificationService.markUserNotificationAsRead(userId, notificationId);
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

app.put('/api/user/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await NotificationService.markAllUserNotificationsAsRead(userId);
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// Admin user management endpoints
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.created_at,
        u.is_verified,
        u.is_active,
        u.avatar,
        COALESCE(SUM(c.points) FILTER (WHERE uc.completed = TRUE), 0) AS points,
        COUNT(DISTINCT uc.challenge_id) FILTER (WHERE uc.completed = TRUE) AS completed_challenges,
        COUNT(DISTINCT ub.badge_id) AS earned_badges
      FROM users u
      LEFT JOIN user_challenges uc ON u.id = uc.user_id
      LEFT JOIN challenges c ON uc.challenge_id = c.id
      LEFT JOIN user_badges ub ON u.id = ub.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

app.post('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const { username, email, password, status, role, avatar } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }
    
    // Check if email already exists
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck?.rowCount && emailCheck.rowCount > 0) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Set verified status based on provided status
    const is_verified = status !== 'pending';
    const is_active = status === 'active';
    const is_admin = role === 'admin';
    let userResult;
    if (avatar) {
    // Create user
    userResult = await pool.query(
      `INSERT INTO users 
       (username, email, password, is_verified, is_active, avatar, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING id, username, email, is_verified, is_active, created_at, avatar`,
      [username, email, hashedPassword, is_verified, is_active, avatar]
    );
  } else {
    // Original query without avatar
    userResult = await pool.query(
      `INSERT INTO users 
       (username, email, password, is_verified, is_active, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING id, username, email, is_verified, is_active, created_at, avatar`,
      [username, email, hashedPassword, is_verified, is_active]
    );
  }
    
 
    
    res.status(201).json({ 
      message: 'User created successfully',
      user: userResult.rows[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error creating user' });
  }
});

app.put('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, status, role,password } = req.body;

    
    
    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userCheck.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if the email is already used by another user
    if (email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      if (emailCheck?.rowCount && emailCheck.rowCount > 0) {
        return res.status(400).json({ message: 'Email already in use by another user' });
      }
    }
    
    // Build query parts
    let updates = [];
    let values = [];
    let paramCount = 1;
    
    if (username) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }
    
    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (password) {
      // Hash the password before storing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updates.push(`password = $${paramCount++}`);
      values.push(hashedPassword);
    }
    
    if (status) {
      updates.push(`is_verified = $${paramCount++}`);
      values.push(status !== 'pending');
      
      updates.push(`is_active = $${paramCount++}`);
      values.push(status === 'active');
    }
    if (req.body.avatar !== undefined) {
      updates.push(`avatar = $${paramCount++}`);
      values.push(req.body.avatar);
    }
    
    // Add user ID as the last parameter
    values.push(userId);
    
    // Update user
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING id, username, email, is_verified, is_active, created_at, avatar
    `;
    
    const result = await pool.query(updateQuery, values);
    
    // Handle admin status change if needed
    if (role !== undefined) {
      const isAdmin = role === 'admin';
      
      if (isAdmin) {
        // Check if user already exists in admin_users
        const adminCheck = await pool.query(
          'SELECT id FROM admin_users WHERE id = $1', // Change user_id to id
          [userId]
        );
        
        if (adminCheck.rowCount === 0) {
          // Add new admin user
          await pool.query(
            `INSERT INTO admin_users (id, username, email, admin_level, created_at)
             VALUES ($1, $2, $3, 'editor', NOW())`, // Change user_id to id
            [userId, username || result.rows[0].username, email || result.rows[0].email]
          );
        }
      } else {
        // Remove from admin_users if demoted
        await pool.query('DELETE FROM admin_users WHERE id = $1', [userId]); // Change user_id to id
      }
    }
    
    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const adminId = req.user.id;
    
    // Don't allow admin to delete themselves
    if (userId === adminId.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userCheck.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user - assumes cascading deletes in your database
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

app.put('/api/admin/users/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;
    
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // Update user status
    await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2',
      [status === 'active', userId]
    );
    
    res.json({ 
      message: `User status updated to ${status}`,
      status
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

app.post('/api/admin/users/bulk', authenticateAdmin, async (req, res) => {
  try {
    const { action, userIds } = req.body;
    
    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }
    
    // Don't allow bulk actions on the admin's own account
    const adminId = req.user.id.toString();
    if (userIds.includes(adminId)) {
      return res.status(400).json({ message: 'Cannot perform bulk actions on your own account' });
    }
    
    switch (action) {
      case 'activate':
        await pool.query(
          'UPDATE users SET is_active = TRUE WHERE id = ANY($1::int[])',
          [userIds]
        );
        break;
        
      case 'deactivate':
        await pool.query(
          'UPDATE users SET is_active = FALSE WHERE id = ANY($1::int[])',
          [userIds]
        );
        break;
        
      case 'delete':
        await pool.query(
          'DELETE FROM users WHERE id = ANY($1::int[])',
          [userIds]
        );
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
    
    res.json({ 
      message: 'Bulk action completed successfully',
      action,
      affectedUsers: userIds.length
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ message: 'Server error performing bulk action' });
  }
});

app.post('/api/admin/avatar-upload', authenticateAdmin, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const avatarUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Server error uploading avatar' });
  }
});

// Resend verification email endpoint
app.post('/api/resend-verification', async (req, res) => {
  try {
    const { email } = req.body
    
    // Find user by email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    
    if (userResult.rowCount === 0) {
      // Don't reveal that email doesn't exist for security
      return res.status(200).json({ 
        message: 'If your email exists in our system, a verification link will be sent'
      })
    }
    
    const user = userResult.rows[0]
    
    // Check if already verified
    if (user.is_verified) {
      return res.status(400).json({ message: 'Email is already verified' })
    }
    
    // Delete any existing verification tokens
    await pool.query(
      'DELETE FROM email_verification WHERE user_id = $1',
      [user.id]
    )
    
    // Create new verification token
    const verificationToken = generateToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Token valid for 24 hours
    
    // Store verification token
    await pool.query(
      'INSERT INTO email_verification (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, verificationToken, expiresAt]
    )
    
    // Send the verification email
    const verificationLink = `${env.APP_URL}/verify-email?token=${verificationToken}`
    await sendVerificationEmail(email, user.username, verificationToken);
    console.log(`New verification link: ${verificationLink}`)
    
    res.json({ 
      message: 'If your email exists in our system, a verification link will be sent',
      verificationLink: verificationLink // Only for testing - remove in production
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    res.status(500).json({ message: 'Server error while resending verification' })
  }
})

// Admin routes
app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
  try {
    // Get stats for admin dashboard
    const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users')
    const totalChallengesResult = await pool.query('SELECT COUNT(*) FROM challenges')
    const completedChallengesResult = await pool.query('SELECT COUNT(*) FROM user_challenges WHERE completed = TRUE')
    const usersThisMonthResult = await pool.query('SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL \'30 days\'')
    
    const stats = {
      totalUsers: parseInt(totalUsersResult.rows[0].count),
      totalChallenges: parseInt(totalChallengesResult.rows[0].count),
      completedChallenges: parseInt(completedChallengesResult.rows[0].count),
      newUsersThisMonth: parseInt(usersThisMonthResult.rows[0].count)
    }
    
    res.json(stats)
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error)
    res.status(500).json({ message: 'Server error fetching admin dashboard data' })
  }
})

app.post('/api/admin/user/:id/toggle-admin', authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id
    const adminId = req.user.id
    
    // Don't allow changing own admin status
    if (userId === adminId.toString()) {
      return res.status(400).json({ message: 'Cannot change your own admin status' })
    }
    
    // Get current admin status
    const userResult = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    )
    
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    // Toggle admin status
    const newStatus = !userResult.rows[0].is_admin
   
    
    res.json({ 
      message: `User admin status updated to ${newStatus}`,
      isAdmin: newStatus
    })
  } catch (error) {
    console.error('Error toggling admin status:', error);
    res.status(500).json({ message: 'Server error toggling admin status' });
  }
})

// Admin notification routes
app.get('/api/admin/notifications', authenticateAdmin, async (req, res) => {
  try {
    const { read, limit, offset, type } = req.query;
    
    const options: any = {};
    if (read !== undefined) {
      options.isRead = read === 'true';
    }
    if (limit) options.limit = parseInt(limit as string);
    if (offset) options.offset = parseInt(offset as string);
    if (type) options.type = type as string;
    
    const notifications = await NotificationService.getNotifications(options);
    const unreadCount = await NotificationService.getNotificationCount(false);
    
    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

app.put('/api/admin/notifications/:id/read', authenticateAdmin, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    await NotificationService.markAsRead(notificationId);
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification' });
  }
});

app.put('/api/admin/notifications/read-all', authenticateAdmin, async (req, res) => {
  try {
    await NotificationService.markAllAsRead();
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

// Add this endpoint after other admin notification routes
app.post('/api/admin/notifications/announcement', authenticateAdmin, async (req, res) => {
  try {
    const { title, message } = req.body;
    
    // Validate inputs
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    
    // Use the notification service to send announcement to all users
    const sentCount = await NotificationService.createSystemAnnouncementForAllUsers(title, message);
    
    // Also create an admin notification for record keeping
    await NotificationService.createNotification(
      'admin_announcement',
      'System Announcement Sent',
      `Admin ${req.user.email} sent announcement: "${title}"`,
      undefined,
      'system_announcement'
    );
    
    res.json({ 
      message: 'Announcement sent successfully to all users',
      sentCount 
    });
    
  } catch (error) {
    console.error('Error sending system announcement:', error);
    res.status(500).json({ message: 'Error sending announcement' });
  }
});

// Add this new endpoint to get user growth data for the admin dashboard chart
app.get('/api/admin/user-growth', authenticateAdmin, async (req, res) => {
  try {
    const range = req.query.range || 'month';
    let interval, timeFormat, timeLimit;
    
    // Configure the time intervals based on selected range
    switch(range) {
      case 'week':
        interval = 'day';
        timeFormat = 'YYYY-MM-DD';
        timeLimit = '7 days';
        break;
      case 'month':
        interval = 'day';
        timeFormat = 'YYYY-MM-DD';
        timeLimit = '30 days';
        break;
      case 'year':
        interval = 'month';
        timeFormat = 'YYYY-MM';
        timeLimit = '12 months';
        break;
      case 'all':
        interval = 'month';
        timeFormat = 'YYYY-MM';
        timeLimit = '100 years'; // Essentially all data
        break;
      default:
        interval = 'day';
        timeFormat = 'YYYY-MM-DD';
        timeLimit = '30 days';
    }
    
    // This query gives us cumulative user count over time periods
    const userGrowthQuery = `
      WITH time_series AS (
        SELECT 
          date_trunc('${interval}', d) AS period_date
        FROM 
          generate_series(
            date_trunc('${interval}', NOW() - INTERVAL '${timeLimit}'),
            date_trunc('${interval}', NOW()),
            '1 ${interval}'::interval
          ) AS d
      ),
      user_counts AS (
        SELECT 
          date_trunc('${interval}', created_at) AS period_date,
          COUNT(*) AS new_user_count
        FROM 
          users
        WHERE 
          created_at >= NOW() - INTERVAL '${timeLimit}'
        GROUP BY 
          period_date
      ),
      cumulative_counts AS (
        SELECT
          ts.period_date,
          COALESCE(uc.new_user_count, 0) AS new_users,
          (
            SELECT COUNT(*) 
            FROM users 
            WHERE created_at <= ts.period_date
          ) AS total_users
        FROM 
          time_series ts
        LEFT JOIN 
          user_counts uc ON ts.period_date = uc.period_date
        ORDER BY 
          ts.period_date
      )
      SELECT
        to_char(period_date, '${timeFormat}') AS date,
        new_users,
        total_users
      FROM
        cumulative_counts
      ORDER BY
        period_date
    `;
    
    const result = await pool.query(userGrowthQuery);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user growth data:', error);
    res.status(500).json({ message: 'Error fetching user growth data' });
  }
});

// Protected route - requires authentication
app.get('/api/eco-data', authenticateToken, async (req, res) => {
  // Mock eco data
  const ecoData = [
    { id: 1, date: '2023-08-01', activity: 'Recycling', carbonSaved: 2.5 },
    { id: 2, date: '2023-08-02', activity: 'Public Transport', carbonSaved: 5.2 }
  ]
  res.json(ecoData)
})

// User settings routes - KEEP ONLY THIS VERSION
app.get('/api/user/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch user profile data
    const userResult = await pool.query(
      'SELECT id, username, email, location, bio, avatar, created_at, show_on_leaderboard FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    res.json({
      profile: {
        username: user.username,
        email: user.email,
        location: user.location || '',
        bio: user.bio || '',
        avatar: user.avatar || null, // Ensure null is returned when no avatar
        created_at: user.created_at,
        showOnLeaderboard: user.show_on_leaderboard // Include the show_on_leaderboard setting
      },
      account: {}
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ message: 'Server error while fetching settings' });
  }
});

// KEEP ONLY THIS VERSION of the profile settings update endpoint
app.put('/api/user/settings/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, location, bio } = req.body;
    
    // Update user profile
    await pool.query(
      'UPDATE users SET username = $1, email = $2, location = $3, bio = $4 WHERE id = $5',
      [username, email, location, bio, userId]
    );
    
    res.json({ message: 'Profile settings updated successfully' });
  } catch (error) {
    console.error('Error updating profile settings:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

app.put('/api/user/change-password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Get current password from database
    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );
    
    const user = result.rows[0];
    
    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error while changing password' });
  }
});

app.post('/api/user/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user.id;
    const avatarUrl = `/uploads/${req.file.filename}`;

    // Store avatar URL in the database
    await pool.query(
      'UPDATE users SET avatar = $1 WHERE id = $2',
      [avatarUrl, userId]
    );

    res.json({ 
      message: 'Avatar uploaded successfully',
      avatarUrl 
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Server error while uploading avatar' });
  }
});

// Donation routes
app.post('/api/donations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      amount,
      project,
      paymentMethod,
      paymentDetails,
      isRecurring,
      donor
    } = req.body;
    
    // Validate required fields
    if (!amount || !project || !paymentMethod || !donor.firstName || !donor.lastName || !donor.email) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Create donation record
    const result = await pool.query(
      `INSERT INTO donations 
        (user_id, amount, project_id, payment_method, payment_details, is_recurring, 
         donor_first_name, donor_last_name, donor_email, donor_phone, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed')
       RETURNING *`,
      [userId, amount, project, paymentMethod, JSON.stringify(paymentDetails), 
       isRecurring, donor.firstName, donor.lastName, donor.email, donor.phone]
    );
    
    // Create notification for the donation (if you have a notification system)
    try {
      await NotificationService.createUserNotification(
        userId,
        'donation_success',
        'Thank You for Your Donation!',
        `Your donation of ₱${amount} to our ${project} project has been received.`
      );
    } catch (notificationError) {
      console.error('Error creating donation notification:', notificationError);
    }
    
    res.status(201).json({ 
      message: 'Donation processed successfully',
      donation: result.rows[0]
    });
  } catch (error) {
    console.error('Error processing donation:', error);
    res.status(500).json({ message: 'Error processing donation' });
  }
});

// Get user's donation history
app.get('/api/donations/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT id, amount, project_id, is_recurring, donation_date, status
       FROM donations
       WHERE user_id = $1
       ORDER BY donation_date DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching donation history:', error);
    res.status(500).json({ message: 'Error fetching donation history' });
  }
});

// Add a new route to handle avatar deletion
app.delete('/api/user/avatar', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // First, get the current avatar to delete the file
    const result = await pool.query(
      'SELECT avatar FROM users WHERE id = $1',
      [userId]
    );
    
    // Update the avatar to null in the database
    await pool.query(
      'UPDATE users SET avatar = NULL WHERE id = $1',
      [userId]
    );
    
    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({ message: 'Server error while deleting avatar' });
  }
});

// Challenge-related routes
app.get('/api/challenges', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all challenges with user progress
    const result = await pool.query(`
      SELECT c.*, 
        CASE WHEN uc.completed = true THEN true ELSE false END as completed,
        COALESCE(uc.progress, 0) as progress
      FROM challenges c
      LEFT JOIN user_challenges uc ON c.id = uc.challenge_id AND uc.user_id = $1
      ORDER BY c.id
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({ message: 'Error fetching challenges' });
  }
});

// Update the complete a challenge endpoint to handle missing points column
app.post('/api/challenges/:id/complete', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const challengeId = req.params.id;
    
    await client.query('BEGIN');
    
    // Check if the challenge exists
    const challengeResult = await client.query(
      'SELECT * FROM challenges WHERE id = $1',
      [challengeId]
    );
    
    if (challengeResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    const challenge = challengeResult.rows[0];
    
    // Check if the user already completed this challenge
    const userChallengeResult = await client.query(
      'SELECT * FROM user_challenges WHERE user_id = $1 AND challenge_id = $2',
      [userId, challengeId]
    );
    
    if (userChallengeResult?.rowCount && userChallengeResult.rowCount > 0) {
      // Update existing record
      await client.query(
        'UPDATE user_challenges SET completed = true, progress = 100, completed_at = NOW() WHERE user_id = $1 AND challenge_id = $2',
        [userId, challengeId]
      );
    } else {
      // Create new record
      await client.query(
        'INSERT INTO user_challenges (user_id, challenge_id, completed, progress, completed_at) VALUES ($1, $2, true, 100, NOW())',
        [userId, challengeId]
      );
      try {
        await NotificationService.createChallengeCompletedNotification(
          userId, 
          +challengeId, 
          challenge.title, 
          challenge.points
        );
      } catch (notificationError) {
        console.error('Error creating challenge completion notification:', notificationError);
        // Continue without failing the entire transaction
      }
      
      
    }
    
    
    
    try {
      // Try to update points - this might fail if the column doesn't exist
      await client.query(
        'UPDATE users SET points = COALESCE(points, 0) + $1 WHERE id = $2',
        [challenge.points, userId]
      );
    } catch (pointsError) {
      console.warn('Could not update user points. The points column might be missing:', pointsError);
      // Continue execution without updating points
    }
    
    // Check if user has reached a top leaderboard position
try {
  // First, get the user's UPDATED points total after completing this challenge
  const userPointsResult = await client.query(`
    SELECT COALESCE(SUM(c.points) FILTER (WHERE uc.completed = TRUE), 0) AS total_points
    FROM users u
    LEFT JOIN user_challenges uc ON u.id = uc.user_id
    LEFT JOIN challenges c ON uc.challenge_id = c.id
    WHERE u.id = $1
    GROUP BY u.id
  `, [userId]);
  
  const userPoints = parseInt(userPointsResult.rows[0]?.total_points || '0');
  
  // Then get ALL users sorted by their points to determine accurate rank
  const leaderboardResult = await client.query(`
    SELECT 
      u.id,
      COALESCE(SUM(c.points) FILTER (WHERE uc.completed = TRUE), 0) AS points
    FROM users u
    LEFT JOIN user_challenges uc ON u.id = uc.user_id
    LEFT JOIN challenges c ON uc.challenge_id = c.id
    WHERE u.show_on_leaderboard = TRUE
    GROUP BY u.id
    ORDER BY points DESC
  `);
  
  // Find the user's position in the sorted list (this is more accurate)
  let rank = -1;
  for (let i = 0; i < leaderboardResult.rows.length; i++) {
    if (leaderboardResult.rows[i].id === userId) {
      rank = i + 1; // +1 because array is 0-indexed
      break;
    }
  }
  
  console.log(`User ${userId} is at rank ${rank} with ${userPoints} points`);
  
  // If user is in top 3, check if they've already been notified about this rank
  if (rank > 0 && rank <= 3) {
    // Check if they've received this specific rank notification before
    const existingNotification = await client.query(
      `SELECT id FROM user_notifications 
       WHERE user_id = $1 
       AND type = 'leaderboard_position' 
       AND reference_id = $2`,
      [userId, rank]
    );
    
    // If no notification exists for this rank, create one
    if (existingNotification.rowCount === 0) {
      await NotificationService.createLeaderboardTopPositionNotification(userId, rank);
      console.log(`Created top ${rank} leaderboard position notification for user ${userId}`);
    }
  }
} catch (rankError) {
  console.error('Error checking leaderboard position:', rankError);
  // Continue without failing the challenge completion
}

    
// After completing the challenge, check if any badges should be awarded based on challenge count
try {
  // Get the user's completed challenge count
  const challengeCountResult = await client.query(
    'SELECT COUNT(*) FROM user_challenges WHERE user_id = $1 AND completed = TRUE',
    [userId]
  );
  const completedChallengesCount = parseInt(challengeCountResult.rows[0].count);
  console.log(`User ${userId} has completed ${completedChallengesCount} challenges`);
  
  // Define badges that should be awarded based on completed challenges
  const badgesToCheck = [];
  
  // Logic for awarding milestone badges
  if (completedChallengesCount === 1) {
    badgesToCheck.push({ id: 1, name: "First Challenge" }); // First challenge badge
  } else if (completedChallengesCount === 5) {
    badgesToCheck.push({ id: 2, name: "Challenge Enthusiast" }); // 5 challenges badge
  } else if (completedChallengesCount === 10) {
    badgesToCheck.push({ id: 3, name: "Challenge Master" }); // 10 challenges badge
  }
  
  // Award badges that aren't already owned
  for (const badge of badgesToCheck) {
    // Check if user already has this badge
    const existingBadge = await client.query(
      'SELECT 1 FROM user_badges WHERE user_id = $1 AND badge_id = $2',
      [userId, badge.id]
    );
    
    // If user doesn't have the badge yet, award it and create notification
    if (existingBadge.rowCount === 0) {
      // Get the actual badge name from database to ensure accuracy
      const badgeData = await client.query(
        'SELECT name FROM badges WHERE id = $1',
        [badge.id]
      );
      
      if (badgeData?.rowCount && badgeData.rowCount > 0) {
        const badgeName = badgeData.rows[0].name;
        
        // Add badge to user's badges
        await client.query(
          'INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES ($1, $2, NOW())',
          [userId, badge.id]
        );
        
        // Create notification for the new badge
        await NotificationService.createBadgeEarnedNotification(
          userId,
          badge.id,
          badgeName
        );
        
        console.log(`User ${userId} earned badge: ${badgeName}`);
      }
    }
  }
} catch (badgeError) {
  console.error('Error handling badges:', badgeError);
  // Continue without failing the entire transaction
}
    
    await client.query('COMMIT');


    
    res.json({ 
      message: 'Challenge completed!',
      points: challenge.points
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error completing challenge:', error);
    res.status(500).json({ message: 'Error completing challenge' });
  } finally {
    client.release();
  }
});

// Get user badges
app.get('/api/badges', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all badges with earned status
    const result = await pool.query(`
      SELECT b.*, 
        CASE WHEN ub.id IS NOT NULL THEN true ELSE false END as earned,
        ub.earned_at
      FROM badges b
      LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
      ORDER BY b.id
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ message: 'Error fetching badges' });
  }
});

// Get user earned badges only
app.get('/api/badges/earned', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get only earned badges
    const result = await pool.query(`
      SELECT b.*, ub.earned_at
      FROM badges b
      JOIN user_badges ub ON b.id = ub.badge_id
      WHERE ub.user_id = $1
      ORDER BY ub.earned_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching earned badges:', error);
    res.status(500).json({ message: 'Error fetching earned badges' });
  }
});

// Add this new endpoint for getting all badges without user-specific info
app.get('/api/badges/all-badges', authenticateToken, async (req, res) => {
  try {
    // Get all badges without user-specific data
    const result = await pool.query(`
      SELECT id, name, icon, category, rarity
      FROM badges
      ORDER BY id
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all badges:', error);
    res.status(500).json({ message: 'Error fetching badges information' });
  }
});



// Add this leaderboard endpoint after the badges endpoints
app.get('/api/leaderboard', authenticateToken, async (req, res) => {
  try {
    const timeFilter = req.query.timeFilter || 'monthly';
    const activityFilter = req.query.activityFilter || 'all';
    
    // Time condition should be consistent with user rank query
    let timeCondition = '';
    if (timeFilter === 'weekly') {
      timeCondition = 'AND uc.completed_at > NOW() - INTERVAL \'7 days\'';
    } else if (timeFilter === 'monthly') {
      timeCondition = 'AND uc.completed_at > NOW() - INTERVAL \'30 days\'';
    }
    
    let activityCondition = '';
    if (activityFilter !== 'all') {
      activityCondition = 'AND c.category = $1';
    }

    console.log('Executing leaderboard query with filters:', { timeFilter, activityFilter });
    
    // Simplified query to focus on getting accurate point and carbon values
    let leaderboardQuery = `
      WITH user_stats AS (
        SELECT 
          u.id,
          u.username,
          u.avatar,
          COALESCE(SUM(c.points) FILTER (WHERE uc.completed = TRUE), 0) AS points,
          COALESCE(SUM(c.carbon_reduction) FILTER (WHERE uc.completed = TRUE), 0) AS carbon_saved
        FROM users u
        LEFT JOIN user_challenges uc ON u.id = uc.user_id ${timeCondition}
        LEFT JOIN challenges c ON uc.challenge_id = c.id ${activityCondition}
        WHERE u.show_on_leaderboard = TRUE
        GROUP BY u.id, u.username, u.avatar
      ),
      user_badges AS (
        SELECT 
          u.id,
          ARRAY_AGG(DISTINCT b.icon) FILTER (WHERE b.icon IS NOT NULL) AS badge_icons,
          ARRAY_AGG(DISTINCT b.name) FILTER (WHERE b.name IS NOT NULL) AS badge_names
        FROM users u
        LEFT JOIN user_badges ub ON u.id = ub.user_id
        LEFT JOIN badges b ON ub.badge_id = b.id
        GROUP BY u.id
      )
      SELECT 
        us.id,
        us.username,
        us.avatar,
        us.points,
        us.carbon_saved,
        ub.badge_icons,
        ub.badge_names
      FROM user_stats us
      LEFT JOIN user_badges ub ON us.id = ub.id
      ORDER BY us.points DESC NULLS LAST
      LIMIT 100
    `;
    
    let result;
    if (activityFilter !== 'all') {
      result = await pool.query(leaderboardQuery, [activityFilter]);
    } else {
      result = await pool.query(leaderboardQuery);
    }
    
    console.log(`Leaderboard query returned ${result.rows.length} rows`);
    // Log the raw data for the first few users for debugging
    result.rows.slice(0, 3).forEach((user: {
      id: number;
      username: string;
      avatar: string | null;
      points: string | number;
      carbon_saved: string | number;
      badge_icons?: string[];
      badge_names?: string[];
    }, i: number) => {
      console.log(`Raw user ${i} data:`, {
        username: user.username,
        points: user.points,
        carbon_saved: user.carbon_saved
      });
    });
    
    // Process the results with detailed logging
    const leaderboard = result.rows.map((user: {
      id: number;
      username: string;
      avatar: string | null;
      points: string | number;
      carbon_saved: string | number;
      badge_icons?: string[];
      badge_names?: string[];
    }, index: number) => {
      // Create an array of badge objects with both icon and name
      const badgeDetails = [];
      if (user.badge_icons && user.badge_names) {
        // Both arrays should be the same length
        for (let i = 0; i < user.badge_icons.length; i++) {
          if (user.badge_icons[i] && user.badge_names[i]) {
            badgeDetails.push({
              icon: user.badge_icons[i],
              name: user.badge_names[i]
            });
          }
        }
      }
      
      // Ensure points and carbon are numbers
      // Explicitly use Number() to ensure proper conversion
      const points = Number(user.points || 0);
      const carbonSaved = Number(user.carbon_saved || 0);
      
      // Log each user's processed data
      console.log(`Processed ${user.username}: points=${points}, carbon=${carbonSaved.toFixed(1)}`);
      
      return {
        id: user.id,
        username: user.username,
        avatar: user.avatar || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png',
        rank: index + 1,
        points: points,
        carbonSaved: carbonSaved.toFixed(1),
        badges: user.badge_icons || [], 
        badgeDetails: badgeDetails
      };
    });
    
    console.log("First few leaderboard entries:", leaderboard.slice(0, 3));
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard data' });
  }
});

app.put('/api/user/settings/leaderboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { showOnLeaderboard } = req.body;
    
    // Update user's leaderboard visibility setting
    await pool.query(
      'UPDATE users SET show_on_leaderboard = $1 WHERE id = $2',
      [showOnLeaderboard, userId]
    );
    
    res.json({ message: 'Leaderboard visibility updated successfully' });
  } catch (error) {
    console.error('Error updating leaderboard visibility:', error);
    res.status(500).json({ message: 'Server error while updating leaderboard visibility' });
  }
});


// Update the user rank endpoint to include the show_on_leaderboard setting
app.get('/api/leaderboard/user-rank', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching rank data for user ID: ${userId}`);
    
    // Get user settings including leaderboard visibility
    const userSettingsQuery = `
      SELECT show_on_leaderboard
      FROM users
      WHERE id = $1
    `;
    
    const settingsResult = await pool.query(userSettingsQuery, [userId]);
    const showOnLeaderboard = settingsResult.rows[0]?.show_on_leaderboard !== false;
    
    // More direct query for user stats
    const userStatsQuery = `
      SELECT 
        COALESCE(SUM(c.points) FILTER (WHERE uc.completed = TRUE), 0) AS points,
        COALESCE(SUM(c.carbon_reduction) FILTER (WHERE uc.completed = TRUE), 0) AS carbon_saved
      FROM users u
      LEFT JOIN user_challenges uc ON u.id = uc.user_id 
      LEFT JOIN challenges c ON uc.challenge_id = c.id
      WHERE u.id = $1
      GROUP BY u.id
    `;
    
    const userResult = await pool.query(userStatsQuery, [userId]);
    
    // Log the raw user data
    console.log("Raw user stats query result:", userResult.rows[0]);
    
    // Default to 0 if no results
    const userPoints = Number(userResult.rows[0]?.points || 0);
    const userCarbonSaved = Number(userResult.rows[0]?.carbon_saved || 0);
    
    console.log(`User points: ${userPoints}, Carbon saved: ${userCarbonSaved}`);
    
    // Find how many users have more points
    const rankResult = await pool.query(`
      SELECT COUNT(*) AS rank
      FROM (
        SELECT u.id, COALESCE(SUM(c.points) FILTER (WHERE uc.completed = TRUE), 0) AS points
        FROM users u
        LEFT JOIN user_challenges uc ON u.id = uc.user_id
        LEFT JOIN challenges c ON uc.challenge_id = c.id
        WHERE u.show_on_leaderboard = TRUE
        GROUP BY u.id
        HAVING COALESCE(SUM(c.points) FILTER (WHERE uc.completed = TRUE), 0) > $1
      ) AS higher_ranked
    `, [userPoints]);
    
    // User's rank is the number of users with more points + 1
    const rank = parseInt(rankResult.rows[0].rank) + 1;
    console.log(`User rank: ${rank}`);
    
    const responseData = {
      rank,
      points: userPoints,
      carbonSaved: userCarbonSaved.toFixed(1),
      pointsToNextRank: 0, // We'll calculate this below
      hideFromLeaderboard: !showOnLeaderboard // Add this property to the response
    };
    
    // Find points needed for next rank
    const nextRankResult = await pool.query(`
      SELECT MIN(points) AS next_rank_points
      FROM (
        SELECT u.id, COALESCE(SUM(c.points) FILTER (WHERE uc.completed = TRUE), 0) AS points
        FROM users u
        LEFT JOIN user_challenges uc ON u.id = uc.user_id
        LEFT JOIN challenges c ON uc.challenge_id = c.id
        WHERE u.show_on_leaderboard = TRUE
        GROUP BY u.id
        HAVING COALESCE(SUM(c.points) FILTER (WHERE uc.completed = TRUE), 0) > $1
      ) AS higher_ranked
    `, [userPoints]);
    
    // Log next rank info
    console.log("Next rank query result:", nextRankResult.rows[0]);
    
    if (nextRankResult.rows[0]?.next_rank_points) {
      responseData.pointsToNextRank = Math.max(0, 
        Number(nextRankResult.rows[0].next_rank_points) - userPoints);
    }
    
    console.log('Final user rank data:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({ 
      message: 'Error fetching user rank data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get recent completed challenges
app.get('/api/user/activity/challenges', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const result = await pool.query(`
      SELECT uc.id, c.id as challenge_id, c.title, c.points, uc.completed_at
      FROM user_challenges uc
      JOIN challenges c ON uc.challenge_id = c.id
      WHERE uc.user_id = $1 AND uc.completed = TRUE
      ORDER BY uc.completed_at DESC
      LIMIT $2
    `, [userId, limit]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching completed challenges:', error);
    res.status(500).json({ message: 'Error fetching activity data' });
  }
});

// Get recently earned badges
app.get('/api/user/activity/badges', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const result = await pool.query(`
      SELECT ub.id, b.id as badge_id, b.name, b.icon, b.points, ub.earned_at
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = $1
      ORDER BY ub.earned_at DESC
      LIMIT $2
    `, [userId, limit]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching earned badges:', error);
    res.status(500).json({ message: 'Error fetching badge activity' });
  }
});

// Get recent goal activities
app.get('/api/user/activity/goals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // First check if the goal_activities table exists
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'goal_activities'
      )
    `);
    
    if (!tableCheckResult.rows[0].exists) {
      // Table doesn't exist, return empty array
      return res.json([]);
    }
    
    // Table exists, query it
    const result = await pool.query(`
      SELECT ga.id, ga.goal_id, ug.title, ga.activity_type, ga.progress, ga.activity_date
      FROM goal_activities ga
      JOIN user_goals ug ON ga.goal_id = ug.id
      WHERE ga.user_id = $1
      ORDER BY ga.activity_date DESC
      LIMIT $2
    `, [userId, limit]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching goal activities:', error);
    res.status(500).json({ message: 'Error fetching goal activity' });
  }
});

// Archive account endpoint
app.put('/api/user/archive', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Update user to set is_active to false (archive the account)
    await pool.query(
      'UPDATE users SET is_active = FALSE WHERE id = $1',
      [userId]
    );
    
    // Create a notification for admin
    try {
      await NotificationService.createNotification(
        'user_account_archived',
        'User Account Archived',
        `User ID: ${userId} has archived their account`,
        userId
      );
    } catch (notificationError) {
      // Log but don't fail if notification creation fails
      console.error('Failed to create notification for account archiving:', notificationError);
    }
    
    res.json({ message: 'Your account has been archived successfully' });
  } catch (error) {
    console.error('Error archiving account:', error);
    res.status(500).json({ message: 'Server error while archiving your account' });
  }
});

// Add this route for quote fetching
app.get('/api/quotes/random', (req, res) => {
  // Array of sustainability quotes
  const quotes = [
    {
      text: "We don't have to sacrifice a strong economy for a healthy environment.",
      author: "Dennis Weaver"
    },
    {
      text: "The Earth is what we all have in common.",
      author: "Wendell Berry"
    },
    {
      text: "We are the first generation to feel the effect of climate change and the last generation who can do something about it.",
      author: "Barack Obama"
    },
    {
      text: "The greatest threat to our planet is the belief that someone else will save it.",
      author: "Robert Swan"
    },
    {
      text: "There is no such thing as 'away'. When we throw anything away it must go somewhere.",
       author: "Robert Swan"
    },
      {
        text: "There is no such thing as 'away'. When we throw anything away it must go somewhere.",
        author: "Annie Leonard"
      },
      {
        text: "The environment is where we all meet; where we all have a mutual interest; it is the one thing all of us share.",
        author: "Lady Bird Johnson"
      },
      {
        text: "Sustainability is no longer about doing less harm. It's about doing more good.",
        author: "Jochen Zeitz"
      },
      {
        text: "What we are doing to the forests of the world is but a mirror reflection of what we are doing to ourselves and to one another.",
        author: "Mahatma Gandhi"
      },
      {
        text: "The more clearly we can focus our attention on the wonders and realities of the universe around us, the less taste we shall have for destruction.",
        author: "Rachel Carson"
      }
    ];
    
    // Select a random quote
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    res.json(randomQuote);

    
  });

// Admin donations management
app.get('/api/admin/donations', authenticateAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = 'donation_date', 
      direction = 'desc',
      status,
      project,
      search,
      startDate,
      endDate
    } = req.query;
    
    // Build query conditions
    let conditions = [];
    let params = [];
    let paramIndex = 1;

    // Apply filters if provided
    if (status && status !== 'all') {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    
    if (project && project !== 'all') {
      conditions.push(`project_id = $${paramIndex++}`);
      params.push(project);
    }
    
    if (search) {
      conditions.push(`(
        donor_first_name ILIKE $${paramIndex} OR 
        donor_last_name ILIKE $${paramIndex} OR 
        donor_email ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (startDate) {
      conditions.push(`donation_date >= $${paramIndex++}`);
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push(`donation_date <= $${paramIndex++}`);
      params.push(endDate);
    }
    
    // Assemble where clause
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    
    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM donations ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Validate sort field to prevent SQL injection
    const validSortFields = ['id', 'amount', 'project_id', 'payment_method', 
                            'donation_date', 'status', 'donor_first_name', 'donor_last_name'];
    const sortField = validSortFields.includes(String(sort)) ? String(sort) : 'donation_date';
    
    // Validate sort direction
    const sortDirection = direction === 'asc' ? 'ASC' : 'DESC';
    
    // Add pagination and order parameters
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    params.push(parseInt(limit as string), offset);
    
    // Query for donations with pagination and sorting
    const donationsQuery = `
      SELECT * FROM donations
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    const donationsResult = await pool.query(donationsQuery, params);
    
    // Send paginated response
    res.json({
      donations: donationsResult.rows,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching admin donations:', error);
    res.status(500).json({ message: 'Error fetching donations' });
  }
});

// Verify donation
app.put('/api/admin/donations/:id/verify', authenticateAdmin, async (req, res) => {
  try {
    const donationId = req.params.id;
    const adminId = req.user.id;
    
    // Update donation status to verified
    const result = await pool.query(
      `UPDATE donations 
       SET status = 'verified', verified_by = $1, verified_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [adminId, donationId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    // Create notification for the donor
    try {
      const donation = result.rows[0];
      
      if (donation.user_id) {
        await NotificationService.createUserNotification(
          donation.user_id,
          'donation_verified',
          'Donation Verified',
          `Your donation of ₱${donation.amount} has been verified. Thank you for your contribution!`
        );
      }
    } catch (notificationError) {
      console.error('Error creating donation verification notification:', notificationError);
    }
    
    res.json({ 
      message: 'Donation verified successfully',
      donation: result.rows[0]
    });
  } catch (error) {
    console.error('Error verifying donation:', error);
    res.status(500).json({ message: 'Error verifying donation' });
  }
});

// Reject donation
app.put('/api/admin/donations/:id/reject', authenticateAdmin, async (req, res) => {
  try {
    const donationId = req.params.id;
    const adminId = req.user.id;
    const { reason } = req.body;
    
    // Update donation status to rejected
    const result = await pool.query(
      `UPDATE donations 
       SET status = 'rejected', rejected_by = $1, rejected_at = NOW(), rejected_reason = $2
       WHERE id = $3
       RETURNING *`,
      [adminId, reason || null, donationId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    // Create notification for the donor
    try {
      const donation = result.rows[0];
      
      if (donation.user_id) {
        await NotificationService.createUserNotification(
          donation.user_id,
          'donation_rejected',
          'Donation Rejected',
          `There was an issue with your ₱${donation.amount} donation. Please contact support for more information.`
        );
      }
    } catch (notificationError) {
      console.error('Error creating donation rejection notification:', notificationError);
    }
    
    res.json({ 
      message: 'Donation marked as rejected',
      donation: result.rows[0]
    });
  } catch (error) {
    console.error('Error rejecting donation:', error);
    res.status(500).json({ message: 'Error rejecting donation' });
  }
});

// Update donation
app.put('/api/admin/donations/:id', authenticateAdmin, async (req, res) => {
  try {
    const donationId = req.params.id;
    const {
      amount,
      project_id,
      payment_method,
      payment_details,
      is_recurring,
      donor_first_name,
      donor_last_name,
      donor_email,
      donor_phone,
      status
    } = req.body;
    
    // Validate required fields
    if (!amount || !project_id || !payment_method || !donor_first_name || !donor_last_name || !donor_email || !status) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }
    
    // Update donation
    const result = await pool.query(
      `UPDATE donations
       SET 
        amount = $1,
        project_id = $2,
        payment_method = $3,
        payment_details = $4,
        is_recurring = $5,
        donor_first_name = $6,
        donor_last_name = $7,
        donor_email = $8,
        donor_phone = $9,
        status = $10,
        updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        amount, project_id, payment_method, JSON.stringify(payment_details), is_recurring,
        donor_first_name, donor_last_name, donor_email, donor_phone, status, donationId
      ]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    res.json({
      message: 'Donation updated successfully',
      donation: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating donation:', error);
    res.status(500).json({ message: 'Error updating donation' });
  }
});

// Create new donation (admin)
app.post('/api/admin/donations', authenticateAdmin, async (req, res) => {
  try {
    const {
      amount,
      project_id,
      payment_method,
      payment_details,
      is_recurring,
      donor_first_name,
      donor_last_name,
      donor_email,
      donor_phone,
      status,
      user_id
    } = req.body;
    
    // Validate required fields
    if (!amount || !project_id || !payment_method || !donor_first_name || !donor_last_name || !donor_email) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }
    
    // Insert new donation
    const result = await pool.query(
      `INSERT INTO donations
        (user_id, amount, project_id, payment_method, payment_details, is_recurring,
         donor_first_name, donor_last_name, donor_email, donor_phone, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        user_id || null, amount, project_id, payment_method, JSON.stringify(payment_details), is_recurring,
        donor_first_name, donor_last_name, donor_email, donor_phone, status || 'completed', req.user.id
      ]
    );
    
    res.status(201).json({
      message: 'Donation created successfully',
      donation: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({ message: 'Error creating donation' });
  }
});

// Delete donation
app.delete('/api/admin/donations/:id', authenticateAdmin, async (req, res) => {
  try {
    const donationId = req.params.id;
    
    // Check if donation exists
    const checkResult = await pool.query('SELECT id FROM donations WHERE id = $1', [donationId]);
    
    if (checkResult.rowCount === 0) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    // Delete donation
    await pool.query('DELETE FROM donations WHERE id = $1', [donationId]);
    
    res.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    console.error('Error deleting donation:', error);
    res.status(500).json({ message: 'Error deleting donation' });
  }
});

// Donation statistics for admin dashboard
app.get('/api/admin/donations/stats', authenticateAdmin, async (req, res) => {
  try {
    // Get total donations
    const totalQuery = await pool.query('SELECT COUNT(*) FROM donations');
    const total = parseInt(totalQuery.rows[0].count);
    
    // Get total verified donations
    const verifiedQuery = await pool.query("SELECT COUNT(*) FROM donations WHERE status = 'verified'");
    const verified = parseInt(verifiedQuery.rows[0].count);
    
    // Get total amount
    const amountQuery = await pool.query("SELECT SUM(amount) FROM donations WHERE status != 'rejected'");
    const totalAmount = amountQuery.rows[0].sum ? parseFloat(amountQuery.rows[0].sum) : 0;
    
    // Get donations by project
    const projectsQuery = await pool.query(`
      SELECT project_id, COUNT(*), SUM(amount)
      FROM donations
      WHERE status != 'rejected'
      GROUP BY project_id
      ORDER BY SUM(amount) DESC
    `);
    
    // Get recent donations
    const recentQuery = await pool.query(`
      SELECT * FROM donations
      ORDER BY donation_date DESC
      LIMIT 5
    `);
    
    res.json({
      totalDonations: total,
      verifiedDonations: verified,
      totalAmount,
      byProject: projectsQuery.rows,
      recent: recentQuery.rows
    });
  } catch (error) {
    console.error('Error fetching donation statistics:', error);
    res.status(500).json({ message: 'Error fetching donation statistics' });
  }
});

  app.use(express.static(path.resolve(__dirname, '../../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../dist/index.html'));
  });
  
  // Make sure there's only ONE app.listen call at the END of the file
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 10000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
  
  export const handler: Handler = app