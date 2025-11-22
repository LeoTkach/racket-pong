const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function resetTournamentToPlanned(tournamentId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get current tournament info
    const currentTournament = await client.query(
      'SELECT id, name, status FROM tournaments WHERE id = $1',
      [tournamentId]
    );
    
    if (currentTournament.rows.length === 0) {
      console.error(`❌ Tournament with ID ${tournamentId} not found`);
      await client.query('ROLLBACK');
      return;
    }
    
    const tournament = currentTournament.rows[0];
    const oldStatus = tournament.status;
    
    console.log(`\n🔄 Resetting tournament to planned status...`);
    console.log(`   Tournament ID: ${tournamentId}`);
    console.log(`   Tournament Name: "${tournament.name}"`);
    console.log(`   Current Status: ${oldStatus}`);
    
    // Delete match scores first (foreign key constraint)
    const deletedScores = await client.query(
      'DELETE FROM match_scores WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = $1)',
      [tournamentId]
    );
    console.log(`   ✅ Deleted ${deletedScores.rowCount} match scores`);
    
    // Delete all matches for this tournament
    const deletedMatches = await client.query(
      'DELETE FROM matches WHERE tournament_id = $1',
      [tournamentId]
    );
    console.log(`   ✅ Deleted ${deletedMatches.rowCount} matches`);
    
    // Delete tournament standings if any
    const deletedStandings = await client.query(
      'DELETE FROM tournament_standings WHERE tournament_id = $1',
      [tournamentId]
    );
    console.log(`   ✅ Deleted ${deletedStandings.rowCount} tournament standings`);
    
    // Update tournament status to 'upcoming'
    const result = await client.query(`
      UPDATE tournaments 
      SET status = 'upcoming', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [tournamentId]);
    
    await client.query('COMMIT');
    
    console.log(`✅ Tournament reset successfully!`);
    console.log(`   Status: ${oldStatus} → upcoming`);
    console.log(`   Matches: ${deletedMatches.rowCount} deleted`);
    console.log(`   Match Scores: ${deletedScores.rowCount} deleted`);
    console.log(`   Standings: ${deletedStandings.rowCount} deleted`);
    console.log(`\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error resetting tournament:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
const tournamentId = process.argv[2];

if (!tournamentId) {
  console.error('Usage: node scripts/database/reset-tournament-to-planned.js <tournament_id>');
  console.error('Example: node scripts/database/reset-tournament-to-planned.js 1');
  process.exit(1);
}

resetTournamentToPlanned(parseInt(tournamentId))
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    pool.end();
    process.exit(1);
  });





