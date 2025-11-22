const pool = require('../../server/config/database');
require('dotenv').config();

async function verifyRatingHistory() {
  try {
    console.log('🔍 Verifying rating history for Leonid Tkach...\n');

    // Find Leonid Tkach user ID
    const userResult = await pool.query(`
      SELECT id, rating, username, full_name 
      FROM players 
      WHERE username LIKE '%leonid%' OR username LIKE '%tkach%' 
         OR full_name LIKE '%Leonid%' OR full_name LIKE '%Tkach%'
      LIMIT 1
    `);

    if (userResult.rows.length === 0) {
      console.error('❌ User Leonid Tkach not found!');
      process.exit(1);
    }

    const leonid = userResult.rows[0];
    const leonidId = leonid.id;

    console.log(`✅ Found user: ${leonid.full_name} (ID: ${leonidId})`);

    // Get rating history
    const historyResult = await pool.query(`
      SELECT rating, recorded_at, match_id
      FROM player_rating_history
      WHERE player_id = $1
      ORDER BY recorded_at ASC
    `, [leonidId]);

    const history = historyResult.rows;

    if (history.length === 0) {
      console.log('❌ No rating history found!');
      process.exit(1);
    }

    console.log(`\n📊 Rating History Summary:`);
    console.log(`   Total points: ${history.length}`);
    
    const ratings = history.map(h => h.rating);
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);
    const uniqueRatings = new Set(ratings).size;

    console.log(`   Rating range: ${minRating} - ${maxRating}`);
    console.log(`   Unique ratings: ${uniqueRatings}`);
    console.log(`   Rating change: ${maxRating - minRating} points`);

    console.log(`\n📅 First 5 points:`);
    history.slice(0, 5).forEach((point, i) => {
      console.log(`   ${i + 1}. Rating: ${point.rating}, Date: ${point.recorded_at}`);
    });

    console.log(`\n📅 Last 5 points:`);
    history.slice(-5).forEach((point, i) => {
      const idx = history.length - 5 + i + 1;
      console.log(`   ${idx}. Rating: ${point.rating}, Date: ${point.recorded_at}`);
    });

    // Check for duplicate ratings
    const allSame = ratings.every(r => r === ratings[0]);
    if (allSame) {
      console.log(`\n⚠️  WARNING: All ratings are the same (${ratings[0]})!`);
    } else {
      console.log(`\n✅ Ratings are varied - graph should display correctly!`);
    }

    console.log(`\n✅ Verification complete!\n`);

  } catch (error) {
    console.error('❌ Error verifying rating history:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyRatingHistory();

