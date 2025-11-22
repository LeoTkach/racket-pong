// Script to reset tournament match results and set status to ongoing
// Usage: node scripts/database/reset-tournament-to-ongoing.js <tournament_id>
// Or: node scripts/database/reset-tournament-to-ongoing.js --date 2025-11-16

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function resetTournamentToOngoing(tournamentId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get tournament info
    const tournament = await client.query(
      'SELECT id, name, status, date FROM tournaments WHERE id = $1',
      [tournamentId]
    );
    
    if (tournament.rows.length === 0) {
      console.error(`❌ Tournament with ID ${tournamentId} not found`);
      await client.query('ROLLBACK');
      return;
    }
    
    const tournamentName = tournament.rows[0].name;
    const oldStatus = tournament.rows[0].status;
    const tournamentDate = tournament.rows[0].date;
    
    console.log(`\n🔄 Resetting tournament to ongoing...`);
    console.log(`   Tournament ID: ${tournamentId}`);
    console.log(`   Tournament Name: "${tournamentName}"`);
    console.log(`   Tournament Date: ${tournamentDate}`);
    console.log(`   Current Status: ${oldStatus}`);
    
    // Get all matches for this tournament
    const matches = await client.query(
      'SELECT id, round, status, winner_id FROM matches WHERE tournament_id = $1',
      [tournamentId]
    );
    
    console.log(`   Found ${matches.rows.length} matches to reset`);
    console.log(`   Completed matches: ${matches.rows.filter(m => m.status === 'completed').length}`);
    
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
      // For Round Robin, keep player1_id and player2_id
      // For later rounds in single-elimination, clear player slots
      const matchesReset = await client.query(`
        UPDATE matches 
        SET winner_id = NULL,
            status = 'scheduled',
            start_time = NULL,
            end_time = NULL,
            player1_id = CASE 
              WHEN round IN ('Quarterfinals', 'Round of 16', 'Round of 32', 'First Round', 'Round Robin', 'Group Stage') 
              THEN player1_id 
              ELSE NULL 
            END,
            player2_id = CASE 
              WHEN round IN ('Quarterfinals', 'Round of 16', 'Round of 32', 'First Round', 'Round Robin', 'Group Stage') 
              THEN player2_id 
              ELSE NULL 
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE tournament_id = $1
      `, [tournamentId]);
      
      // Double-check: ensure no matches have winners or completed status
      const doubleCheck = await client.query(`
        UPDATE matches 
        SET winner_id = NULL, status = 'scheduled', end_time = NULL
        WHERE tournament_id = $1 AND (winner_id IS NOT NULL OR status = 'completed')
      `, [tournamentId]);
      
      if (doubleCheck.rowCount > 0) {
        console.log(`   ✅ Additional ${doubleCheck.rowCount} matches force-reset`);
      }
      
      console.log(`   ✅ Reset ${matchesReset.rowCount} matches`);
    }
    
    // Delete tournament standings
    const standingsDeleted = await client.query(
      'DELETE FROM tournament_standings WHERE tournament_id = $1',
      [tournamentId]
    );
    console.log(`   ✅ Deleted ${standingsDeleted.rowCount} standings records`);
    
    // Update tournament status to 'ongoing'
    await client.query(
      'UPDATE tournaments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['ongoing', tournamentId]
    );
    console.log(`   ✅ Tournament status set to 'ongoing'`);
    
    await client.query('COMMIT');
    
    console.log(`\n✅ Tournament reset successfully!`);
    console.log(`   Status: ${oldStatus} → ongoing`);
    console.log(`   All match results cleared`);
    console.log(`   Tournament ready for new matches\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error resetting tournament:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function findTournamentByDate(date) {
  try {
    const result = await pool.query(
      `SELECT id, name, date, status, location, format 
       FROM tournaments 
       WHERE date::text = $1 
       ORDER BY id DESC`,
      [date]
    );
    
    if (result.rows.length === 0) {
      console.error(`❌ No tournament found for date ${date}`);
      return null;
    }
    
    if (result.rows.length > 1) {
      console.log(`⚠️  Found ${result.rows.length} tournaments for date ${date}:`);
      result.rows.forEach((t, i) => {
        console.log(`   ${i + 1}. ID: ${t.id}, Name: "${t.name}", Status: ${t.status}`);
      });
      // Return the first one (most recent by ID)
      console.log(`   Using tournament ID ${result.rows[0].id}`);
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('❌ Error finding tournament:', error);
    return null;
  }
}

// Main execution
const args = process.argv.slice(2);
let tournamentId = null;
let date = null;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--date' && args[i + 1]) {
    date = args[i + 1];
    i++;
  } else if (!isNaN(parseInt(args[i]))) {
    tournamentId = parseInt(args[i]);
  }
}

async function main() {
  try {
    // If date provided, find tournament by date
    if (date && !tournamentId) {
      console.log(`🔍 Looking for tournament on date ${date}...`);
      const tournament = await findTournamentByDate(date);
      if (!tournament) {
        process.exit(1);
      }
      tournamentId = tournament.id;
      console.log(`✅ Found tournament: "${tournament.name}" (ID: ${tournamentId})\n`);
    }
    
    if (!tournamentId) {
      console.error('Usage: node scripts/database/reset-tournament-to-ongoing.js <tournament_id>');
      console.error('   or: node scripts/database/reset-tournament-to-ongoing.js --date 2025-11-16');
      console.error('Example: node scripts/database/reset-tournament-to-ongoing.js 4');
      console.error('Example: node scripts/database/reset-tournament-to-ongoing.js --date 2025-11-16');
      process.exit(1);
    }
    
    await resetTournamentToOngoing(tournamentId);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

