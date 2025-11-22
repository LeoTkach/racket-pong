const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'table_tennis_tournament',
  user: process.env.DB_USER || 'leonidtkach',
  password: process.env.DB_PASSWORD || '',
});

async function checkTournaments() {
  try {
    // Find tournaments with max 8 participants
    const result = await pool.query(`
      SELECT 
        t.id, 
        t.name, 
        t.date,
        t.time,
        t.max_participants,
        t.current_participants,
        COUNT(tp.player_id) as actual_count
      FROM tournaments t
      LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
      WHERE t.max_participants = 8
      GROUP BY t.id
      ORDER BY t.date DESC
    `);
    
    console.log('Tournaments with max 8 participants:');
    result.rows.forEach(t => {
      console.log(`\nID: ${t.id}`);
      console.log(`  Name: ${t.name}`);
      console.log(`  Date: ${t.date}`);
      console.log(`  Time: ${t.time}`);
      console.log(`  Max: ${t.max_participants}`);
      console.log(`  Current: ${t.current_participants}`);
      console.log(`  Actual count: ${t.actual_count}`);
    });
    
    // Check for tournament on 2025-11-21
    const nov21 = await pool.query(`
      SELECT 
        t.id, 
        t.name, 
        t.date,
        t.time,
        t.max_participants,
        t.current_participants,
        COUNT(tp.player_id) as actual_count
      FROM tournaments t
      LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
      WHERE t.date = '2025-11-21'
      GROUP BY t.id
    `);
    
    console.log('\n\nTournaments on 2025-11-21:');
    nov21.rows.forEach(t => {
      console.log(`\nID: ${t.id}`);
      console.log(`  Name: ${t.name}`);
      console.log(`  Date: ${t.date}`);
      console.log(`  Time: ${t.time}`);
      console.log(`  Max: ${t.max_participants}`);
      console.log(`  Current: ${t.current_participants}`);
      console.log(`  Actual count: ${t.actual_count}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkTournaments();





