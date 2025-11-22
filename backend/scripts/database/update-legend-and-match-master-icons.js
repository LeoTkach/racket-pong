const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateIcons() {
    try {
        console.log('Connecting to database...');

        await pool.query('BEGIN');

        // Update Legend to Sparkles (bubbles)
        console.log('Updating "Legend" icon to Sparkles...');
        const legendResult = await pool.query(`
      UPDATE achievements
      SET icon_name = 'Sparkles'
      WHERE name = 'Legend'
      RETURNING *
    `);

        if (legendResult.rowCount > 0) {
            console.log('✅ Successfully updated Legend icon:');
            console.log(legendResult.rows[0]);
        } else {
            console.log('⚠️  No achievement found with name "Legend"');
        }

        // Update Match Master to Planet (custom SVG)
        console.log('\nUpdating "Match Master" icon to Planet...');
        const matchMasterResult = await pool.query(`
      UPDATE achievements
      SET icon_name = 'Planet'
      WHERE name = 'Match Master'
      RETURNING *
    `);

        if (matchMasterResult.rowCount > 0) {
            console.log('✅ Successfully updated Match Master icon:');
            console.log(matchMasterResult.rows[0]);
        } else {
            console.log('⚠️  No achievement found with name "Match Master"');
        }

        await pool.query('COMMIT');
        console.log('\n✅ Transaction committed successfully');

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Error updating icons:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

updateIcons()
    .then(() => {
        console.log('\nScript completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
