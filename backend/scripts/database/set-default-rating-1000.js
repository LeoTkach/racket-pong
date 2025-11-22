// Script to set default rating to 1000 for all players
// Updates existing players with rating < 1000 or NULL to 1000
// Also ensures database default is 1000
// Usage: node scripts/database/set-default-rating-1000.js

const pool = require('../../server/config/database');
require('dotenv').config();

async function setDefaultRating1000() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔄 Setting default rating to 1000 for all players...\n');
    
    // 1. Update database default value for rating column
    console.log('1. Updating database default value...');
    await client.query(`
      ALTER TABLE players 
      ALTER COLUMN rating SET DEFAULT 1000
    `);
    console.log('   ✅ Default value set to 1000\n');
    
    // 2. Update all existing players with rating < 1000 or NULL to 1000
    console.log('2. Updating existing players...');
    const updateResult = await client.query(`
      UPDATE players 
      SET rating = 1000, updated_at = CURRENT_TIMESTAMP
      WHERE rating IS NULL OR rating < 1000
      RETURNING id, username, full_name, rating
    `);
    
    console.log(`   ✅ Updated ${updateResult.rowCount} player(s) to rating 1000`);
    if (updateResult.rowCount > 0) {
      console.log('   Updated players:');
      updateResult.rows.forEach(p => {
        console.log(`      - ${p.full_name || p.username} (ID: ${p.id})`);
      });
    }
    console.log('');
    
    // 3. Verify all players now have rating >= 1000
    const verifyResult = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE rating IS NULL OR rating < 1000) as below_1000
      FROM players
    `);
    
    const stats = verifyResult.rows[0];
    console.log('3. Verification:');
    console.log(`   Total players: ${stats.total}`);
    console.log(`   Players with rating < 1000: ${stats.below_1000}`);
    
    if (parseInt(stats.below_1000) === 0) {
      console.log('   ✅ All players have rating >= 1000!\n');
    } else {
      console.log(`   ⚠️  ${stats.below_1000} player(s) still have rating < 1000\n`);
    }
    
    await client.query('COMMIT');
    console.log('✅ Default rating set to 1000 successfully!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error setting default rating:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
setDefaultRating1000()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    pool.end();
    process.exit(1);
  });



