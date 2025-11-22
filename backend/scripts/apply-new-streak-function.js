const pool = require('../server/config/database');
const fs = require('fs');
const path = require('path');

async function applyNewStreakFunction() {
  try {
    console.log('🔧 Applying updated streak calculation function...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, '../database/update_player_streaks_function.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Apply the function
    console.log('📝 Creating/updating function...');
    await pool.query(sql);
    console.log('✅ Function updated successfully!');
    console.log('');

    // Get Leonid's data before recalculation
    const beforeResult = await pool.query(`
      SELECT id, username, current_streak, best_streak
      FROM players
      WHERE username = 'leonidtkach'
    `);

    if (beforeResult.rows.length === 0) {
      console.log('❌ Player not found');
      return;
    }

    const player = beforeResult.rows[0];
    console.log('📊 Before Recalculation:');
    console.log(`   Current Streak: ${player.current_streak}`);
    console.log(`   Best Streak: ${player.best_streak}`);
    console.log('');

    // Recalculate streaks
    console.log('🔄 Recalculating streaks with improved function...');
    await pool.query('SELECT recalculate_player_streaks($1)', [player.id]);
    console.log('✅ Recalculation complete!');
    console.log('');

    // Get updated data
    const afterResult = await pool.query(`
      SELECT current_streak, best_streak
      FROM players
      WHERE id = $1
    `, [player.id]);

    const updatedPlayer = afterResult.rows[0];
    console.log('📊 After Recalculation:');
    console.log(`   Current Streak: ${updatedPlayer.current_streak}`);
    console.log(`   Best Streak: ${updatedPlayer.best_streak}`);
    console.log('');

    if (player.current_streak !== updatedPlayer.current_streak || 
        player.best_streak !== updatedPlayer.best_streak) {
      console.log('✅ Streaks updated successfully!');
      console.log(`   Current: ${player.current_streak} → ${updatedPlayer.current_streak}`);
      console.log(`   Best: ${player.best_streak} → ${updatedPlayer.best_streak}`);
    } else {
      console.log('ℹ️  No changes needed.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

applyNewStreakFunction();
