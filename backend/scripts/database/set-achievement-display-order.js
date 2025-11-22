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

async function setDisplayOrder() {
  try {
    console.log('🔄 Setting display order for achievements...\n');

    // Add display_order column if it doesn't exist
    await pool.query(`
      ALTER TABLE achievements ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 999
    `);
    console.log('✅ Added display_order column (if needed)\n');

    // Set display order for achievements according to the specified order
    const orderMap = {
      'Newcomer': 1,
      'Veteran': 2,
      'Jungle Explorer': 3,
      'First Victory': 4,
      'Legend': 5,
      'Match Master': 6,
      'Regular Player': 7,
      'Community Member': 8,
      'Tournament Enthusiast': 9,
      'Path Finder': 10,
      'Social Butterfly': 11,
      'Perfect Game': 12,
      'Comeback King': 13,
      'Undefeated': 14,
      'Champion': 15,
      'Win Streak': 16,
      'Paper Champion': 17,
      'Lightning Fast': 18
    };

    for (const [name, order] of Object.entries(orderMap)) {
      const result = await pool.query(`
        UPDATE achievements 
        SET display_order = $1
        WHERE name = $2
        RETURNING name, display_order
      `, [order, name]);

      if (result.rowCount > 0) {
        console.log(`✅ Set display_order ${order} for: ${name}`);
      } else {
        console.log(`⚠️  Achievement not found: ${name}`);
      }
    }

    console.log('\n🎉 Display order set successfully!');

  } catch (error) {
    console.error('❌ Error setting display order:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run
setDisplayOrder();

