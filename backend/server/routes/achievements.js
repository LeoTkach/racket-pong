const express = require('express');
const pool = require('../config/database');
const router = express.Router();

const requiredAchievements = [
  {
    name: 'Jungle Explorer',
    description: 'Play for 3 months',
    rarity: 'rare',
    icon_name: 'TreePalm',
    display_order: 3
  }
];

const deprecatedAchievements = ['Globetrotter'];

async function ensureRequiredAchievements() {
  for (const achievement of requiredAchievements) {
    const exists = await pool.query(
      'SELECT id FROM achievements WHERE name = $1',
      [achievement.name]
    );

    if (exists.rowCount === 0) {
      await pool.query(
        `
          INSERT INTO achievements (name, description, rarity, icon_name, display_order)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [
          achievement.name,
          achievement.description,
          achievement.rarity,
          achievement.icon_name,
          achievement.display_order
        ]
      );
    }
  }

  if (deprecatedAchievements.length > 0) {
    await pool.query(
      `
        DELETE FROM achievements
        WHERE name = ANY($1::text[])
      `,
      [deprecatedAchievements]
    );
  }
}

// Get all achievements
router.get('/', async (req, res) => {
  try {
    await ensureRequiredAchievements();

    const { rarity, player_id } = req.query;

    let query = `
      SELECT a.*, 
             CASE WHEN pa.player_id IS NOT NULL THEN true ELSE false END as unlocked,
             pa.unlocked_at
      FROM achievements a
      LEFT JOIN player_achievements pa ON a.id = pa.achievement_id
    `;

    const params = [];
    let paramCount = 0;
    const conditions = [];

    if (rarity) {
      paramCount++;
      conditions.push(`a.rarity = $${paramCount}`);
      params.push(rarity);
    }

    if (player_id) {
      paramCount++;
      conditions.push(`pa.player_id = $${paramCount}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY COALESCE(a.display_order, 999), a.rarity, a.name`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// Get achievement by ID
router.get('/:id', async (req, res) => {
  try {
    await ensureRequiredAchievements();

    const { id } = req.params;
    const result = await pool.query(`
      SELECT * FROM achievements WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching achievement:', error);
    res.status(500).json({ error: 'Failed to fetch achievement' });
  }
});

// Get player's achievements
router.get('/player/:player_id', async (req, res) => {
  try {
    await ensureRequiredAchievements();

    const { player_id } = req.params;
    const result = await pool.query(`
      SELECT a.*, pa.unlocked_at
      FROM achievements a
      LEFT JOIN player_achievements pa ON a.id = pa.achievement_id AND pa.player_id = $1
      ORDER BY COALESCE(a.display_order, 999), a.rarity, a.name
    `, [player_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching player achievements:', error);
    res.status(500).json({ error: 'Failed to fetch player achievements' });
  }
});

// Unlock achievement for player
router.post('/:id/unlock/:player_id', async (req, res) => {
  try {
    const { id, player_id } = req.params;

    // Check if achievement exists
    const achievementResult = await pool.query(`
      SELECT * FROM achievements WHERE id = $1
    `, [id]);

    if (achievementResult.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    // Check if player exists
    const playerResult = await pool.query(`
      SELECT * FROM players WHERE id = $1
    `, [player_id]);

    if (playerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Unlock achievement
    const result = await pool.query(`
      INSERT INTO player_achievements (player_id, achievement_id)
      VALUES ($1, $2)
      ON CONFLICT (player_id, achievement_id) DO NOTHING
      RETURNING *
    `, [player_id, id]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Achievement already unlocked' });
    }

    res.json({ message: 'Achievement unlocked successfully' });
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    res.status(500).json({ error: 'Failed to unlock achievement' });
  }
});

// Create new achievement
router.post('/', async (req, res) => {
  try {
    const { name, description, rarity, icon_name } = req.body;

    const result = await pool.query(`
      INSERT INTO achievements (name, description, rarity, icon_name)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, description, rarity, icon_name]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating achievement:', error);
    res.status(500).json({ error: 'Failed to create achievement' });
  }
});

// Update achievement
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, rarity, icon_name } = req.body;

    const result = await pool.query(`
      UPDATE achievements 
      SET name = $1, description = $2, rarity = $3, icon_name = $4
      WHERE id = $5
      RETURNING *
    `, [name, description, rarity, icon_name, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating achievement:', error);
    res.status(500).json({ error: 'Failed to update achievement' });
  }
});

// Delete achievement
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM achievements WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    res.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({ error: 'Failed to delete achievement' });
  }
});

module.exports = router;
