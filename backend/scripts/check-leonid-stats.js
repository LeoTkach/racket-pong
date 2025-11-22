const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkLeonidStats() {
  try {
    console.log('🔍 Checking Leonid Tkach stats...\n');

    // Get player data
    const playerResult = await pool.query(`
      SELECT id, username, full_name, wins, losses, games_played, win_rate
      FROM players
      WHERE username = 'leonidtkach' OR full_name ILIKE '%leonid%tkach%'
    `);

    if (playerResult.rows.length === 0) {
      console.log('❌ Player not found');
      return;
    }

    const player = playerResult.rows[0];
    console.log('📊 Player Info:');
    console.log(`   ID: ${player.id}`);
    console.log(`   Username: ${player.username}`);
    console.log(`   Full Name: ${player.full_name}`);
    console.log('');
    console.log('📈 Current Stats (from database):');
    console.log(`   Wins: ${player.wins}`);
    console.log(`   Losses: ${player.losses}`);
    console.log(`   Games Played: ${player.games_played}`);
    console.log(`   Win Rate: ${player.win_rate}%`);
    console.log('');

    // Calculate stats from matches
    const matchesResult = await pool.query(`
      SELECT 
        COUNT(*) as total_matches,
        SUM(CASE WHEN winner_id = $1 THEN 1 ELSE 0 END) as calculated_wins,
        SUM(CASE WHEN loser_id = $1 THEN 1 ELSE 0 END) as calculated_losses
      FROM matches
      WHERE (winner_id = $1 OR loser_id = $1)
        AND winner_id IS NOT NULL
        AND loser_id IS NOT NULL
    `, [player.id]);

    const matchStats = matchesResult.rows[0];
    const calculatedWins = parseInt(matchStats.calculated_wins) || 0;
    const calculatedLosses = parseInt(matchStats.calculated_losses) || 0;
    const calculatedGamesPlayed = calculatedWins + calculatedLosses;
    const calculatedWinRate = calculatedGamesPlayed > 0 
      ? ((calculatedWins / calculatedGamesPlayed) * 100).toFixed(2)
      : 0;

    console.log('🔢 Calculated Stats (from matches):');
    console.log(`   Wins: ${calculatedWins}`);
    console.log(`   Losses: ${calculatedLosses}`);
    console.log(`   Games Played: ${calculatedGamesPlayed}`);
    console.log(`   Calculated Win Rate: ${calculatedWinRate}%`);
    console.log('');

    // Show discrepancy if any
    if (player.wins !== calculatedWins || player.losses !== calculatedLosses) {
      console.log('⚠️  DISCREPANCY DETECTED:');
      console.log(`   Database shows: ${player.wins} wins, ${player.losses} losses`);
      console.log(`   Matches show: ${calculatedWins} wins, ${calculatedLosses} losses`);
      console.log('');
    }

    // Show detailed calculation
    console.log('💡 Win Rate Calculation:');
    console.log(`   Formula: (Wins / Games Played) × 100`);
    console.log(`   = (${calculatedWins} / ${calculatedGamesPlayed}) × 100`);
    console.log(`   = ${calculatedWinRate}%`);
    console.log(`   Rounded: ${Math.round(parseFloat(calculatedWinRate))}%`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkLeonidStats();
