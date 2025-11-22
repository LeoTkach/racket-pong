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

async function recalculateAllPlayersWinsLosses() {
  try {
    console.log('🔄 Starting recalculation of wins/losses for all players...\n');

    // Get all players
    const playersResult = await pool.query('SELECT id, username, full_name FROM players');
    const players = playersResult.rows;

    console.log(`Found ${players.length} players to process\n`);

    let updated = 0;
    let errors = 0;

    for (const player of players) {
      try {
        // Calculate stats from matches
        const statsResult = await pool.query(`
          SELECT 
            COUNT(*) as games_played,
            COUNT(*) FILTER (WHERE winner_id = $1) as wins,
            COUNT(*) FILTER (WHERE (player1_id = $1 OR player2_id = $1) 
                              AND winner_id != $1 
                              AND winner_id IS NOT NULL 
                              AND status = 'completed') as losses
          FROM matches
          WHERE (player1_id = $1 OR player2_id = $1)
            AND status = 'completed'
        `, [player.id]);

        const stats = statsResult.rows[0];
        const gamesPlayed = parseInt(stats.games_played) || 0;
        const wins = parseInt(stats.wins) || 0;
        const losses = parseInt(stats.losses) || 0;
        const winRate = gamesPlayed > 0 
          ? (parseFloat(wins) / parseFloat(gamesPlayed) * 100).toFixed(2)
          : 0;

        // Update player stats
        await pool.query(`
          UPDATE players 
          SET 
            games_played = $1,
            wins = $2,
            losses = $3,
            win_rate = $4,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `, [gamesPlayed, wins, losses, parseFloat(winRate), player.id]);

        // Recalculate streaks using the database function
        await pool.query('SELECT recalculate_player_streaks($1)', [player.id]);

        console.log(`✅ ${player.username || player.full_name || `Player ${player.id}`}: ${wins} wins, ${losses} losses, ${gamesPlayed} games`);
        updated++;
      } catch (error) {
        console.error(`❌ Error updating player ${player.id}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`\n✨ Recalculation complete!`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  recalculateAllPlayersWinsLosses()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { recalculateAllPlayersWinsLosses };

