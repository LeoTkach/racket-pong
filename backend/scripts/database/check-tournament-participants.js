const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'table_tennis_tournament',
  user: process.env.DB_USER || 'leonidtkach',
  password: process.env.DB_PASSWORD || '',
});

async function checkAndUpdateParticipants() {
  try {
    const tournamentId = 12;
    
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        current_participants, 
        max_participants,
        (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = tournaments.id) as actual_count
      FROM tournaments 
      WHERE id = $1
    `, [tournamentId]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Tournament ${tournamentId} not found`);
      return;
    }
    
    const tournament = result.rows[0];
    console.log('Tournament:', tournament.name);
    console.log(`  current_participants: ${tournament.current_participants}`);
    console.log(`  actual_count: ${tournament.actual_count}`);
    
    if (parseInt(tournament.current_participants) !== parseInt(tournament.actual_count)) {
      console.log('⚠️  Mismatch! Updating current_participants...');
      await pool.query(
        'UPDATE tournaments SET current_participants = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [tournament.actual_count, tournamentId]
      );
      console.log('✅ Updated!');
    } else {
      console.log('✅ Counts match!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAndUpdateParticipants();





