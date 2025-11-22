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

async function calculateRatingsForTournament(tournamentId) {
  try {
    console.log(`\n[📊 RATING] Processing tournament ${tournamentId}...`);
    
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
    console.log(`   Tournament: ${tournament.name} (${tournament.format}, ${tournament.status})`);
    
    // Get all completed matches with player ratings at the time
    // We'll use current ratings as base, but ideally should use ratings at match time
    const matchesResult = await pool.query(`
      SELECT 
        m.id,
        m.player1_id,
        m.player2_id,
        m.winner_id,
        m.start_time,
        m.end_time,
        p1.rating as player1_rating,
        p2.rating as player2_rating,
        p1.username as player1_username,
        p2.username as player2_username
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      WHERE m.tournament_id = $1
        AND m.status = 'completed'
        AND m.winner_id IS NOT NULL
        AND m.player1_id IS NOT NULL
        AND m.player2_id IS NOT NULL
      ORDER BY COALESCE(m.end_time, m.start_time) ASC
    `, [tournamentId]);
    
    if (matchesResult.rows.length === 0) {
      console.log(`   ⚠️ No completed matches found`);
      return { success: false, playersUpdated: 0 };
    }
    
    console.log(`   Found ${matchesResult.rows.length} completed matches`);
    
    // Create Map to store rating changes for each player
    // We'll track ratings as they change during the tournament
    const playerRatings = new Map(); // player_id -> current rating in tournament
    const ratingChanges = new Map(); // player_id -> {totalChange, matchCount}
    
    // Get initial ratings for all participants
    const participantsResult = await pool.query(`
      SELECT tp.player_id, p.rating, p.username, p.full_name
      FROM tournament_participants tp
      JOIN players p ON tp.player_id = p.id
      WHERE tp.tournament_id = $1
    `, [tournamentId]);
    
    participantsResult.rows.forEach(p => {
      const initialRating = p.rating || 1500;
      playerRatings.set(p.player_id, initialRating);
      ratingChanges.set(p.player_id, { totalChange: 0, matchCount: 0 });
    });
    
    console.log(`   Participants: ${participantsResult.rows.length}`);
    
    // Process each match in chronological order
    for (const match of matchesResult.rows) {
      const player1Id = match.player1_id;
      const player2Id = match.player2_id;
      
      // Get current ratings (as they may have changed from previous matches in this tournament)
      const player1Rating = playerRatings.get(player1Id) || match.player1_rating || 1500;
      const player2Rating = playerRatings.get(player2Id) || match.player2_rating || 1500;
      
      // Determine winner
      const player1Won = match.winner_id === player1Id;
      const player2Won = match.winner_id === player2Id;
      
      if (player1Won) {
        // Player 1 won
        const player1Result = calculateEloRating(player1Rating, player2Rating, 1);
        const player2Result = calculateEloRating(player2Rating, player1Rating, 0);
        
        // Update running ratings for this tournament
        playerRatings.set(player1Id, player1Result.newRating);
        playerRatings.set(player2Id, player2Result.newRating);
        
        // Add to total changes
        const player1Changes = ratingChanges.get(player1Id);
        const player2Changes = ratingChanges.get(player2Id);
        
        player1Changes.totalChange += player1Result.ratingChange;
        player1Changes.matchCount++;
        player2Changes.totalChange += player2Result.ratingChange;
        player2Changes.matchCount++;
        
      } else if (player2Won) {
        // Player 2 won
        const player1Result = calculateEloRating(player1Rating, player2Rating, 0);
        const player2Result = calculateEloRating(player2Rating, player1Rating, 1);
        
        // Update running ratings for this tournament
        playerRatings.set(player1Id, player1Result.newRating);
        playerRatings.set(player2Id, player2Result.newRating);
        
        // Add to total changes
        const player1Changes = ratingChanges.get(player1Id);
        const player2Changes = ratingChanges.get(player2Id);
        
        player1Changes.totalChange += player1Result.ratingChange;
        player1Changes.matchCount++;
        player2Changes.totalChange += player2Result.ratingChange;
        player2Changes.matchCount++;
      }
    }
    
    // Now apply the final rating changes to the database
    let playersUpdated = 0;
    
    for (const [playerId, changes] of ratingChanges.entries()) {
      if (changes.matchCount === 0) continue; // Skip players with no matches
      
      try {
        // Get current rating from database
        const currentPlayer = await pool.query('SELECT rating, username, full_name FROM players WHERE id = $1', [playerId]);
        if (currentPlayer.rows.length === 0) continue;
        
        const currentRating = currentPlayer.rows[0].rating || 1500;
        const newRating = Math.max(800, currentRating + changes.totalChange); // Minimum 800
        
        const playerName = currentPlayer.rows[0].full_name || currentPlayer.rows[0].username;
        
        console.log(`   ${playerName}: ${currentRating} → ${newRating} (${changes.totalChange > 0 ? '+' : ''}${changes.totalChange}, ${changes.matchCount} matches)`);
        
        // Update player rating
        await pool.query(`
          UPDATE players 
          SET rating = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [newRating, playerId]);
        
        // Get the last match date for this player in this tournament
        const lastMatch = await pool.query(`
          SELECT COALESCE(MAX(end_time), MAX(start_time)) as match_date
          FROM matches
          WHERE tournament_id = $1 
            AND (player1_id = $2 OR player2_id = $2)
            AND status = 'completed'
        `, [tournamentId, playerId]);
        
        const matchDate = lastMatch.rows[0]?.match_date || new Date();
        
        // Check if rating history entry already exists for this tournament
        const existingHistory = await pool.query(`
          SELECT id FROM player_rating_history 
          WHERE player_id = $1 
            AND match_id IN (
              SELECT id FROM matches 
              WHERE tournament_id = $2 
                AND (player1_id = $1 OR player2_id = $1)
                AND status = 'completed'
            )
          LIMIT 1
        `, [playerId, tournamentId]);
        
        // Only add if doesn't exist
        if (existingHistory.rows.length === 0) {
          // Get the last match ID for this player in this tournament
          const lastMatchId = await pool.query(`
            SELECT m.id
            FROM matches m
            WHERE m.tournament_id = $1
              AND (m.player1_id = $2 OR m.player2_id = $2)
              AND m.status = 'completed'
            ORDER BY COALESCE(m.end_time, m.start_time) DESC
            LIMIT 1
          `, [tournamentId, playerId]);
          
          const matchId = lastMatchId.rows[0]?.id || null;
          
          await pool.query(`
            INSERT INTO player_rating_history (player_id, rating, recorded_at, match_id)
            VALUES ($1, $2, $3, $4)
          `, [playerId, newRating, matchDate, matchId]);
        }
        
        playersUpdated++;
        
      } catch (playerError) {
        console.error(`   ⚠️ Error updating rating for player ${playerId}:`, playerError.message);
      }
    }
    
    console.log(`   ✅ Updated ratings for ${playersUpdated} players`);
    return { success: true, playersUpdated };
    
  } catch (error) {
    console.error(`   ❌ Error processing tournament ${tournamentId}:`, error);
    return { success: false, playersUpdated: 0 };
  }
}

async function main() {
  try {
    console.log('🏓 Calculating ratings for completed tournaments organized by leonidtkach...\n');
    
    // Find leonidtkach organizer ID
    const organizerResult = await pool.query(`
      SELECT id, username, full_name FROM players 
      WHERE username = 'leonidtkach' OR id = 5 
      LIMIT 1
    `);
    
    if (organizerResult.rows.length === 0) {
      console.log('❌ leonidtkach not found');
      await pool.end();
      return;
    }
    
    const organizerId = organizerResult.rows[0].id;
    console.log(`✅ Found organizer: ${organizerResult.rows[0].full_name || organizerResult.rows[0].username} (ID: ${organizerId})\n`);
    
    // Get completed tournaments
    const tournamentsResult = await pool.query(`
      SELECT id, name, status, format, date
      FROM tournaments
      WHERE organizer_id = $1
        AND status = 'completed'
      ORDER BY date DESC
    `, [organizerId]);
    
    if (tournamentsResult.rows.length === 0) {
      console.log('⚠️ No completed tournaments found');
      await pool.end();
      return;
    }
    
    console.log(`Found ${tournamentsResult.rows.length} completed tournaments:\n`);
    tournamentsResult.rows.forEach(t => {
      console.log(`  - ID: ${t.id}, Name: ${t.name}, Format: ${t.format}, Date: ${t.date}`);
    });
    console.log('');
    
    let totalPlayersUpdated = 0;
    let tournamentsProcessed = 0;
    
    // Process each tournament
    for (const tournament of tournamentsResult.rows) {
      const result = await calculateRatingsForTournament(tournament.id);
      if (result.success) {
        tournamentsProcessed++;
        totalPlayersUpdated += result.playersUpdated;
      }
    }
    
    console.log(`\n✅ Processed ${tournamentsProcessed} tournaments`);
    console.log(`✅ Updated ratings for ${totalPlayersUpdated} players total`);
    console.log('\n🎉 Rating calculation complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

main();



