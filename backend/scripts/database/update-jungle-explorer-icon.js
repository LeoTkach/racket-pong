const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'table_tennis_tournament',
    user: process.env.DB_USER || 'leonidtkach',
    password: process.env.DB_PASSWORD || '',
});

async function updateJungleExplorerIcon() {
    try {
        console.log('Updating "Jungle Explorer" icon...');

        // Update achievement icon
        const result = await pool.query(`
      UPDATE achievements 
      SET icon_name = 'TreePine'
      WHERE name = 'Jungle Explorer'
      RETURNING id, name, icon_name
    `);

        if (result.rows.length > 0) {
            console.log('✅ Successfully updated achievement:');
            console.log(`   ID: ${result.rows[0].id}`);
            console.log(`   Name: ${result.rows[0].name}`);
            console.log(`   Icon: ${result.rows[0].icon_name}`);
        } else {
            console.log('⚠️  No achievement found with name "Jungle Explorer"');
        }

        console.log('\n🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Error updating achievement:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run migration
updateJungleExplorerIcon();
