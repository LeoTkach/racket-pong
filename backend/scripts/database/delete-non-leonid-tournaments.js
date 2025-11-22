// Script to delete all tournaments NOT organized by Leonid Tkach
// Usage: node scripts/database/delete-non-leonid-tournaments.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function deleteNonLeonidTournaments() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Find Leonid Tkach's ID
    const leonidResult = await client.query(`
      SELECT id, username, full_name 
      FROM players 
      WHERE LOWER(full_name) LIKE '%leonid%tkach%' 
         OR LOWER(username) LIKE '%leonid%tkach%'
         OR LOWER(full_name) = 'leonid tkach'
         OR LOWER(username) = 'leonid_tkach'
      LIMIT 1
    `);
    
    if (leonidResult.rows.length === 0) {
      console.error('❌ Leonid Tkach not found in database');
      await client.query('ROLLBACK');
      return;
    }
    
    const leonidId = leonidResult.rows[0].id;
    const leonidName = leonidResult.rows[0].full_name || leonidResult.rows[0].username;
    console.log(`\n✅ Found Leonid Tkach:`);
    console.log(`   ID: ${leonidId}`);
    console.log(`   Name: ${leonidName}\n`);
    
    // Find all tournaments NOT organized by Leonid Tkach
    const tournamentsToDelete = await client.query(`
      SELECT id, name, date, organizer_id,
             (SELECT full_name FROM players WHERE id = organizer_id) as organizer_name
      FROM tournaments
      WHERE organizer_id IS NULL OR organizer_id != $1
      ORDER BY id
    `, [leonidId]);
    
    console.log(`📊 Found ${tournamentsToDelete.rows.length} tournaments to delete (not organized by Leonid Tkach)`);
    
    if (tournamentsToDelete.rows.length === 0) {
      console.log(`✅ No tournaments to delete. All tournaments are organized by Leonid Tkach.\n`);
      await client.query('COMMIT');
      return;
    }
    
    // Show tournaments to be deleted
    console.log(`\n🗑️  Tournaments to be deleted:`);
    tournamentsToDelete.rows.forEach((t, idx) => {
      console.log(`   ${idx + 1}. ID: ${t.id}, Name: "${t.name}", Date: ${t.date}, Organizer: ${t.organizer_name || 'NULL'}`);
    });
    
    const tournamentIds = tournamentsToDelete.rows.map(t => t.id);
    
    // Count related data before deletion
    const matchesCount = await client.query(`
      SELECT COUNT(*) as count FROM matches WHERE tournament_id = ANY($1::int[])
    `, [tournamentIds]);
    
    const scoresCount = await client.query(`
      SELECT COUNT(*) as count FROM match_scores 
      WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ANY($1::int[]))
    `, [tournamentIds]);
    
    const standingsCount = await client.query(`
      SELECT COUNT(*) as count FROM tournament_standings WHERE tournament_id = ANY($1::int[])
    `, [tournamentIds]);
    
    const participantsCount = await client.query(`
      SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = ANY($1::int[])
    `, [tournamentIds]);
    
    console.log(`\n📊 Related data to be deleted:`);
    console.log(`   - Matches: ${matchesCount.rows[0].count}`);
    console.log(`   - Match scores: ${scoresCount.rows[0].count}`);
    console.log(`   - Tournament standings: ${standingsCount.rows[0].count}`);
    console.log(`   - Tournament participants: ${participantsCount.rows[0].count}`);
    
    // Delete match scores first (foreign key constraint)
    const deletedScores = await client.query(`
      DELETE FROM match_scores 
      WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ANY($1::int[]))
    `, [tournamentIds]);
    console.log(`\n✅ Deleted ${deletedScores.rowCount} match score records`);
    
    // Delete matches (will cascade from tournaments, but doing explicitly for clarity)
    const deletedMatches = await client.query(`
      DELETE FROM matches WHERE tournament_id = ANY($1::int[])
    `, [tournamentIds]);
    console.log(`✅ Deleted ${deletedMatches.rowCount} match records`);
    
    // Delete tournament standings
    const deletedStandings = await client.query(`
      DELETE FROM tournament_standings WHERE tournament_id = ANY($1::int[])
    `, [tournamentIds]);
    console.log(`✅ Deleted ${deletedStandings.rowCount} tournament standings records`);
    
    // Delete tournament participants
    const deletedParticipants = await client.query(`
      DELETE FROM tournament_participants WHERE tournament_id = ANY($1::int[])
    `, [tournamentIds]);
    console.log(`✅ Deleted ${deletedParticipants.rowCount} tournament participant records`);
    
    // Delete tournaments
    const deletedTournaments = await client.query(`
      DELETE FROM tournaments WHERE id = ANY($1::int[])
    `, [tournamentIds]);
    console.log(`✅ Deleted ${deletedTournaments.rowCount} tournament records`);
    
    // Verify: Count remaining tournaments
    const remainingTournaments = await client.query(`
      SELECT COUNT(*) as count FROM tournaments WHERE organizer_id = $1
    `, [leonidId]);
    
    console.log(`\n✅ Deletion complete!`);
    console.log(`   Remaining tournaments organized by Leonid Tkach: ${remainingTournaments.rows[0].count}\n`);
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error deleting tournaments:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
deleteNonLeonidTournaments()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    pool.end();
    process.exit(1);
  });



