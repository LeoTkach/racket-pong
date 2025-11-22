const express = require('express');
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const router = express.Router();

console.log('[Auth Router] Loading auth routes...');

// Helper function to hash password
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Helper function to compare password
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Firebase Google login endpoint
router.post('/firebase-google', async (req, res) => {
  try {
    const { firebase_uid, email, full_name, avatar_url } = req.body;

    if (!firebase_uid || !email) {
      return res.status(400).json({ error: 'Firebase UID and email are required' });
    }

    // Check if user already exists by firebase_uid
    let result = await pool.query(
      'SELECT id, username, full_name, email, country, avatar_url, rating, rank, ranking, games_played, wins, losses, win_rate, max_points, best_ranking, join_date, bio, playing_style, favorite_shot FROM players WHERE firebase_uid = $1',
      [firebase_uid]
    );

    // If user exists, return them
    if (result.rows.length > 0) {
      return res.json({
        message: 'Login successful',
        user: result.rows[0]
      });
    }

    // Check if user exists by email (for migration)
    result = await pool.query(
      'SELECT id, username, full_name, email, country, avatar_url, rating, rank, ranking, games_played, wins, losses, win_rate, max_points, best_ranking, join_date, bio, playing_style, favorite_shot FROM players WHERE email = $1',
      [email]
    );

    if (result.rows.length > 0) {
      // Update existing user with firebase_uid
      await pool.query(
        'UPDATE players SET firebase_uid = $1, avatar_url = COALESCE($2, avatar_url) WHERE id = $3',
        [firebase_uid, avatar_url, result.rows[0].id]
      );
      
      return res.json({
        message: 'Login successful',
        user: result.rows[0]
      });
    }

    // Create new user
    const username = email.split('@')[0]; // Use email prefix as username
    const country = 'Unknown'; // Default country
    
    const insertResult = await pool.query(`
      INSERT INTO players (firebase_uid, username, full_name, email, country, avatar_url, rating)
      VALUES ($1, $2, $3, $4, $5, $6, 1000)
      RETURNING id, username, full_name, email, country, avatar_url, rating, rank, ranking, games_played, wins, losses, win_rate, max_points, best_ranking, join_date, bio, playing_style, favorite_shot
    `, [firebase_uid, username, full_name || username, email, country, avatar_url]);

    res.status(201).json({
      message: 'Account created and login successful',
      user: insertResult.rows[0]
    });
  } catch (error) {
    console.error('Error during Firebase Google login:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'User already exists' });
    } else {
      res.status(500).json({ error: 'Failed to login with Google' });
    }
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`[🔐 LOGIN] Attempting login for email: ${email}`);

    if (!email || !password) {
      console.log(`[🔐 LOGIN] ❌ Missing credentials: email=${!!email}, password=${!!password}`);
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    console.log(`[🔐 LOGIN] Querying database for user: ${email}`);
    const result = await pool.query(
      'SELECT id, username, full_name, email, country, avatar_url, rating, rank, ranking, games_played, wins, losses, win_rate, max_points, best_ranking, join_date, bio, playing_style, favorite_shot, password_hash FROM players WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`[🔐 LOGIN] ❌ User not found: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    console.log(`[🔐 LOGIN] ✅ User found: ${user.username} (ID: ${user.id})`);

    // Check if user has a password set
    if (!user.password_hash) {
      console.log(`[🔐 LOGIN] ❌ No password_hash set for user: ${email}`);
      return res.status(401).json({ error: 'Password not set. Please contact administrator.' });
    }

    console.log(`[🔐 LOGIN] Verifying password...`);
    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      console.log(`[🔐 LOGIN] ❌ Invalid password for user: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log(`[🔐 LOGIN] ✅ Password verified successfully for: ${email}`);
    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error(`[🔐 LOGIN] ❌ ERROR during login:`, error);
    console.error(`[🔐 LOGIN] Error stack:`, error.stack);
    console.error(`[🔐 LOGIN] Error details:`, {
      message: error.message,
      code: error.code,
      detail: error.detail,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Failed to login',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const {
      username, full_name, email, password, country, avatar_url, bio, playing_style, favorite_shot
    } = req.body;

    if (!username || !full_name || !email || !password || !country) {
      return res.status(400).json({ error: 'Username, full name, email, password, and country are required' });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Insert new player
    const result = await pool.query(`
      INSERT INTO players (username, full_name, email, country, avatar_url, bio, playing_style, favorite_shot, password_hash, rating)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1000)
      RETURNING id, username, full_name, email, country, avatar_url, rating, rank, ranking, games_played, wins, losses, win_rate, join_date, bio, playing_style, favorite_shot
    `, [username, full_name, email, country, avatar_url || null, bio || null, playing_style || null, favorite_shot || null, password_hash]);

    res.status(201).json({
      message: 'Account created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error during signup:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create account' });
    }
  }
});

// Get current user endpoint (for session validation)
router.get('/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await pool.query(`
      SELECT id, username, full_name, email, country, avatar_url, rating, rank, ranking,
             games_played, wins, losses, win_rate, max_points, best_ranking, join_date, bio, playing_style, favorite_shot,
             current_streak, best_streak
      FROM players 
      WHERE id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Change password endpoint (support both PUT and POST for compatibility)
const changePasswordHandler = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    console.log('[Change Password] Content-Type:', req.headers['content-type']);
    console.log('[Change Password] Raw body:', req.body);
    console.log('[Change Password] Body type:', typeof req.body);
    
    // Try to parse body if it's a string (for text/plain content type)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error('[Change Password] Failed to parse body as JSON:', e);
      }
    }
    
    const { currentPassword, newPassword } = body;

    console.log('[Change Password] Request received:', {
      userId,
      contentType: req.headers['content-type'],
      body: { currentPassword: currentPassword ? '***' : undefined, newPassword: newPassword ? '***' : undefined }
    });

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Get user with password hash
    const userResult = await pool.query(
      'SELECT id, password_hash FROM players WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check if user has a password set
    if (!user.password_hash) {
      return res.status(400).json({ error: 'Password not set. Please contact administrator.' });
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await pool.query(
      'UPDATE players SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

router.put('/change-password', changePasswordHandler);
router.post('/change-password', changePasswordHandler);

console.log('[Auth Router] Change password route registered at /change-password (PUT and POST)');

module.exports = router;

