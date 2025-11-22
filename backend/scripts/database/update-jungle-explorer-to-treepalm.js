const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateJungleExplorerIcon() {
    try {
        console.log('Connecting to database...');

        await pool.query('BEGIN');

        console.log('Updating "Jungle Explorer" icon to TreePalm...');

        const result = await pool.query(`
      UPDATE achievements
      SET icon_name = 'TreePalm'
      WHERE name = 'Jungle Explorer'
      RETURNING *
    `);

        if (result.rowCount > 0) {
            console.log('✅ Successfully updated Jungle Explorer icon:');
            console.log(result.rows[0]);
        } else {
            console.log('⚠️  No achievement found with name "Jungle Explorer"');
        }

        await pool.query('COMMIT');
        console.log('✅ Transaction committed successfully');

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Error updating Jungle Explorer icon:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

updateJungleExplorerIcon()
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
