// Script to reset tournament: delete matches, set status to upcoming, and restart backend
// Usage: node scripts/database/reset-tournament-to-upcoming.js <tournament_id>

const { Pool } = require('pg');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
require('dotenv').config();

const execAsync = promisify(exec);

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function deleteTournamentMatches(tournamentId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log(`\n🗑️  Deleting matches for tournament ${tournamentId}...`);
    
    // Delete match_scores first (foreign key constraint)
    const scoresResult = await client.query(
      'DELETE FROM match_scores WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = $1)',
      [tournamentId]
    );
    console.log(`   Deleted ${scoresResult.rowCount} match scores`);
    
    // Delete matches
    const matchesResult = await client.query(
      'DELETE FROM matches WHERE tournament_id = $1',
      [tournamentId]
    );
    console.log(`   Deleted ${matchesResult.rowCount} matches`);
    
    await client.query('COMMIT');
    console.log(`✅ All matches deleted successfully\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error deleting matches:', error);
    throw error;
  } finally {
    client.release();
  }
}

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
      return false;
    }
    
    const tournament = currentTournament.rows[0];
    const oldStatus = tournament.status;
    
    console.log(`🔄 Updating tournament status...`);
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
      return false;
    }
    
    // Update status
    await client.query(`
      UPDATE tournaments 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [newStatus, tournamentId]);
    
    await client.query('COMMIT');
    
    console.log(`✅ Tournament status updated: ${oldStatus} → ${newStatus}\n`);
    return true;
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating tournament status:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function restartBackend() {
  console.log('🔄 Restarting backend...');
  const backendDir = path.join(__dirname, '../..');
  const restartScript = path.join(backendDir, 'restart-backend.sh');
  
  try {
    // Stop backend
    console.log('   Stopping backend...');
    try {
      await execAsync('lsof -ti:3003 | xargs kill 2>/dev/null || true');
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      // Ignore errors if process not found
    }
    
    // Start backend in background
    console.log('   Starting backend...');
    const { spawn } = require('child_process');
    const backendProcess = spawn('npm', ['run', 'server'], {
      cwd: backendDir,
      detached: true,
      stdio: 'ignore'
    });
    backendProcess.unref();
    
    console.log('✅ Backend restart initiated\n');
    
  } catch (error) {
    console.error('❌ Error restarting backend:', error);
    throw error;
  }
}

async function resetTournament(tournamentId) {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔄 RESETTING TOURNAMENT TO UPCOMING');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Step 1: Delete matches
    await deleteTournamentMatches(tournamentId);
    
    // Step 2: Update status to upcoming
    const statusUpdated = await updateTournamentStatus(tournamentId, 'upcoming');
    if (!statusUpdated) {
      console.error('❌ Failed to update tournament status');
      return;
    }
    
    // Step 3: Restart backend
    await restartBackend();
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ TOURNAMENT RESET COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

// Main execution
const tournamentId = process.argv[2];

if (!tournamentId) {
  console.error('Usage: node scripts/database/reset-tournament-to-upcoming.js <tournament_id>');
  console.error('Example: node scripts/database/reset-tournament-to-upcoming.js 1');
  process.exit(1);
}

resetTournament(parseInt(tournamentId))
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    pool.end();
    process.exit(1);
  });





