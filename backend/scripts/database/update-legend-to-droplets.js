const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateLegendIcon() {
    try {
        console.log('Connecting to database...');

        await pool.query('BEGIN');

        console.log('Updating "Legend" icon to Droplets...');

        const result = await pool.query(`
      UPDATE achievements
      SET icon_name = 'Droplets'
      WHERE name = 'Legend'
      RETURNING *
    `);

        if (result.rowCount > 0) {
            console.log('✅ Successfully updated Legend icon:');
            console.log(result.rows[0]);
        } else {
            console.log('⚠️  No achievement found with name "Legend"');
        }

        await pool.query('COMMIT');
        console.log('✅ Transaction committed successfully');

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Error updating Legend icon:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

updateLegendIcon()
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
