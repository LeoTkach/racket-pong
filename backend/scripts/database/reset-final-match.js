// Script to reset the final match for a tournament
// Usage: node scripts/database/reset-final-match.js <tournamentId>

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function resetFinalMatch(tournamentId) {
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
    console.log(`\n🔄 Resetting final match...`);
    console.log(`   Tournament ID: ${tournamentId}`);
    console.log(`   Tournament Name: "${tournamentName}"`);
    
    // Find the final match
    const finalMatch = await client.query(`
      SELECT m.id, m.round, m.player1_id, m.player2_id, m.winner_id, m.status,
             p1.full_name as player1_name, p1.username as player1_username,
             p2.full_name as player2_name, p2.username as player2_username,
             w.full_name as winner_name, w.username as winner_username
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      LEFT JOIN players w ON m.winner_id = w.id
      WHERE m.tournament_id = $1 
        AND (m.round = 'Final' OR m.round = 'Finals')
      ORDER BY m.id DESC
      LIMIT 1
    `, [tournamentId]);
    
    if (finalMatch.rows.length === 0) {
      console.log(`   ⚠️  No final match found for this tournament`);
      await client.query('ROLLBACK');
      return;
    }
    
    const match = finalMatch.rows[0];
    console.log(`   Found final match ID: ${match.id}`);
    console.log(`   Round: ${match.round}`);
    console.log(`   Player 1: ${match.player1_name || match.player1_username || 'N/A'}`);
    console.log(`   Player 2: ${match.player2_name || match.player2_username || 'N/A'}`);
    console.log(`   Winner: ${match.winner_name || match.winner_username || 'N/A'}`);
    console.log(`   Status: ${match.status}`);
    
    // Delete match scores
    const scoresDeleted = await client.query(
      'DELETE FROM match_scores WHERE match_id = $1',
      [match.id]
    );
    console.log(`   ✅ Deleted ${scoresDeleted.rowCount} score records`);
    
    // Reset the match: clear winner, status, and end_time
    // Keep player1_id and player2_id as they are
    const matchReset = await client.query(`
      UPDATE matches 
      SET winner_id = NULL,
          status = 'scheduled',
          end_time = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [match.id]);
    
    console.log(`   ✅ Reset final match`);
    
    // Also reset any dependent matches (if this is a playoff tournament)
    // Check if there are any matches that depend on this match's winner
    const dependentMatches = await client.query(`
      SELECT id, round, player1_id, player2_id
      FROM matches
      WHERE tournament_id = $1
        AND (player1_id = $2 OR player2_id = $2)
        AND id != $3
        AND round != 'Final'
        AND round != 'Finals'
    `, [tournamentId, match.winner_id, match.id]);
    
    if (dependentMatches.rows.length > 0) {
      console.log(`   ⚠️  Found ${dependentMatches.rows.length} dependent matches that may need manual review`);
    }
    
    await client.query('COMMIT');
    
    console.log(`\n✅ Final match reset successfully!`);
    console.log(`   Match ID: ${match.id}`);
    console.log(`   The match is now ready to be re-entered\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error resetting final match:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
const tournamentId = process.argv[2];

if (!tournamentId) {
  console.error('❌ Please provide tournament ID');
  console.error('Usage: node scripts/database/reset-final-match.js <tournamentId>');
  process.exit(1);
}

resetFinalMatch(parseInt(tournamentId))
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    pool.end();
    process.exit(1);
  });



