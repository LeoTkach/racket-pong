const express = require('express');
const pool = require('../config/database');
const router = express.Router();

console.log('[Notifications Router] Loading notifications routes...');

// Test route to verify router is working
router.get('/test', (req, res) => {
  console.log('[Notifications] Test route hit');
  res.json({ message: 'Notifications router is working', timestamp: new Date().toISOString() });
});

// Create notification - MUST be before parameterized routes
router.post('/', async (req, res) => {
  console.log('[Notifications] POST / - Creating notification');
  console.log('[Notifications] Request body:', req.body);
  try {
    const { user_id, type, title, message, link_url, metadata } = req.body;

    if (!user_id || !type || !title || !message) {
      console.log('[Notifications] Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: user_id, type, title, message' });
    }

    try {
      const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, link_url, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [user_id, type, title, message, link_url || null, metadata ? JSON.stringify(metadata) : null]
      );

      res.status(201).json(result.rows[0]);
    } catch (tableError) {
      if (tableError.code === '42P01') {
        return res.status(500).json({ error: 'Notifications table does not exist' });
      }
      throw tableError;
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Get unread count - MUST be before GET /:userId
router.get('/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;

    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );

      res.json({ unreadCount: parseInt(result.rows[0].count) });
    } catch (tableError) {
      // If table doesn't exist, return 0
      if (tableError.code === '42P01') {
        console.log('[Notifications] Table does not exist, returning unreadCount 0');
        res.json({ unreadCount: 0 });
        return;
      }
      throw tableError;
    }
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Get all notifications for a user - MUST be after specific routes
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, unread_only = false } = req.query;

    console.log('[Notifications] GET request for user:', userId);

    try {
      let query = `
        SELECT id, type, title, message, is_read, link_url, metadata, created_at, read_at
        FROM notifications
        WHERE user_id = $1
      `;

      const params = [userId];
      let paramCount = 1;

      if (unread_only === 'true' || unread_only === true) {
        query += ` AND is_read = false`;
      }

      query += ` ORDER BY created_at DESC`;
      
      if (limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(parseInt(limit));
      }

      const result = await pool.query(query, params);

      // Get unread count (also handle table not existing)
      let unreadCount = 0;
      try {
        const countResult = await pool.query(
          'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
          [userId]
        );
        unreadCount = parseInt(countResult.rows[0].count);
      } catch (countError) {
        if (countError.code !== '42P01') {
          throw countError;
        }
        // Table doesn't exist, unreadCount stays 0
      }

      res.json({
        notifications: result.rows,
        unreadCount
      });
    } catch (tableError) {
      // If table doesn't exist, return empty result
      if (tableError.code === '42P01') {
        console.log('[Notifications] Table does not exist, returning empty array');
        res.json({
          notifications: [],
          unreadCount: 0
        });
        return;
      }
      throw tableError;
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.headers['x-user-id'];

    try {
      // Verify notification belongs to user
      const checkResult = await pool.query(
        'SELECT user_id FROM notifications WHERE id = $1',
        [notificationId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      if (checkResult.rows[0].user_id.toString() !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const result = await pool.query(
        `UPDATE notifications 
         SET is_read = true, read_at = CURRENT_TIMESTAMP 
         WHERE id = $1 
         RETURNING *`,
        [notificationId]
      );

      res.json(result.rows[0]);
    } catch (tableError) {
      if (tableError.code === '42P01') {
        return res.status(404).json({ error: 'Notification not found' });
      }
      throw tableError;
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    const requestUserId = req.headers['x-user-id'];

    if (requestUserId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    try {
      const result = await pool.query(
        `UPDATE notifications 
         SET is_read = true, read_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1 AND is_read = false`,
        [userId]
      );

      res.json({ 
        message: 'All notifications marked as read',
        updatedCount: result.rowCount || 0
      });
    } catch (tableError) {
      if (tableError.code === '42P01') {
        res.json({ message: 'All notifications marked as read' });
        return;
      }
      throw tableError;
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.headers['x-user-id'];

    try {
      // Verify notification belongs to user
      const checkResult = await pool.query(
        'SELECT user_id FROM notifications WHERE id = $1',
        [notificationId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      if (checkResult.rows[0].user_id.toString() !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await pool.query('DELETE FROM notifications WHERE id = $1', [notificationId]);

      res.json({ message: 'Notification deleted' });
    } catch (tableError) {
      if (tableError.code === '42P01') {
        return res.status(404).json({ error: 'Notification not found' });
      }
      throw tableError;
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

console.log('[Notifications Router] Routes loaded successfully');

module.exports = router;

