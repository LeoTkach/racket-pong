const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function renameAchievements() {
    try {
        console.log('Connecting to database...');

        await pool.query('BEGIN');

        // Rename Newcomer to Nature Walker
        console.log('Renaming "Newcomer" to "Nature Walker"...');
        const newcomerResult = await pool.query(`
      UPDATE achievements
      SET name = 'Nature Walker'
      WHERE name = 'Newcomer'
      RETURNING *
    `);

        if (newcomerResult.rowCount > 0) {
            console.log('✅ Successfully renamed Newcomer:');
            console.log(newcomerResult.rows[0]);
        } else {
            console.log('⚠️  No achievement found with name "Newcomer"');
        }

        // Rename Veteran to Forest Guardian
        console.log('\nRenaming "Veteran" to "Forest Guardian"...');
        const veteranResult = await pool.query(`
      UPDATE achievements
      SET name = 'Forest Guardian'
      WHERE name = 'Veteran'
      RETURNING *
    `);

        if (veteranResult.rowCount > 0) {
            console.log('✅ Successfully renamed Veteran:');
            console.log(veteranResult.rows[0]);
        } else {
            console.log('⚠️  No achievement found with name "Veteran"');
        }

        await pool.query('COMMIT');
        console.log('\n✅ Transaction committed successfully');

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Error renaming achievements:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

renameAchievements()
    .then(() => {
        console.log('\nScript completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
