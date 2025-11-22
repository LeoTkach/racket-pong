const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'table_tennis_tournament',
    user: process.env.DB_USER || 'leonidtkach',
    password: process.env.DB_PASSWORD || '',
});

async function checkJungleExplorer() {
    try {
        const result = await pool.query(`
      SELECT id, name, icon_name 
      FROM achievements 
      WHERE name = 'Jungle Explorer'
    `);

        if (result.rows.length > 0) {
            console.log('Current Jungle Explorer achievement:');
            console.log(result.rows[0]);
        } else {
            console.log('Jungle Explorer not found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkJungleExplorer();
