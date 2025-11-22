const pool = require('../../server/config/database');
require('dotenv').config();

async function testRatingAPI() {
  try {
    console.log('🧪 Testing rating history API endpoint...\n');

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

    // Simulate the API query
    const result = await pool.query(`
      SELECT rating, recorded_at, match_id
      FROM player_rating_history
      WHERE player_id = $1
      ORDER BY recorded_at ASC
    `, [leonidId]);

    console.log(`\n📊 API Response Simulation:`);
    console.log(`   Total records: ${result.rows.length}`);
    
    if (result.rows.length > 0) {
      console.log(`\n   First record:`, JSON.stringify(result.rows[0], null, 2));
      console.log(`\n   Last record:`, JSON.stringify(result.rows[result.rows.length - 1], null, 2));
      
      // Check for duplicate ratings
      const ratings = result.rows.map(r => r.rating);
      const uniqueRatings = new Set(ratings);
      const minRating = Math.min(...ratings);
      const maxRating = Math.max(...ratings);
      
      console.log(`\n   Rating stats:`);
      console.log(`     Min: ${minRating}`);
      console.log(`     Max: ${maxRating}`);
      console.log(`     Unique: ${uniqueRatings.size}`);
      console.log(`     All same: ${uniqueRatings.size === 1}`);
      
      if (uniqueRatings.size === 1) {
        console.log(`\n   ⚠️  WARNING: All ratings are ${Array.from(uniqueRatings)[0]}!`);
      } else {
        console.log(`\n   ✅ Ratings are varied!`);
      }
      
      // Check date format
      console.log(`\n   Date format check:`);
      console.log(`     First date type: ${typeof result.rows[0].recorded_at}`);
      console.log(`     First date value: ${result.rows[0].recorded_at}`);
      console.log(`     First date ISO: ${new Date(result.rows[0].recorded_at).toISOString()}`);
    }

    console.log(`\n✅ API test complete!\n`);

  } catch (error) {
    console.error('❌ Error testing API:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testRatingAPI();

