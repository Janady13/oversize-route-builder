const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const db = require('../config/database');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

// Register new user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('usdotNumber').optional(),
  body('phone').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, companyName, usdotNumber, phone } = req.body;

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: { message: 'Email already registered' } });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insert user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, company_name, usdot_number, phone, verification_token)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, company_name, created_at`,
      [email, passwordHash, companyName, usdotNumber, phone, verificationToken]
    );

    const user = result.rows[0];

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    // Log activity
    await db.query(
      'INSERT INTO activity_log (user_id, action) VALUES ($1, $2)',
      [user.id, 'USER_REGISTERED']
    );

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        companyName: user.company_name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: { message: 'Server error during registration' } });
  }
});

// Verify email
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await db.query(
      `UPDATE users SET email_verified = TRUE, verification_token = NULL
       WHERE verification_token = $1
       RETURNING id, email`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: { message: 'Invalid or expired verification token' } });
    }

    const user = result.rows[0];

    // Log activity
    await db.query(
      'INSERT INTO activity_log (user_id, action) VALUES ($1, $2)',
      [user.id, 'EMAIL_VERIFIED']
    );

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: { message: 'Server error during verification' } });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Get user
    const result = await db.query(
      `SELECT u.id, u.email, u.password_hash, u.company_name, u.email_verified,
              s.status as subscription_status, s.plan_type
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({ 
        error: { 
          message: 'Please verify your email before logging in',
          code: 'EMAIL_NOT_VERIFIED'
        } 
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Log activity
    await db.query(
      'INSERT INTO activity_log (user_id, action, ip_address) VALUES ($1, $2, $3)',
      [user.id, 'USER_LOGIN', req.ip]
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        companyName: user.company_name,
        subscription: {
          status: user.subscription_status,
          plan: user.plan_type
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: { message: 'Server error during login' } });
  }
});

// Request password reset
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const user = await db.query('SELECT id FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      // Don't reveal if email exists
      return res.json({ message: 'If that email exists, a password reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await db.query(
      `UPDATE users SET verification_token = $1, updated_at = $2
       WHERE email = $3`,
      [resetToken, resetExpires, email]
    );

    await sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'If that email exists, a password reset link has been sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: { message: 'Server error' } });
  }
});

// Reset password
router.post('/reset-password/:token', [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { password } = req.body;

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `UPDATE users SET password_hash = $1, verification_token = NULL
       WHERE verification_token = $2
       RETURNING id`,
      [passwordHash, token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: { message: 'Invalid or expired reset token' } });
    }

    const userId = result.rows[0].id;

    // Log activity
    await db.query(
      'INSERT INTO activity_log (user_id, action) VALUES ($1, $2)',
      [userId, 'PASSWORD_RESET']
    );

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: { message: 'Server error' } });
  }
});

module.exports = router;
