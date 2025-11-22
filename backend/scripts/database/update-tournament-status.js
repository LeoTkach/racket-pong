// Script to update tournament status
// Usage: node scripts/update-tournament-status.js <tournament_id> <new_status>

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function updateTournamentStatus(tournamentId, newStatus) {
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
    
    console.log(`\n🔄 Updating tournament status...`);
    console.log(`   Tournament ID: ${tournamentId}`);
    console.log(`   Tournament Name: "${tournament.name}"`);
    console.log(`   Current Status: ${oldStatus}`);
    console.log(`   New Status: ${newStatus}`);
    
    // Validate status
    const validStatuses = ['upcoming', 'scheduled', 'ongoing', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      console.error(`❌ Invalid status: ${newStatus}`);
      console.error(`   Valid statuses: ${validStatuses.join(', ')}`);
      await client.query('ROLLBACK');
      return;
    }
    
    // Update status
    const result = await client.query(`
      UPDATE tournaments 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [newStatus, tournamentId]);
    
    await client.query('COMMIT');
    
    console.log(`✅ Tournament status updated successfully!`);
    console.log(`   ${oldStatus} → ${newStatus}`);
    console.log(`\n`);
    
    // Show warning if going from ongoing to upcoming
    if (oldStatus === 'ongoing' && newStatus === 'upcoming') {
      console.log(`⚠️  WARNING: Tournament was moved from 'ongoing' to 'upcoming'`);
      console.log(`   - Existing matches will remain in database`);
      console.log(`   - When tournament is started again, matches should be regenerated`);
      console.log(`   - Consider deleting existing matches if needed\n`);
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating tournament status:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
const tournamentId = process.argv[2];
const newStatus = process.argv[3];

if (!tournamentId || !newStatus) {
  console.error('Usage: node scripts/update-tournament-status.js <tournament_id> <new_status>');
  console.error('Example: node scripts/update-tournament-status.js 1 upcoming');
  console.error('\nValid statuses: upcoming, scheduled, ongoing, completed, cancelled');
  process.exit(1);
}

updateTournamentStatus(parseInt(tournamentId), newStatus)
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    pool.end();
    process.exit(1);
  });
