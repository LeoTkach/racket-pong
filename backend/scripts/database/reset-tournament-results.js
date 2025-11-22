// Script to reset tournament match results (but keep match structure)
// Usage: node scripts/database/reset-tournament-results.js <tournament_id>

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function resetTournamentResults(tournamentId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get tournament info
    const tournament = await client.query(
      'SELECT id, name, status FROM tournaments WHERE id = $1',
      [tournamentId]
    );
    
    if (tournament.rows.length === 0) {
      console.error(`❌ Tournament with ID ${tournamentId} not found`);
      await client.query('ROLLBACK');
      return;
    }
    
    const tournamentName = tournament.rows[0].name;
    const oldStatus = tournament.rows[0].status;
    
    console.log(`\n🔄 Resetting tournament results...`);
    console.log(`   Tournament ID: ${tournamentId}`);
    console.log(`   Tournament Name: "${tournamentName}"`);
    console.log(`   Current Status: ${oldStatus}`);
    
    // Get all matches for this tournament
    const matches = await client.query(
      'SELECT id, round FROM matches WHERE tournament_id = $1',
      [tournamentId]
    );
    
    console.log(`   Found ${matches.rows.length} matches to reset`);
    
    if (matches.rows.length === 0) {
      console.log(`   ⚠️  No matches found for this tournament`);
    } else {
      // Delete all match scores
      const scoresDeleted = await client.query(
        'DELETE FROM match_scores WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = $1)',
        [tournamentId]
      );
      console.log(`   ✅ Deleted ${scoresDeleted.rowCount} score records`);
      
      // Reset all matches: clear winner, scores, status, and player slots for non-first rounds
      // For first round (Quarterfinals for 8 players), keep player1_id and player2_id
      // For later rounds, clear player slots
      const matchesReset = await client.query(`
        UPDATE matches 
        SET winner_id = NULL,
            status = 'scheduled',
            start_time = NULL,
            end_time = NULL,
            player1_id = CASE 
              WHEN round IN ('Quarterfinals', 'Round of 16', 'Round of 32', 'First Round', 'Round Robin') 
              THEN player1_id 
              ELSE NULL 
            END,
            player2_id = CASE 
              WHEN round IN ('Quarterfinals', 'Round of 16', 'Round of 32', 'First Round', 'Round Robin') 
              THEN player2_id 
              ELSE NULL 
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE tournament_id = $1
      `, [tournamentId]);
      
      console.log(`   ✅ Reset ${matchesReset.rowCount} matches`);
    }
    
    // Delete tournament standings
    const standingsDeleted = await client.query(
      'DELETE FROM tournament_standings WHERE tournament_id = $1',
      [tournamentId]
    );
    console.log(`   ✅ Deleted ${standingsDeleted.rowCount} standings records`);
    
    // Update tournament status to 'upcoming'
    await client.query(
      'UPDATE tournaments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['upcoming', tournamentId]
    );
    console.log(`   ✅ Tournament status set to 'upcoming'`);
    
    await client.query('COMMIT');
    
    console.log(`\n✅ Tournament results reset successfully!`);
    console.log(`   ${oldStatus} → upcoming`);
    console.log(`   All match results cleared`);
    console.log(`   Tournament ready for testing\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error resetting tournament results:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
const tournamentId = process.argv[2];

if (!tournamentId) {
  console.error('Usage: node scripts/database/reset-tournament-results.js <tournament_id>');
  console.error('Example: node scripts/database/reset-tournament-results.js 4');
  process.exit(1);
}

resetTournamentResults(parseInt(tournamentId))
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    pool.end();
    process.exit(1);
  });

