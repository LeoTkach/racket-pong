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

async function updateAchievementIcons() {
  try {
    console.log('🔄 Updating achievement icons...\n');
    
    // Update Newcomer icon to Leaf
    const result1 = await pool.query(`
      UPDATE achievements 
      SET icon_name = 'Leaf'
      WHERE name = 'Newcomer'
      RETURNING name, icon_name
    `);
    if (result1.rowCount > 0) {
      console.log(`✅ Updated: Newcomer -> Leaf icon`);
    }

    // Update Veteran icon to Tree
    const result2 = await pool.query(`
      UPDATE achievements 
      SET icon_name = 'Tree'
      WHERE name = 'Veteran'
      RETURNING name, icon_name
    `);
    if (result2.rowCount > 0) {
      console.log(`✅ Updated: Veteran -> Tree icon`);
    }

    console.log('\n🎉 Achievement icons updated successfully!');

  } catch (error) {
    console.error('❌ Error updating achievement icons:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run
updateAchievementIcons();



