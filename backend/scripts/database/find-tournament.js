// Script to find tournament by name or date
// Usage: node scripts/database/find-tournament.js <name> <date>

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function findTournament(name, date) {
  try {
    let query;
    let params;
    
    if (name && date) {
      query = `
        SELECT id, name, date, status, location, format
        FROM tournaments 
        WHERE LOWER(name) = LOWER($1) AND date::text LIKE $2
        ORDER BY id DESC
      `;
      params = [name, `${date}%`];
    } else if (name) {
      query = `
        SELECT id, name, date, status, location, format
        FROM tournaments 
        WHERE LOWER(name) = LOWER($1)
        ORDER BY date DESC, id DESC
      `;
      params = [name];
    } else if (date) {
      query = `
        SELECT id, name, date, status, location, format
        FROM tournaments 
        WHERE date::text LIKE $1
        ORDER BY id DESC
      `;
      params = [`${date}%`];
    } else {
      console.error('Please provide at least name or date');
      return;
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      console.log('❌ Tournament not found');
      return;
    }
    
    console.log(`\n✅ Found ${result.rows.length} tournament(s):\n`);
    result.rows.forEach(t => {
      console.log(`   ID: ${t.id}`);
      console.log(`   Name: ${t.name}`);
      console.log(`   Date: ${t.date}`);
      console.log(`   Status: ${t.status}`);
      console.log(`   Location: ${t.location || 'N/A'}`);
      console.log(`   Format: ${t.format || 'N/A'}`);
      console.log('');
    });
    
    return result.rows;
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

const name = process.argv[2];
const date = process.argv[3];

findTournament(name, date);





