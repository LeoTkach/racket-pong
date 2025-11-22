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

async function updateThreeAchievementIcons() {
    try {
        console.log('Updating achievement icons...\n');

        const updates = [
            { name: 'First Victory', icon: 'Sparkles' },
            { name: 'Legend', icon: 'Bubbles' },
            { name: 'Match Master', icon: 'Planet' }
        ];

        for (const update of updates) {
            const result = await pool.query(`
        UPDATE achievements 
        SET icon_name = $1
        WHERE name = $2
        RETURNING id, name, icon_name
      `, [update.icon, update.name]);

            if (result.rows.length > 0) {
                console.log(`✅ Updated ${result.rows[0].name}:`);
                console.log(`   Icon: ${result.rows[0].icon_name}`);
            } else {
                console.log(`⚠️  Achievement "${update.name}" not found`);
            }
        }

        console.log('\n🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Error updating achievements:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run migration
updateThreeAchievementIcons();
