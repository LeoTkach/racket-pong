const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'table_tennis_tournament',
  user: process.env.DB_USER || 'leonidtkach',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function setupStreaks() {
  try {
    console.log('🔧 Setting up streaks...\n');

    // Step 1: Add columns if they don't exist
    console.log('1️⃣ Adding streak columns to players table...');
    const addColumnsSQL = `
      ALTER TABLE players 
      ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
    `;
    await pool.query(addColumnsSQL);
    console.log('   ✅ Columns added\n');

    // Step 2: Create function
    console.log('2️⃣ Creating recalculate_player_streaks function...');
    const functionSQL = fs.readFileSync(
      path.join(__dirname, '../../database/update_player_streaks_function.sql'),
      'utf8'
    );
    await pool.query(functionSQL);
    console.log('   ✅ Function created\n');

    // Step 3: Recalculate for all players
    console.log('3️⃣ Recalculating streaks for all players...');
    const allPlayers = await pool.query('SELECT id, username, full_name FROM players');
    
    for (const p of allPlayers.rows) {
      try {
        await pool.query('SELECT recalculate_player_streaks($1)', [p.id]);
        const result = await pool.query(
          'SELECT current_streak, best_streak FROM players WHERE id = $1',
          [p.id]
        );
        const streaks = result.rows[0];
        console.log(`   ✅ ${p.username || p.full_name || `Player ${p.id}`}: current=${streaks.current_streak}, best=${streaks.best_streak}`);
      } catch (error) {
        console.error(`   ❌ Error for player ${p.id}:`, error.message);
      }
    }

    console.log('\n✨ Setup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  setupStreaks()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { setupStreaks };

