// Script to clean up Leonid Tkach's rating history by removing duplicate consecutive ratings
// Usage: node scripts/database/clean-leonid-rating-history.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function cleanLeonidRatingHistory() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Find Leonid Tkach's ID
    const leonidResult = await client.query(`
      SELECT id, username, full_name, rating
      FROM players 
      WHERE LOWER(full_name) LIKE '%leonid%tkach%' 
         OR LOWER(username) LIKE '%leonid%tkach%'
         OR LOWER(full_name) = 'leonid tkach'
         OR LOWER(username) = 'leonid_tkach'
      LIMIT 1
    `);
    
    if (leonidResult.rows.length === 0) {
      console.error('❌ Leonid Tkach not found in database');
      await client.query('ROLLBACK');
      return;
    }
    
    const leonidId = leonidResult.rows[0].id;
    const leonidName = leonidResult.rows[0].full_name || leonidResult.rows[0].username;
    const currentRating = leonidResult.rows[0].rating;
    
    console.log(`\n✅ Found Leonid Tkach:`);
    console.log(`   ID: ${leonidId}`);
    console.log(`   Name: ${leonidName}`);
    console.log(`   Current Rating: ${currentRating}\n`);
    
    // Get all rating history points ordered by date
    const historyResult = await client.query(`
      SELECT id, rating, recorded_at, match_id
      FROM player_rating_history
      WHERE player_id = $1
      ORDER BY recorded_at ASC
    `, [leonidId]);
    
    const allPoints = historyResult.rows;
    console.log(`📊 Total rating history points: ${allPoints.length}`);
    
    if (allPoints.length === 0) {
      console.log(`✅ No rating history to clean.\n`);
      await client.query('COMMIT');
      return;
    }
    
    // Filter out consecutive duplicate ratings
    // Keep: first point, last point, and points where rating changes
    const pointsToKeep = [];
    let prevRating = null;
    
    for (let i = 0; i < allPoints.length; i++) {
      const point = allPoints[i];
      const isFirst = i === 0;
      const isLast = i === allPoints.length - 1;
      const ratingChanged = prevRating !== null && point.rating !== prevRating;
      
      // Keep if: first point, last point, or rating changed
      if (isFirst || isLast || ratingChanged) {
        pointsToKeep.push(point.id);
      }
      
      prevRating = point.rating;
    }
    
    console.log(`📊 Points to keep: ${pointsToKeep.length} (out of ${allPoints.length})`);
    console.log(`🗑️  Points to delete: ${allPoints.length - pointsToKeep.length}\n`);
    
    if (pointsToKeep.length === allPoints.length) {
      console.log(`✅ No duplicate points found. Rating history is already clean.\n`);
      await client.query('COMMIT');
      return;
    }
    
    // Delete points that are not in the keep list
    const deleteResult = await client.query(`
      DELETE FROM player_rating_history
      WHERE player_id = $1
        AND id != ALL($2::int[])
    `, [leonidId, pointsToKeep]);
    
    console.log(`✅ Deleted ${deleteResult.rowCount} duplicate rating history points`);
    
    // Verify the cleaned history
    const cleanedResult = await client.query(`
      SELECT id, rating, recorded_at, match_id
      FROM player_rating_history
      WHERE player_id = $1
      ORDER BY recorded_at ASC
    `, [leonidId]);
    
    const cleanedPoints = cleanedResult.rows;
    console.log(`\n✅ Cleaned rating history: ${cleanedPoints.length} points remaining`);
    
    // Show summary
    const ratings = cleanedPoints.map(p => p.rating);
    const uniqueRatings = new Set(ratings).size;
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);
    
    console.log(`   Rating range: ${minRating} - ${maxRating}`);
    console.log(`   Unique ratings: ${uniqueRatings}`);
    console.log(`   Rating change: ${maxRating - minRating} points\n`);
    
    // Show first and last points
    if (cleanedPoints.length > 0) {
      console.log(`📅 First point: Rating ${cleanedPoints[0].rating} at ${cleanedPoints[0].recorded_at}`);
      console.log(`📅 Last point: Rating ${cleanedPoints[cleanedPoints.length - 1].rating} at ${cleanedPoints[cleanedPoints.length - 1].recorded_at}\n`);
    }
    
    await client.query('COMMIT');
    console.log(`✅ Rating history cleaned successfully!\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error cleaning rating history:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
cleanLeonidRatingHistory()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    pool.end();
    process.exit(1);
  });



