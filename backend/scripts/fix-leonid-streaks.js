const pool = require('../server/config/database');

async function fixLeonidStreaks() {
  try {
    console.log('🔧 Fixing Leonid Tkach streaks...\n');

    // Get player data before fix
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
    console.log('📊 Before Fix:');
    console.log(`   Current Streak: ${player.current_streak}`);
    console.log(`   Best Streak: ${player.best_streak}`);
    console.log('');

    // Call recalculate_player_streaks function
    console.log('🔄 Recalculating streaks...');
    await pool.query('SELECT recalculate_player_streaks($1)', [player.id]);
    console.log('✅ Recalculation complete!');
    console.log('');

    // Get player data after fix
    const afterResult = await pool.query(`
      SELECT current_streak, best_streak
      FROM players
      WHERE id = $1
    `, [player.id]);

    const updatedPlayer = afterResult.rows[0];
    console.log('📊 After Fix:');
    console.log(`   Current Streak: ${updatedPlayer.current_streak}`);
    console.log(`   Best Streak: ${updatedPlayer.best_streak}`);
    console.log('');

    if (player.current_streak !== updatedPlayer.current_streak || 
        player.best_streak !== updatedPlayer.best_streak) {
      console.log('✅ Streaks updated successfully!');
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

fixLeonidStreaks();
