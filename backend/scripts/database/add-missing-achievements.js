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

async function addMissingAchievements() {
  try {
    console.log('Adding missing achievements...');

    // All 18 achievements
    const achievements = [
      { name: 'First Victory', description: 'Win your first tournament match', rarity: 'common', icon_name: 'Swords' },
      { name: 'Win Streak', description: 'Win 5 matches in a row', rarity: 'rare', icon_name: 'Flame' },
      { name: 'Paper Champion', description: 'Reach the tournament final but lose', rarity: 'epic', icon_name: 'Medal' },
      { name: 'Champion', description: 'Win a professional tournament', rarity: 'legendary', icon_name: 'Crown' },
      { name: 'Perfect Game', description: 'Win a match 3-0', rarity: 'rare', icon_name: 'Star' },
      { name: 'Lightning Fast', description: 'Win 3 matches in a single tournament', rarity: 'uncommon', icon_name: 'Zap' },
      { name: 'Newcomer', description: 'Play for 1 week', rarity: 'common', icon_name: 'Leaf' },
      { name: 'Regular Player', description: 'Play in 3 tournaments', rarity: 'uncommon', icon_name: 'Shield' },
      { name: 'Veteran', description: 'Play for 1 month', rarity: 'rare', icon_name: 'Tree' },
      { name: 'Jungle Explorer', description: 'Play for 3 months', rarity: 'rare', icon_name: 'TreePalm' },
      { name: 'Legend', description: 'Win 10 tournament matches', rarity: 'legendary', icon_name: 'Sparkles' },
      { name: 'Community Member', description: 'Join 5 tournaments', rarity: 'common', icon_name: 'Users' },
      { name: 'Tournament Enthusiast', description: 'Join 10 tournaments', rarity: 'epic', icon_name: 'Heart' },
      { name: 'Match Master', description: 'Achieve 30 wins in tournament matches', rarity: 'rare', icon_name: 'Target' },
      { name: 'Path Finder', description: 'Complete all tournament formats', rarity: 'uncommon', icon_name: 'Target' },
      { name: 'Comeback King', description: 'Win after being 2-0 down', rarity: 'epic', icon_name: 'Rocket' },
      { name: 'Undefeated', description: 'Win a tournament without losing a single set', rarity: 'legendary', icon_name: 'Shield' },
      { name: 'Scout', description: 'Play against 10 different opponents', rarity: 'uncommon', icon_name: 'Users' }
    ];

    let added = 0;
    let skipped = 0;

    for (const achievement of achievements) {
      // Check if achievement already exists
      const checkResult = await pool.query(
        'SELECT id FROM achievements WHERE name = $1',
        [achievement.name]
      );

      if (checkResult.rows.length === 0) {
        // Insert new achievement
        await pool.query(`
          INSERT INTO achievements (name, description, rarity, icon_name)
          VALUES ($1, $2, $3, $4)
        `, [achievement.name, achievement.description, achievement.rarity, achievement.icon_name]);
        console.log(`✅ Added: ${achievement.name}`);
        added++;
      } else {
        console.log(`⏭️  Skipped (already exists): ${achievement.name}`);
        skipped++;
      }
    }

    console.log(`\n🎉 Done! Added ${added} achievements, skipped ${skipped} existing ones.`);
    console.log(`Total achievements in database should now be 18.`);

  } catch (error) {
    console.error('❌ Error adding achievements:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run
addMissingAchievements();

