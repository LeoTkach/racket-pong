const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432
});

// Helper function to calculate ELO rating change
function calculateEloRating(playerRating, opponentRating, actualScore, kFactor = 32) {
  // actualScore: 1 for win, 0.5 for draw, 0 for loss
  // Expected score based on rating difference
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  
  // Calculate rating change
  const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
  
  return {
    ratingChange,
    newRating: playerRating + ratingChange,
    expectedScore
  };
}

async function resetAllRatings() {
  try {
    console.log('🔄 Resetting all player ratings to 1000...\n');
    
    // 1. Set all player ratings to 1000
    const updateResult = await pool.query(`
      UPDATE players 
      SET rating = 1000, updated_at = CURRENT_TIMESTAMP
      WHERE rating != 1000 OR rating IS NULL
    `);
    
    console.log(`   ✅ Updated ${updateResult.rowCount} players to rating 1000`);
    
    // 2. Delete all rating history
    const deleteHistoryResult = await pool.query(`
      DELETE FROM player_rating_history
    `);
    
    console.log(`   ✅ Deleted ${deleteHistoryResult.rowCount} rating history records\n`);
    
    return true;
  } catch (error) {
    console.error('❌ Error resetting ratings:', error);
    throw error;
  }
}

async function calculateRatingsForTournament(tournamentId, playerRatings) {
  try {
    // Get tournament info
    const tournamentInfo = await pool.query(`
      SELECT id, name, status, format, date
      FROM tournaments
      WHERE id = $1
    `, [tournamentId]);
    
    if (tournamentInfo.rows.length === 0) {
      console.log(`   ⚠️ Tournament ${tournamentId} not found`);
      return { success: false, playersUpdated: 0 };
    }
    
    const tournament = tournamentInfo.rows[0];
    console.log(`\n   📊 Tournament: ${tournament.name} (${tournament.format}, ${tournament.date})`);
    
    // Get all completed matches ordered chronologically
    const matchesResult = await pool.query(`
      SELECT 
        m.id,
        m.player1_id,
        m.player2_id,
        m.winner_id,
        m.start_time,
        m.end_time,
        m.round
      FROM matches m
      WHERE m.tournament_id = $1
        AND m.status = 'completed'
        AND m.winner_id IS NOT NULL
        AND m.player1_id IS NOT NULL
        AND m.player2_id IS NOT NULL
      ORDER BY COALESCE(m.end_time, m.start_time, m.created_at) ASC
    `, [tournamentId]);
    
    if (matchesResult.rows.length === 0) {
      console.log(`   ⚠️ No completed matches found`);
      return { success: false, playersUpdated: 0 };
    }
    
    console.log(`   Found ${matchesResult.rows.length} completed matches`);
    
    let matchesProcessed = 0;
    
    // Process each match in chronological order
    for (const match of matchesResult.rows) {
      const player1Id = match.player1_id;
      const player2Id = match.player2_id;
      
      // Get current ratings from our tracking map
      const player1Rating = playerRatings.get(player1Id) || 1000;
      const player2Rating = playerRatings.get(player2Id) || 1000;
      
      // Determine winner
      const player1Won = match.winner_id === player1Id;
      const player2Won = match.winner_id === player2Id;
      
      if (!player1Won && !player2Won) {
        console.log(`   ⚠️ Match ${match.id} has no valid winner, skipping`);
        continue;
      }
      
      let player1NewRating, player2NewRating, player1Change, player2Change;
      
      if (player1Won) {
        // Player 1 won
        const player1Result = calculateEloRating(player1Rating, player2Rating, 1);
        const player2Result = calculateEloRating(player2Rating, player1Rating, 0);
        
        player1NewRating = Math.max(800, player1Result.newRating);
        player2NewRating = Math.max(800, player2Result.newRating);
        player1Change = player1Result.ratingChange;
        player2Change = player2Result.ratingChange;
      } else {
        // Player 2 won
        const player1Result = calculateEloRating(player1Rating, player2Rating, 0);
        const player2Result = calculateEloRating(player2Rating, player1Rating, 1);
        
        player1NewRating = Math.max(800, player1Result.newRating);
        player2NewRating = Math.max(800, player2Result.newRating);
        player1Change = player1Result.ratingChange;
        player2Change = player2Result.ratingChange;
      }
      
      // Update ratings in our tracking map
      playerRatings.set(player1Id, player1NewRating);
      playerRatings.set(player2Id, player2NewRating);
      
      // Update player ratings in database
      await pool.query(`
        UPDATE players 
        SET rating = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [player1NewRating, player1Id]);
      
      await pool.query(`
        UPDATE players 
        SET rating = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [player2NewRating, player2Id]);
      
      // Get match date for history
      const matchDate = match.end_time || match.start_time || new Date();
      
      // Check if rating history already exists for this match and player
      const existingHistory1 = await pool.query(`
        SELECT id FROM player_rating_history 
        WHERE player_id = $1 AND match_id = $2
        LIMIT 1
      `, [player1Id, match.id]);
      
      if (existingHistory1.rows.length === 0) {
        // Add rating history for player 1
        await pool.query(`
          INSERT INTO player_rating_history (player_id, rating, recorded_at, match_id)
          VALUES ($1, $2, $3, $4)
        `, [player1Id, player1NewRating, matchDate, match.id]);
      }
      
      const existingHistory2 = await pool.query(`
        SELECT id FROM player_rating_history 
        WHERE player_id = $1 AND match_id = $2
        LIMIT 1
      `, [player2Id, match.id]);
      
      if (existingHistory2.rows.length === 0) {
        // Add rating history for player 2
        await pool.query(`
          INSERT INTO player_rating_history (player_id, rating, recorded_at, match_id)
          VALUES ($1, $2, $3, $4)
        `, [player2Id, player2NewRating, matchDate, match.id]);
      }
      
      matchesProcessed++;
      
      if (matchesProcessed % 10 === 0 || matchesProcessed === 1 || matchesProcessed === matchesResult.rows.length) {
        console.log(`   Processed ${matchesProcessed}/${matchesResult.rows.length} matches`);
      }
    }
    
    console.log(`   ✅ Processed ${matchesProcessed} matches`);
    return { success: true, matchesProcessed };
    
  } catch (error) {
    console.error(`   ❌ Error processing tournament ${tournamentId}:`, error);
    return { success: false, matchesProcessed: 0 };
  }
}

async function main() {
  try {
    console.log('🏓 Resetting and recalculating all player ratings\n');
    console.log('='.repeat(60));
    
    // Step 1: Reset all ratings to 1000 and delete history
    await resetAllRatings();
    
    // Step 2: Get all completed tournaments ordered by date (oldest first)
    console.log('\n📅 Finding all completed tournaments...\n');
    
    const tournamentsResult = await pool.query(`
      SELECT id, name, status, format, date
      FROM tournaments
      WHERE status = 'completed'
      ORDER BY date ASC, id ASC
    `);
    
    if (tournamentsResult.rows.length === 0) {
      console.log('⚠️ No completed tournaments found');
      await pool.end();
      return;
    }
    
    console.log(`Found ${tournamentsResult.rows.length} completed tournaments:\n`);
    tournamentsResult.rows.forEach((t, index) => {
      console.log(`  ${index + 1}. ID: ${t.id}, Name: ${t.name}, Format: ${t.format}, Date: ${t.date}`);
    });
    console.log('');
    
    // Step 3: Create a map to track player ratings across all tournaments
    // Initialize all players with 1000
    const allPlayersResult = await pool.query(`
      SELECT id FROM players
    `);
    
    const playerRatings = new Map();
    allPlayersResult.rows.forEach(p => {
      playerRatings.set(p.id, 1000);
    });
    
    console.log(`Initialized ${playerRatings.size} players with rating 1000\n`);
    console.log('='.repeat(60));
    
    // Step 4: Process each tournament in chronological order
    let totalMatchesProcessed = 0;
    let tournamentsProcessed = 0;
    
    for (const tournament of tournamentsResult.rows) {
      const result = await calculateRatingsForTournament(tournament.id, playerRatings);
      if (result.success) {
        tournamentsProcessed++;
        totalMatchesProcessed += result.matchesProcessed;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Rating recalculation complete!');
    console.log(`   Processed ${tournamentsProcessed} tournaments`);
    console.log(`   Processed ${totalMatchesProcessed} matches total`);
    console.log(`   Updated ratings for ${playerRatings.size} players`);
    
    // Show final rating statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_players,
        MIN(rating) as min_rating,
        MAX(rating) as max_rating,
        AVG(rating)::INTEGER as avg_rating
      FROM players
    `);
    
    const stats = statsResult.rows[0];
    console.log('\n📊 Final rating statistics:');
    console.log(`   Total players: ${stats.total_players}`);
    console.log(`   Min rating: ${stats.min_rating}`);
    console.log(`   Max rating: ${stats.max_rating}`);
    console.log(`   Avg rating: ${stats.avg_rating}`);
    
    // Show rating history count
    const historyResult = await pool.query(`
      SELECT COUNT(*) as total_records
      FROM player_rating_history
    `);
    
    console.log(`   Rating history records: ${historyResult.rows[0].total_records}`);
    console.log('\n🎉 All done!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

