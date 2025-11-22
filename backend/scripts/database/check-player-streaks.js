const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'table_tennis_tournament',
  user: process.env.DB_USER || 'leonidtkach',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function checkPlayerStreaks(playerId = 5) {
  try {
    console.log(`🔍 Checking streaks for player ID: ${playerId}\n`);

    // Get player data
    const player = await pool.query(`
      SELECT id, username, full_name, current_streak, best_streak, wins, losses, games_played
      FROM players 
      WHERE id = $1
    `, [playerId]);

    if (player.rows.length === 0) {
      console.log(`❌ Player with ID ${playerId} not found`);
      return;
    }

    const p = player.rows[0];
    console.log(`📊 Player: ${p.username || p.full_name} (ID: ${p.id})`);
    console.log(`   current_streak: ${p.current_streak}`);
    console.log(`   best_streak: ${p.best_streak}`);
    console.log(`   wins: ${p.wins}`);
    console.log(`   losses: ${p.losses}`);
    console.log(`   games_played: ${p.games_played}\n`);

    // Get all matches
    const matches = await pool.query(`
      SELECT 
        m.id,
        m.winner_id,
        CASE WHEN m.winner_id = $1 THEN 1 ELSE 0 END as is_win,
        COALESCE(m.end_time, m.start_time, (SELECT t.date FROM tournaments t WHERE t.id = m.tournament_id)) as match_date
      FROM matches m
      WHERE (m.player1_id = $1 OR m.player2_id = $1)
        AND m.status = 'completed'
        AND m.winner_id IS NOT NULL
      ORDER BY 
        COALESCE(m.end_time, m.start_time, (SELECT t.date FROM tournaments t WHERE t.id = m.tournament_id)) DESC
    `, [playerId]);

    console.log(`📋 All matches (${matches.rows.length} total):`);
    
    // Calculate current streak manually
    let currentStreak = 0;
    for (const match of matches.rows) {
      if (match.is_win === 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate best streak manually
    let bestStreak = 0;
    let runningStreak = 0;
    const matchesOldestFirst = [...matches.rows].reverse();
    for (const match of matchesOldestFirst) {
      if (match.is_win === 1) {
        runningStreak++;
        bestStreak = Math.max(bestStreak, runningStreak);
      } else {
        runningStreak = 0;
      }
    }

    console.log(`   Calculated current streak: ${currentStreak}`);
    console.log(`   Calculated best streak: ${bestStreak}\n`);

    if (p.current_streak !== currentStreak || p.best_streak !== bestStreak) {
      console.log('⚠️  Mismatch detected! Recalculating...\n');
      await pool.query('SELECT recalculate_player_streaks($1)', [playerId]);
      
      const updated = await pool.query(`
        SELECT current_streak, best_streak
        FROM players 
        WHERE id = $1
      `, [playerId]);
      
      console.log(`✅ Updated:`);
      console.log(`   current_streak: ${updated.rows[0].current_streak}`);
      console.log(`   best_streak: ${updated.rows[0].best_streak}\n`);
    } else {
      console.log('✅ Streaks match calculated values!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  const playerId = process.argv[2] ? parseInt(process.argv[2]) : 5;
  checkPlayerStreaks(playerId)
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { checkPlayerStreaks };

