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

async function checkAndFixStreaks() {
  try {
    console.log('🔍 Checking streaks data...\n');

    // Check if columns exist
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'players' 
        AND column_name IN ('current_streak', 'best_streak')
    `);

    if (columnCheck.rows.length < 2) {
      console.log('❌ Streak columns are missing! Please run add_streak_fields.sql first.');
      console.log('   Found columns:', columnCheck.rows.map(r => r.column_name));
      return;
    }

    console.log('✅ Streak columns exist\n');

    // Check if function exists
    const functionCheck = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name = 'recalculate_player_streaks'
    `);

    if (functionCheck.rows.length === 0) {
      console.log('❌ Function recalculate_player_streaks does not exist!');
      console.log('   Please run update_player_streaks_function.sql first.');
      return;
    }

    console.log('✅ Function recalculate_player_streaks exists\n');

    // Check current data for a specific player (Leonid Tkach, ID 5)
    const playerId = 5;
    const playerCheck = await pool.query(`
      SELECT id, username, full_name, current_streak, best_streak, wins, losses
      FROM players 
      WHERE id = $1
    `, [playerId]);

    if (playerCheck.rows.length === 0) {
      console.log(`❌ Player with ID ${playerId} not found`);
      return;
    }

    const player = playerCheck.rows[0];
    console.log(`📊 Current data for ${player.username || player.full_name} (ID: ${player.id}):`);
    console.log(`   current_streak: ${player.current_streak}`);
    console.log(`   best_streak: ${player.best_streak}`);
    console.log(`   wins: ${player.wins}`);
    console.log(`   losses: ${player.losses}\n`);

    // Check matches for this player
    const matchesCheck = await pool.query(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(*) FILTER (WHERE winner_id = $1) as wins,
        COUNT(*) FILTER (WHERE (player1_id = $1 OR player2_id = $1) AND winner_id != $1 AND winner_id IS NOT NULL) as losses
      FROM matches
      WHERE (player1_id = $1 OR player2_id = $1)
        AND status = 'completed'
        AND winner_id IS NOT NULL
    `, [playerId]);

    const matches = matchesCheck.rows[0];
    console.log(`📈 Matches data:`);
    console.log(`   Total completed matches: ${matches.total_matches}`);
    console.log(`   Wins: ${matches.wins}`);
    console.log(`   Losses: ${matches.losses}\n`);

    // Get recent matches to calculate current streak manually
    const recentMatches = await pool.query(`
      SELECT 
        m.*,
        CASE WHEN m.winner_id = $1 THEN 1 ELSE 0 END as is_win
      FROM matches m
      WHERE (m.player1_id = $1 OR m.player2_id = $1)
        AND m.status = 'completed'
        AND m.winner_id IS NOT NULL
      ORDER BY 
        COALESCE(m.end_time, m.start_time, (SELECT t.date FROM tournaments t WHERE t.id = m.tournament_id)) DESC
      LIMIT 10
    `, [playerId]);

    console.log(`📋 Recent matches (last 10):`);
    let currentStreakManual = 0;
    for (const match of recentMatches.rows) {
      const result = match.is_win === 1 ? 'WIN' : 'LOSS';
      console.log(`   Match ${match.id}: ${result}`);
      if (match.is_win === 1 && currentStreakManual === recentMatches.rows.indexOf(match)) {
        currentStreakManual++;
      } else if (match.is_win === 0) {
        break;
      }
    }
    console.log(`\n   Calculated current streak: ${currentStreakManual}\n`);

    // Recalculate streaks using the function
    console.log('🔄 Recalculating streaks...');
    await pool.query('SELECT recalculate_player_streaks($1)', [playerId]);

    // Check updated data
    const updatedCheck = await pool.query(`
      SELECT current_streak, best_streak
      FROM players 
      WHERE id = $1
    `, [playerId]);

    const updated = updatedCheck.rows[0];
    console.log(`✅ Updated data:`);
    console.log(`   current_streak: ${updated.current_streak}`);
    console.log(`   best_streak: ${updated.best_streak}\n`);

    // Recalculate for all players
    console.log('🔄 Recalculating streaks for all players...');
    const allPlayers = await pool.query('SELECT id, username, full_name FROM players');
    
    for (const p of allPlayers.rows) {
      try {
        await pool.query('SELECT recalculate_player_streaks($1)', [p.id]);
        console.log(`   ✅ ${p.username || p.full_name || `Player ${p.id}`}`);
      } catch (error) {
        console.error(`   ❌ Error for player ${p.id}:`, error.message);
      }
    }

    console.log('\n✨ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  checkAndFixStreaks()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { checkAndFixStreaks };

