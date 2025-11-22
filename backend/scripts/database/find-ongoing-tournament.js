const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function findOngoingTournament() {
  try {
    const result = await pool.query(`
      SELECT id, name, status, format, current_participants, date
      FROM tournaments
      WHERE status = 'ongoing'
      ORDER BY date DESC
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.log('No ongoing tournament found');
      // Try to find the most recent tournament
      const recentResult = await pool.query(`
        SELECT id, name, status, format, current_participants, date
        FROM tournaments
        ORDER BY date DESC, id DESC
        LIMIT 1
      `);
      
      if (recentResult.rows.length > 0) {
        const tournament = recentResult.rows[0];
        console.log(`\nMost recent tournament:`);
        console.log(`  ID: ${tournament.id}`);
        console.log(`  Name: "${tournament.name}"`);
        console.log(`  Status: ${tournament.status}`);
        console.log(`  Format: ${tournament.format}`);
        console.log(`  Participants: ${tournament.current_participants}`);
        console.log(`  Date: ${tournament.date}`);
        return tournament.id;
      } else {
        console.log('No tournaments found in database');
        return null;
      }
    } else {
      const tournament = result.rows[0];
      console.log(`\nOngoing tournament found:`);
      console.log(`  ID: ${tournament.id}`);
      console.log(`  Name: "${tournament.name}"`);
      console.log(`  Status: ${tournament.status}`);
      console.log(`  Format: ${tournament.format}`);
      console.log(`  Participants: ${tournament.current_participants}`);
      console.log(`  Date: ${tournament.date}`);
      return tournament.id;
    }
  } catch (error) {
    console.error('Error finding tournament:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

findOngoingTournament()
  .then((tournamentId) => {
    if (tournamentId) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });





