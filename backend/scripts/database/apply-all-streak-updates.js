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

async function applyAllStreakUpdates() {
  try {
    console.log('🔧 Applying all streak updates...\n');

    // Step 1: Add columns
    console.log('1️⃣ Adding streak columns...');
    await pool.query(`
      ALTER TABLE players 
      ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
    `);
    console.log('   ✅ Done\n');

    // Step 2: Create function
    console.log('2️⃣ Creating recalculate_player_streaks function...');
    const functionSQL = fs.readFileSync(
      path.join(__dirname, '../../database/update_player_streaks_function.sql'),
      'utf8'
    );
    await pool.query(functionSQL);
    console.log('   ✅ Done\n');

    // Step 3: Update trigger to include streak recalculation
    console.log('3️⃣ Updating trigger...');
    const triggerSQL = fs.readFileSync(
      path.join(__dirname, '../../database/update_player_wins_losses_trigger.sql'),
      'utf8'
    );
    await pool.query(triggerSQL);
    console.log('   ✅ Done\n');

    // Step 4: Recalculate for all players
    console.log('4️⃣ Recalculating streaks for all players...');
    const allPlayers = await pool.query('SELECT id, username, full_name FROM players');
    
    for (const p of allPlayers.rows) {
      try {
        await pool.query('SELECT recalculate_player_streaks($1)', [p.id]);
        const result = await pool.query(
          'SELECT current_streak, best_streak FROM players WHERE id = $1',
          [p.id]
        );
        const streaks = result.rows[0];
        if (streaks.current_streak > 0 || streaks.best_streak > 0) {
          console.log(`   ✅ ${p.username || p.full_name || `Player ${p.id}`}: current=${streaks.current_streak}, best=${streaks.best_streak}`);
        }
      } catch (error) {
        console.error(`   ❌ Error for player ${p.id}:`, error.message);
      }
    }

    // Step 5: Check specific player (leonidtkach, ID 5)
    console.log('\n5️⃣ Checking leonidtkach (ID: 5)...');
    const check = await pool.query(`
      SELECT id, username, full_name, current_streak, best_streak, wins, losses
      FROM players WHERE id = 5
    `);
    if (check.rows.length > 0) {
      const p = check.rows[0];
      console.log(`   Username: ${p.username}`);
      console.log(`   current_streak: ${p.current_streak}`);
      console.log(`   best_streak: ${p.best_streak}`);
      console.log(`   wins: ${p.wins}, losses: ${p.losses}`);
    }

    console.log('\n✨ All updates applied successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('   3. Check the profile page again');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  applyAllStreakUpdates()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { applyAllStreakUpdates };

