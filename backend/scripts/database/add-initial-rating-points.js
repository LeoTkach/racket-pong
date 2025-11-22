// Script to add initial rating point (1000) for all players who don't have one
// Usage: node scripts/database/add-initial-rating-points.js

const pool = require('../../server/config/database');
require('dotenv').config();

async function addInitialRatingPoints() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔄 Adding initial rating points (1000) for all players...\n');
    
    // Get all players
    const playersResult = await client.query(`
      SELECT id, username, full_name, rating
      FROM players
      ORDER BY id
    `);
    
    console.log(`📊 Found ${playersResult.rows.length} players\n`);
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const player of playersResult.rows) {
      // Check if player already has rating history
      const historyResult = await client.query(`
        SELECT id, rating, recorded_at
        FROM player_rating_history
        WHERE player_id = $1
        ORDER BY recorded_at ASC
        LIMIT 1
      `, [player.id]);
      
      if (historyResult.rows.length > 0) {
        // Player already has history - check if first point is 1000 or earlier
        const firstPoint = historyResult.rows[0];
        const firstPointDate = new Date(firstPoint.recorded_at);
        
        // If first point is not 1000 or is after today, we might need to add initial point
        // But for now, let's just add initial point if it doesn't exist before the first match
        if (firstPoint.rating !== 1000) {
          // Check if there's already an initial point (rating 1000 before first match)
          const initialCheck = await client.query(`
            SELECT id FROM player_rating_history
            WHERE player_id = $1
              AND rating = 1000
              AND recorded_at < $2
            LIMIT 1
          `, [player.id, firstPointDate]);
          
          if (initialCheck.rows.length === 0) {
            // Add initial point 1 day before first match
            const initialDate = new Date(firstPointDate);
            initialDate.setDate(initialDate.getDate() - 1);
            
            await client.query(`
              INSERT INTO player_rating_history (player_id, rating, recorded_at)
              VALUES ($1, 1000, $2)
            `, [player.id, initialDate.toISOString()]);
            
            console.log(`✅ Added initial point for ${player.full_name || player.username} (ID: ${player.id})`);
            addedCount++;
          } else {
            console.log(`⏭️  Skipped ${player.full_name || player.username} (ID: ${player.id}) - already has initial point`);
            skippedCount++;
          }
        } else {
          console.log(`⏭️  Skipped ${player.full_name || player.username} (ID: ${player.id}) - first point is already 1000`);
          skippedCount++;
        }
      } else {
        // Player has no history - add initial point
        // Use join_date if available, otherwise use 30 days ago
        const playerInfo = await client.query(`
          SELECT join_date, created_at
          FROM players
          WHERE id = $1
        `, [player.id]);
        
        let initialDate;
        if (playerInfo.rows[0]?.join_date) {
          initialDate = new Date(playerInfo.rows[0].join_date);
        } else if (playerInfo.rows[0]?.created_at) {
          initialDate = new Date(playerInfo.rows[0].created_at);
          initialDate.setDate(initialDate.getDate() - 1);
        } else {
          initialDate = new Date();
          initialDate.setDate(initialDate.getDate() - 30);
        }
        
        await client.query(`
          INSERT INTO player_rating_history (player_id, rating, recorded_at)
          VALUES ($1, 1000, $2)
        `, [player.id, initialDate.toISOString()]);
        
        console.log(`✅ Added initial point for ${player.full_name || player.username} (ID: ${player.id})`);
        addedCount++;
      }
    }
    
    console.log(`\n✅ Summary:`);
    console.log(`   Added initial points: ${addedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total players: ${playersResult.rows.length}\n`);
    
    await client.query('COMMIT');
    console.log(`✅ All initial rating points added successfully!\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding initial rating points:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
addInitialRatingPoints()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    pool.end();
    process.exit(1);
  });



