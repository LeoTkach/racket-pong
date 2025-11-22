// Universal script to reset test tournament (ID 4) for testing after code changes
// This script should be run after making changes to tournament/match logic
// Usage: node scripts/database/reset-test-tournament.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

const TEST_TOURNAMENT_ID = 4;

async function resetTestTournament() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get tournament info
    const tournament = await client.query(
      'SELECT id, name, status FROM tournaments WHERE id = $1',
      [TEST_TOURNAMENT_ID]
    );
    
    if (tournament.rows.length === 0) {
      console.error(`❌ Test tournament with ID ${TEST_TOURNAMENT_ID} not found`);
      await client.query('ROLLBACK');
      return;
    }
    
    const tournamentName = tournament.rows[0].name;
    const oldStatus = tournament.rows[0].status;
    
    console.log(`\n🔄 Resetting test tournament for testing...`);
    console.log(`   Tournament ID: ${TEST_TOURNAMENT_ID}`);
    console.log(`   Tournament Name: "${tournamentName}"`);
    console.log(`   Current Status: ${oldStatus}`);
    
    // Get all matches for this tournament
    const matches = await client.query(
      'SELECT id, round FROM matches WHERE tournament_id = $1',
      [TEST_TOURNAMENT_ID]
    );
    
    console.log(`   Found ${matches.rows.length} matches`);
    
    if (matches.rows.length > 0) {
      // Delete all match scores
      const scoresDeleted = await client.query(
        'DELETE FROM match_scores WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = $1)',
        [TEST_TOURNAMENT_ID]
      );
      console.log(`   ✅ Deleted ${scoresDeleted.rowCount} score records`);
      
      // Reset all matches: clear winner, scores, status, and player slots for non-first rounds
      // Force reset all matches completely
      const matchesReset = await client.query(`
        UPDATE matches 
        SET winner_id = NULL,
            status = 'scheduled',
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
      `, [TEST_TOURNAMENT_ID]);
      
      // Double-check: ensure no matches have winners or completed status
      const doubleCheck = await client.query(`
        UPDATE matches 
        SET winner_id = NULL, status = 'scheduled', end_time = NULL
        WHERE tournament_id = $1 AND (winner_id IS NOT NULL OR status = 'completed')
      `, [TEST_TOURNAMENT_ID]);
      
      if (doubleCheck.rowCount > 0) {
        console.log(`   ✅ Additional ${doubleCheck.rowCount} matches force-reset`);
      }
      
      console.log(`   ✅ Reset ${matchesReset.rowCount} matches`);
    }
    
    // Update tournament status to 'upcoming'
    await client.query(
      'UPDATE tournaments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['upcoming', TEST_TOURNAMENT_ID]
    );
    console.log(`   ✅ Tournament status set to 'upcoming'`);
    
    await client.query('COMMIT');
    
    console.log(`\n✅ Test tournament reset successfully!`);
    console.log(`   ${oldStatus} → upcoming`);
    console.log(`   All match results cleared`);
    console.log(`   Tournament ready for testing\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error resetting test tournament:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
resetTestTournament()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    pool.end();
    process.exit(1);
  });

