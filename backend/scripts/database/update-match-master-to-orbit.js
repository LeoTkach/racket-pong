const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateMatchMasterIcon() {
    try {
        console.log('Connecting to database...');

        await pool.query('BEGIN');

        console.log('Updating "Match Master" icon to Orbit...');

        const result = await pool.query(`
      UPDATE achievements
      SET icon_name = 'Orbit'
      WHERE name = 'Match Master'
      RETURNING *
    `);

        if (result.rowCount > 0) {
            console.log('✅ Successfully updated Match Master icon:');
            console.log(result.rows[0]);
        } else {
            console.log('⚠️  No achievement found with name "Match Master"');
        }

        await pool.query('COMMIT');
        console.log('✅ Transaction committed successfully');

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Error updating Match Master icon:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

updateMatchMasterIcon()
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
