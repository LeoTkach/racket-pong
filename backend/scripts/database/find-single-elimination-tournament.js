const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function findSingleEliminationTournament() {
  try {
    // Find single-elimination tournaments
    const result = await pool.query(`
      SELECT 
        t.id, 
        t.name, 
        t.status, 
        t.format, 
        t.current_participants,
        t.date,
        COUNT(tp.player_id) as actual_participants,
        COUNT(m.id) as match_count
      FROM tournaments t
      LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
      LEFT JOIN matches m ON t.id = m.tournament_id
      WHERE t.format = 'single-elimination'
      GROUP BY t.id, t.name, t.status, t.format, t.current_participants, t.date
      ORDER BY t.date DESC, t.id DESC
      LIMIT 5
    `);
    
    if (result.rows.length === 0) {
      console.log('No single-elimination tournaments found');
      return null;
    }
    
    console.log(`\nFound ${result.rows.length} single-elimination tournament(s):\n`);
    result.rows.forEach((tournament, index) => {
      console.log(`${index + 1}. Tournament ID: ${tournament.id}`);
      console.log(`   Name: "${tournament.name}"`);
      console.log(`   Status: ${tournament.status}`);
      console.log(`   Format: ${tournament.format}`);
      console.log(`   Participants: ${tournament.actual_participants}`);
      console.log(`   Matches: ${tournament.match_count}`);
      console.log(`   Date: ${tournament.date}`);
      console.log('');
    });
    
    // Return the first one
    return result.rows[0].id;
  } catch (error) {
    console.error('Error finding tournament:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

findSingleEliminationTournament()
  .then((tournamentId) => {
    if (tournamentId) {
      console.log(`\nUsing tournament ID: ${tournamentId}`);
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });





