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

async function renameSocialButterflyToScout() {
    try {
        console.log('Renaming "Social Butterfly" to "Scout"...');

        // Update achievement name
        const result = await pool.query(`
      UPDATE achievements 
      SET name = 'Scout'
      WHERE name = 'Social Butterfly'
      RETURNING id, name, description
    `);

        if (result.rows.length > 0) {
            console.log('✅ Successfully updated achievement:');
            console.log(`   ID: ${result.rows[0].id}`);
            console.log(`   Name: ${result.rows[0].name}`);
            console.log(`   Description: ${result.rows[0].description}`);
        } else {
            console.log('⚠️  No achievement found with name "Social Butterfly"');
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
renameSocialButterflyToScout();
