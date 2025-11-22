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

async function updateAchievements() {
  try {
    console.log('🔄 Updating achievements in database...\n');
    
    // Update Tournament Enthusiast: from 25 to 10 tournaments
    const result1 = await pool.query(`
      UPDATE achievements 
      SET description = 'Join 10 tournaments'
      WHERE name = 'Tournament Enthusiast'
      RETURNING name, description
    `);
    if (result1.rowCount > 0) {
      console.log(`✅ Updated: Tournament Enthusiast -> Join 10 tournaments`);
    }

    // Update Win Streak: from 10 to 5 matches
    const result2 = await pool.query(`
      UPDATE achievements 
      SET description = 'Win 5 matches in a row'
      WHERE name = 'Win Streak'
      RETURNING name, description
    `);
    if (result2.rowCount > 0) {
      console.log(`✅ Updated: Win Streak -> Win 5 matches in a row`);
    }

    // Rename Digital Master to Match Master and update description: from 100 to 30 wins, remove "online"
    const result3 = await pool.query(`
      UPDATE achievements 
      SET name = 'Match Master', description = 'Achieve 30 wins in tournament matches'
      WHERE name = 'Digital Master' OR name = 'Online Champion'
      RETURNING name, description
    `);
    if (result3.rowCount > 0) {
      console.log(`✅ Updated: Digital Master/Online Champion -> Match Master (30 wins)`);
    }

    // Update Legend: change from time-based to match-based achievement
    const result4 = await pool.query(`
      UPDATE achievements 
      SET description = 'Win 10 tournament matches'
      WHERE name = 'Legend'
      RETURNING name, description
    `);
    if (result4.rowCount > 0) {
      console.log(`✅ Updated: Legend -> Win 10 tournament matches`);
    }

    // Update Veteran: from 6 months to 1 month
    const result5 = await pool.query(`
      UPDATE achievements 
      SET description = 'Play for 1 month'
      WHERE name = 'Veteran'
      RETURNING name, description
    `);
    if (result5.rowCount > 0) {
      console.log(`✅ Updated: Veteran -> Play for 1 month`);
    }

    // Update Lightning Fast: change from time-based to tournament-based
    const result6 = await pool.query(`
      UPDATE achievements 
      SET description = 'Win 3 matches in a single tournament'
      WHERE name = 'Lightning Fast'
      RETURNING name, description
    `);
    if (result6.rowCount > 0) {
      console.log(`✅ Updated: Lightning Fast -> Win 3 matches in a single tournament`);
    }

    // Update Path Finder: from "3 different" to "all" tournament formats
    const result7 = await pool.query(`
      UPDATE achievements 
      SET description = 'Complete all tournament formats'
      WHERE name = 'Path Finder'
      RETURNING name, description
    `);
    if (result7.rowCount > 0) {
      console.log(`✅ Updated: Path Finder -> Complete all tournament formats`);
    }

    // Update Regular Player: change to avoid conflict with Veteran
    const result8 = await pool.query(`
      UPDATE achievements 
      SET description = 'Play in 3 tournaments'
      WHERE name = 'Regular Player'
      RETURNING name, description
    `);
    if (result8.rowCount > 0) {
      console.log(`✅ Updated: Regular Player -> Play in 3 tournaments`);
    }

    // Update Social Butterfly: from 50 to 10 different opponents
    const result9 = await pool.query(`
      UPDATE achievements 
      SET description = 'Play against 10 different opponents'
      WHERE name = 'Social Butterfly'
      RETURNING name, description
    `);
    if (result9.rowCount > 0) {
      console.log(`✅ Updated: Social Butterfly -> Play against 10 different opponents`);
    }

    // Update Newcomer: from 1 month to 1 week
    const result10 = await pool.query(`
      UPDATE achievements 
      SET description = 'Play for 1 week'
      WHERE name = 'Newcomer'
      RETURNING name, description
    `);
    if (result10.rowCount > 0) {
      console.log(`✅ Updated: Newcomer -> Play for 1 week`);
    }

    // Update Podium Master: now "paper champion" who loses the final
    const result11 = await pool.query(`
      UPDATE achievements 
      SET description = 'Reach the tournament final but lose'
      WHERE name = 'Podium Master'
      RETURNING name, description
    `);
    if (result11.rowCount > 0) {
      console.log(`✅ Updated: Podium Master -> Reach the tournament final but lose`);
    }

    // Update Champion: awarded for winning a professional tournament
    const result12 = await pool.query(`
      UPDATE achievements 
      SET description = 'Win a professional tournament'
      WHERE name = 'Champion'
      RETURNING name, description
    `);
    if (result12.rowCount > 0) {
      console.log(`✅ Updated: Champion -> Win a professional tournament`);
    }

    // Remove deprecated Globetrotter achievement
    const result13 = await pool.query(`
      DELETE FROM achievements
      WHERE name = 'Globetrotter'
      RETURNING name
    `);
    if (result13.rowCount > 0) {
      console.log(`🗑️ Removed deprecated achievement: Globetrotter`);
    }

    console.log('\n🎉 All achievements updated successfully!');

  } catch (error) {
    console.error('❌ Error updating achievements:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run
updateAchievements();

