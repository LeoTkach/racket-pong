const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Get all players with pagination and sorting
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'rating', order = 'DESC', search } = req.query;
    const offset = (page - 1) * limit;
    
    // Считаем статистику напрямую из matches для актуальности данных
    let query = `
      SELECT 
        p.id, p.username, p.full_name, p.email, p.country, p.avatar_url, p.rating, p.rank, p.ranking,
        p.max_points, p.best_ranking, p.join_date, p.bio, p.playing_style, p.favorite_shot,
        p.current_streak, p.best_streak,
        COALESCE(
          (SELECT COUNT(*) 
           FROM matches m 
           WHERE (m.player1_id = p.id OR m.player2_id = p.id) 
             AND m.status = 'completed' 
             AND m.winner_id IS NOT NULL), 
          0
        ) as games_played,
        COALESCE(
          (SELECT COUNT(*) 
           FROM matches m 
           WHERE m.winner_id = p.id 
             AND m.status = 'completed' 
             AND m.winner_id IS NOT NULL), 
          0
        ) as wins,
        COALESCE(
          (SELECT COUNT(*) 
           FROM matches m 
           WHERE (m.player1_id = p.id OR m.player2_id = p.id) 
             AND m.winner_id != p.id 
             AND m.winner_id IS NOT NULL 
             AND m.status = 'completed'), 
          0
        ) as losses,
        CASE 
          WHEN COALESCE(
            (SELECT COUNT(*) 
             FROM matches m 
             WHERE (m.player1_id = p.id OR m.player2_id = p.id) 
               AND m.status = 'completed' 
               AND m.winner_id IS NOT NULL), 
            0
          ) > 0 
          THEN ROUND((
            COALESCE(
              (SELECT COUNT(*) 
               FROM matches m 
               WHERE m.winner_id = p.id 
                 AND m.status = 'completed' 
                 AND m.winner_id IS NOT NULL), 
              0
            )::NUMERIC / 
            COALESCE(
              (SELECT COUNT(*) 
               FROM matches m 
               WHERE (m.player1_id = p.id OR m.player2_id = p.id) 
                 AND m.status = 'completed' 
                 AND m.winner_id IS NOT NULL), 
              1
            )::NUMERIC * 100
          )::NUMERIC, 2)
          ELSE 0
        END as win_rate
      FROM players p
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (search) {
      paramCount++;
      query += ` WHERE (p.username ILIKE $${paramCount} OR p.full_name ILIKE $${paramCount} OR p.country ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY ${sort} ${order.toUpperCase()}`;
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM players p';
    if (search) {
      countQuery += ' WHERE (p.username ILIKE $1 OR p.full_name ILIKE $1 OR p.country ILIKE $1)';
    }
    const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      players: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Get player by username (must be before /:id to avoid route conflicts)
router.get('/username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    // Считаем статистику напрямую из matches для актуальности данных
    const result = await pool.query(`
      SELECT 
        p.id, p.username, p.full_name, p.email, p.country, p.avatar_url, p.rating, p.rank, p.ranking,
        p.max_points, p.best_ranking, p.join_date, p.bio, p.playing_style, p.favorite_shot,
        p.current_streak, p.best_streak,
        COALESCE(
          (SELECT COUNT(*) 
           FROM matches m 
           WHERE (m.player1_id = p.id OR m.player2_id = p.id) 
             AND m.status = 'completed' 
             AND m.winner_id IS NOT NULL), 
          0
        ) as games_played,
        COALESCE(
          (SELECT COUNT(*) 
           FROM matches m 
           WHERE m.winner_id = p.id 
             AND m.status = 'completed' 
             AND m.winner_id IS NOT NULL), 
          0
        ) as wins,
        COALESCE(
          (SELECT COUNT(*) 
           FROM matches m 
           WHERE (m.player1_id = p.id OR m.player2_id = p.id) 
             AND m.winner_id != p.id 
             AND m.winner_id IS NOT NULL 
             AND m.status = 'completed'), 
          0
        ) as losses,
        CASE 
          WHEN COALESCE(
            (SELECT COUNT(*) 
             FROM matches m 
             WHERE (m.player1_id = p.id OR m.player2_id = p.id) 
               AND m.status = 'completed' 
               AND m.winner_id IS NOT NULL), 
            0
          ) > 0 
          THEN ROUND((
            COALESCE(
              (SELECT COUNT(*) 
               FROM matches m 
               WHERE m.winner_id = p.id 
                 AND m.status = 'completed' 
                 AND m.winner_id IS NOT NULL), 
              0
            )::NUMERIC / 
            COALESCE(
              (SELECT COUNT(*) 
               FROM matches m 
               WHERE (m.player1_id = p.id OR m.player2_id = p.id) 
                 AND m.status = 'completed' 
                 AND m.winner_id IS NOT NULL), 
              1
            )::NUMERIC * 100
          )::NUMERIC, 2)
          ELSE 0
        END as win_rate
      FROM players p
      WHERE p.username = $1
    `, [username]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const player = result.rows[0];
    
    // Ensure streaks are included in response (handle case where columns might not exist)
    const response = {
      ...player,
      current_streak: player.current_streak !== null && player.current_streak !== undefined ? player.current_streak : 0,
      best_streak: player.best_streak !== null && player.best_streak !== undefined ? player.best_streak : 0
    };
    
    res.json(response);
  } catch (error) {
    console.error('[API] Error fetching player by username:', error);
    console.error('[API] Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// Get player's tournaments (must be before /:id to avoid route conflicts)
router.get('/:id/tournaments', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query; // Optional status filter: 'completed', 'ongoing', 'upcoming', or 'all'
    
    // По умолчанию показываем все турниры (completed, ongoing, upcoming, cancelled)
    // Можно фильтровать по статусу через query параметр ?status=completed
    let statusFilter = '';
    if (status && status !== 'all') {
      if (status === 'completed') {
        statusFilter = "AND t.status IN ('completed', 'cancelled')";
      } else if (status === 'ongoing') {
        statusFilter = "AND t.status IN ('ongoing', 'live')";
      } else if (status === 'upcoming') {
        statusFilter = "AND t.status = 'upcoming'";
      }
    }
    
    // Добавляем результат игрока (rank) из tournament_standings
    const result = await pool.query(`
      SELECT 
        t.*, 
        tp.registered_at,
        COUNT(DISTINCT tp2.player_id) as participant_count,
        ts.rank as player_rank
      FROM tournaments t
      JOIN tournament_participants tp ON t.id = tp.tournament_id
      LEFT JOIN tournament_participants tp2 ON t.id = tp2.tournament_id
      LEFT JOIN tournament_standings ts ON t.id = ts.tournament_id AND ts.player_id = $1
      WHERE tp.player_id = $1
        ${statusFilter}
      GROUP BY t.id, tp.registered_at, ts.rank
      ORDER BY 
        CASE t.status
          WHEN 'upcoming' THEN 1
          WHEN 'ongoing' THEN 2
          WHEN 'live' THEN 2
          WHEN 'completed' THEN 3
          WHEN 'cancelled' THEN 4
          ELSE 5
        END,
        t.date DESC
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching player tournaments:', error);
    res.status(500).json({ error: 'Failed to fetch player tournaments' });
  }
});

// Get player's matches (must be before /:id to avoid route conflicts)
router.get('/:id/matches', async (req, res) => {
  try {
    const { id } = req.params;
    // Показываем только завершенные матчи в истории (status = 'completed' и winner_id IS NOT NULL)
    // Матчи в статусе scheduled, ongoing не показываем в истории
    // Используем дату турнира как fallback для start_time/end_time
    const result = await pool.query(`
      SELECT m.*, 
             p1.username as player1_username, p1.full_name as player1_name,
             p2.username as player2_username, p2.full_name as player2_name,
             winner.username as winner_username, winner.full_name as winner_name,
             t.name as tournament_name, t.id as tournament_id, t.date as tournament_date,
             ms.player1_scores, ms.player2_scores
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      LEFT JOIN players winner ON m.winner_id = winner.id
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      LEFT JOIN (
        SELECT DISTINCT ON (match_id) match_id, player1_scores, player2_scores
        FROM match_scores
        ORDER BY match_id, created_at DESC
      ) ms ON ms.match_id = m.id
      WHERE (m.player1_id = $1 OR m.player2_id = $1)
        AND m.status = 'completed'
        AND m.winner_id IS NOT NULL
      ORDER BY t.date DESC, m.id DESC
    `, [id]);
    
    // Форматируем результаты с scores и датами (дата матча = дата турнира)
    const matches = result.rows.map(match => ({
      ...match,
      match_date: match.tournament_date,
      scores: {
        player1: match.player1_scores || [],
        player2: match.player2_scores || []
      }
    }));
    
    res.json(matches);
  } catch (error) {
    console.error('Error fetching player matches:', error);
    res.status(500).json({ error: 'Failed to fetch player matches' });
  }
});

// Get player's rating history (must be before /:id to avoid route conflicts)
router.get('/:id/rating-history', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[API] Fetching rating history for player ID: ${id}`);
    
    const result = await pool.query(`
      SELECT 
        prh.rating, 
        prh.recorded_at, 
        prh.match_id,
        m.tournament_id
      FROM player_rating_history prh
      LEFT JOIN matches m ON prh.match_id = m.id
      WHERE prh.player_id = $1
      ORDER BY prh.recorded_at ASC
    `, [id]);
    
    console.log(`[API] ========================================`);
    console.log(`[API] Found ${result.rows.length} rating history records for player ${id}`);
    
    if (result.rows.length > 0) {
      const ratings = result.rows.map(r => r.rating);
      const uniqueRatings = new Set(ratings);
      const minRating = Math.min(...ratings);
      const maxRating = Math.max(...ratings);
      
      console.log(`[API] Rating stats: min=${minRating}, max=${maxRating}, unique=${uniqueRatings.size}`);
      
      if (uniqueRatings.size === 1) {
        console.warn(`[API] WARNING: All ratings are the same (${Array.from(uniqueRatings)[0]}) for player ${id}`);
      }
      
      console.log(`[API] First record:`, result.rows[0]);
      console.log(`[API] Last record:`, result.rows[result.rows.length - 1]);
      
      // Детальный анализ tournament_id
      const tournamentIds = result.rows.map(r => r.tournament_id).filter(id => id != null);
      const uniqueTournamentIds = [...new Set(tournamentIds)];
      const nullTournamentCount = result.rows.filter(r => r.tournament_id == null).length;
      
      console.log(`[API] Tournament analysis:`);
      console.log(`  Total records: ${result.rows.length}`);
      console.log(`  Records with tournament_id: ${tournamentIds.length}`);
      console.log(`  Records without tournament_id (null): ${nullTournamentCount}`);
      console.log(`  Unique tournament IDs: [${uniqueTournamentIds.join(', ')}]`);
      console.log(`  Number of unique tournaments: ${uniqueTournamentIds.length}`);
      
      // Log tournament grouping with details
      const byTournament = new Map();
      result.rows.forEach(r => {
        const tourId = r.tournament_id ?? 'null';
        if (!byTournament.has(tourId)) {
          byTournament.set(tourId, []);
        }
        byTournament.get(tourId).push(r);
      });
      
      console.log(`[API] Grouped by tournament (detailed):`);
      byTournament.forEach((points, tourId) => {
        const sorted = [...points].sort((a, b) => 
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
        );
        const ratings = sorted.map(p => p.rating);
        console.log(`  Tournament ${tourId}: ${points.length} points, ratings: [${ratings.join(', ')}]`);
      });
      
      // Проверяем, есть ли завершенные турниры без записей рейтинга
      const tournamentsResult = await pool.query(`
        SELECT DISTINCT t.id, t.name, t.status, t.date
        FROM tournaments t
        INNER JOIN tournament_participants tp ON t.id = tp.tournament_id
        WHERE tp.player_id = $1
          AND (t.status = 'completed' OR t.status = 'cancelled')
        ORDER BY t.date DESC
      `, [id]);
      
      const completedTournamentIds = tournamentsResult.rows.map(t => t.id);
      console.log(`[API] Completed tournaments for player ${id}: ${completedTournamentIds.length}`);
      console.log(`[API] Completed tournament IDs: [${completedTournamentIds.join(', ')}]`);
      
      const tournamentsWithoutRating = completedTournamentIds.filter(tid => !uniqueTournamentIds.includes(tid));
      if (tournamentsWithoutRating.length > 0) {
        console.warn(`[API] ⚠️  WARNING: ${tournamentsWithoutRating.length} completed tournaments without rating history:`);
        tournamentsWithoutRating.forEach(tid => {
          const tournament = tournamentsResult.rows.find(t => t.id === tid);
          console.warn(`[API]   - Tournament ID ${tid}: ${tournament?.name || 'Unknown'} (${tournament?.status || 'unknown status'})`);
        });
      }
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching player rating history:', error);
    res.status(500).json({ error: 'Failed to fetch player rating history' });
  }
});

// Get player's achievements (must be before /:id to avoid route conflicts)
router.get('/:id/achievements', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT a.*, pa.unlocked_at
      FROM achievements a
      LEFT JOIN player_achievements pa ON a.id = pa.achievement_id AND pa.player_id = $1
      ORDER BY a.rarity, a.name
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching player achievements:', error);
    res.status(500).json({ error: 'Failed to fetch player achievements' });
  }
});

// Get user settings (must be before /:id to avoid route conflicts)
router.get('/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Server] GET /players/:id/settings - User ID:', id);
    
    const result = await pool.query(`
      SELECT * FROM user_settings WHERE user_id = $1
    `, [id]);
    
    console.log('[Server] Query result rows count:', result.rows.length);
    
    if (result.rows.length === 0) {
      // Return default settings if no settings found
      const defaultSettings = {
        user_id: parseInt(id),
        language: 'en',
        timezone: 'utc+0',
        tournament_notifications: true,
        match_notifications: true,
        achievement_notifications: true,
        email_notifications: true,
        profile_visibility: true,
        stats_visibility: true,
        match_history_visibility: false,
        achievements_visibility: true
      };
      console.log('[Server] No settings found, returning defaults:', defaultSettings);
      res.json(defaultSettings);
    } else {
      // Ensure achievements_visibility exists in response
      const settings = result.rows[0];
      if (settings.achievements_visibility === undefined || settings.achievements_visibility === null) {
        settings.achievements_visibility = true;
      }
      console.log('[Server] Returning settings from DB:', settings);
      res.json(settings);
    }
  } catch (error) {
    console.error('[Server] Error fetching user settings:', error);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
});

// Get player by ID (must be after all specific routes to avoid route conflicts)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Считаем статистику напрямую из matches для актуальности данных
    const result = await pool.query(`
      SELECT 
        p.id, p.username, p.full_name, p.email, p.country, p.avatar_url, p.rating, p.rank, p.ranking,
        p.max_points, p.best_ranking, p.join_date, p.bio, p.playing_style, p.favorite_shot,
        p.current_streak, p.best_streak,
        COALESCE(
          (SELECT COUNT(*) 
           FROM matches m 
           WHERE (m.player1_id = p.id OR m.player2_id = p.id) 
             AND m.status = 'completed' 
             AND m.winner_id IS NOT NULL), 
          0
        ) as games_played,
        COALESCE(
          (SELECT COUNT(*) 
           FROM matches m 
           WHERE m.winner_id = p.id 
             AND m.status = 'completed' 
             AND m.winner_id IS NOT NULL), 
          0
        ) as wins,
        COALESCE(
          (SELECT COUNT(*) 
           FROM matches m 
           WHERE (m.player1_id = p.id OR m.player2_id = p.id) 
             AND m.winner_id != p.id 
             AND m.winner_id IS NOT NULL 
             AND m.status = 'completed'), 
          0
        ) as losses,
        CASE 
          WHEN COALESCE(
            (SELECT COUNT(*) 
             FROM matches m 
             WHERE (m.player1_id = p.id OR m.player2_id = p.id) 
               AND m.status = 'completed' 
               AND m.winner_id IS NOT NULL), 
            0
          ) > 0 
          THEN ROUND((
            COALESCE(
              (SELECT COUNT(*) 
               FROM matches m 
               WHERE m.winner_id = p.id 
                 AND m.status = 'completed' 
                 AND m.winner_id IS NOT NULL), 
              0
            )::NUMERIC / 
            COALESCE(
              (SELECT COUNT(*) 
               FROM matches m 
               WHERE (m.player1_id = p.id OR m.player2_id = p.id) 
                 AND m.status = 'completed' 
                 AND m.winner_id IS NOT NULL), 
              1
            )::NUMERIC * 100
          )::NUMERIC, 2)
          ELSE 0
        END as win_rate
      FROM players p
      WHERE p.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// Create new player
router.post('/', async (req, res) => {
  try {
    const {
      username, full_name, email, country, avatar_url, bio, playing_style, favorite_shot
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO players (username, full_name, email, country, avatar_url, bio, playing_style, favorite_shot)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [username, full_name, email, country, avatar_url, bio, playing_style, favorite_shot]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating player:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create player' });
    }
  }
});

// Update player
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username, full_name, email, country, avatar_url, bio, playing_style, favorite_shot
    } = req.body;
    
    const result = await pool.query(`
      UPDATE players 
      SET username = $1, full_name = $2, email = $3, country = $4, 
          avatar_url = $5, bio = $6, playing_style = $7, favorite_shot = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [username, full_name, email, country, avatar_url, bio, playing_style, favorite_shot, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating player:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Username or email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update player' });
    }
  }
});

// Delete player
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM players WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

// Update user settings (must be before /:id PUT to avoid route conflicts)
router.put('/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      language, timezone, tournament_notifications, match_notifications,
      achievement_notifications, email_notifications, profile_visibility,
      stats_visibility, match_history_visibility, achievements_visibility
    } = req.body;
    
    console.log('[Server] PUT /players/:id/settings - User ID:', id);
    console.log('[Server] Received settings from client:', req.body);
    console.log('[Server] Parsed settings:', {
      language, timezone, tournament_notifications, match_notifications,
      achievement_notifications, email_notifications, profile_visibility,
      stats_visibility, match_history_visibility, achievements_visibility
    });
    
    // Check if settings exist
    const existingSettings = await pool.query(
      'SELECT id FROM user_settings WHERE user_id = $1',
      [id]
    );
    
    console.log('[Server] Existing settings found:', existingSettings.rows.length > 0);
    
    let result;
    if (existingSettings.rows.length === 0) {
      // Insert new settings
      console.log('[Server] Inserting new settings...');
      const insertValues = [
        id, language, timezone, tournament_notifications, match_notifications,
        achievement_notifications, email_notifications, profile_visibility,
        stats_visibility, match_history_visibility, achievements_visibility !== undefined ? achievements_visibility : true
      ];
      console.log('[Server] Insert values:', insertValues);
      
      result = await pool.query(`
        INSERT INTO user_settings (
          user_id, language, timezone, tournament_notifications, match_notifications,
          achievement_notifications, email_notifications, profile_visibility,
          stats_visibility, match_history_visibility, achievements_visibility
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, insertValues);
    } else {
      // Update existing settings
      console.log('[Server] Updating existing settings...');
      const updateValues = [
        language, timezone, tournament_notifications, match_notifications,
        achievement_notifications, email_notifications, profile_visibility,
        stats_visibility, match_history_visibility, achievements_visibility !== undefined ? achievements_visibility : true, id
      ];
      console.log('[Server] Update values:', updateValues);
      
      result = await pool.query(`
        UPDATE user_settings 
        SET language = $1, timezone = $2, tournament_notifications = $3, match_notifications = $4,
            achievement_notifications = $5, email_notifications = $6, profile_visibility = $7,
            stats_visibility = $8, match_history_visibility = $9, achievements_visibility = $10,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $11
        RETURNING *
      `, updateValues);
    }
    
    if (result.rows.length === 0) {
      console.error('[Server] No rows returned after insert/update');
      return res.status(404).json({ error: 'Failed to update settings' });
    }
    
    console.log('[Server] Settings saved successfully, returning:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Server] Error updating user settings:', error);
    console.error('[Server] Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

module.exports = router;
