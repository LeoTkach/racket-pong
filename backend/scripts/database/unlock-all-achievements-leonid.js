const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function unlockAllAchievementsForLeonid() {
  try {
    console.log('🔍 Finding Leonid Tkach...');
    
    // Find player by username or full_name
    const playerResult = await pool.query(
      'SELECT id, username, full_name FROM players WHERE username ILIKE $1 OR full_name ILIKE $2 OR username ILIKE $3',
      ['%leonid%', '%Leonid Tkach%', 'leonidtkach']
    );
    
    if (playerResult.rows.length === 0) {
      console.error('❌ Player Leonid Tkach not found!');
      return;
    }
    
    const player = playerResult.rows[0];
    console.log(`✅ Found player: ${player.full_name} (ID: ${player.id}, username: ${player.username})\n`);
    
    // Get all achievements
    console.log('📋 Fetching all achievements...');
    const achievementsResult = await pool.query(
      'SELECT id, name, description, rarity FROM achievements ORDER BY id'
    );
    
    if (achievementsResult.rows.length === 0) {
      console.error('❌ No achievements found in database!');
      return;
    }
    
    const allAchievements = achievementsResult.rows;
    console.log(`✅ Found ${allAchievements.length} achievements\n`);
    
    // Get already unlocked achievements
    const unlockedResult = await pool.query(
      'SELECT achievement_id FROM player_achievements WHERE player_id = $1',
      [player.id]
    );
    
    const unlockedIds = new Set(unlockedResult.rows.map(row => row.achievement_id));
    console.log(`📊 Already unlocked: ${unlockedIds.size} achievements\n`);
    
    // Unlock all achievements
    let unlockedCount = 0;
    let alreadyUnlockedCount = 0;
    let errorCount = 0;
    
    console.log('🔓 Unlocking achievements...\n');
    
    for (const achievement of allAchievements) {
      if (unlockedIds.has(achievement.id)) {
        console.log(`   ⏭️  "${achievement.name}" - already unlocked`);
        alreadyUnlockedCount++;
        continue;
      }
      
      try {
        await pool.query(
          'INSERT INTO player_achievements (player_id, achievement_id) VALUES ($1, $2) ON CONFLICT (player_id, achievement_id) DO NOTHING',
          [player.id, achievement.id]
        );
        console.log(`   ✅ Unlocked: "${achievement.name}" (${achievement.rarity})`);
        unlockedCount++;
      } catch (error) {
        console.error(`   ❌ Error unlocking "${achievement.name}":`, error.message);
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(50));
    console.log(`   Total achievements: ${allAchievements.length}`);
    console.log(`   ✅ Newly unlocked: ${unlockedCount}`);
    console.log(`   ⏭️  Already unlocked: ${alreadyUnlockedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   🎯 Total unlocked: ${unlockedIds.size + unlockedCount}/${allAchievements.length}`);
    console.log('='.repeat(50));
    
    if (unlockedCount > 0) {
      console.log('\n🎉 Successfully unlocked all achievements for Leonid Tkach!');
    } else if (alreadyUnlockedCount === allAchievements.length) {
      console.log('\n✨ All achievements were already unlocked!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

unlockAllAchievementsForLeonid();



