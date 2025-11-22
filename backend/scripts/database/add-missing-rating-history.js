const pool = require('../../server/config/database');
require('dotenv').config();

// Helper function to calculate ELO rating change (same as in matches.js)
function calculateEloRating(playerRating, opponentRating, actualScore, kFactor = 32) {
  // actualScore: 1 for win, 0.5 for draw, 0 for loss
  // Expected score based on rating difference
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  
  // Rating change = kFactor * (actualScore - expectedScore)
  const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
  
  return {
    expectedScore,
    ratingChange
  };
}

async function addMissingRatingHistory(playerId) {
  try {
    console.log(`🔍 Finding missing rating history for player ID: ${playerId}\n`);

    // Get player info
    const playerResult = await pool.query('SELECT id, username, full_name, rating FROM players WHERE id = $1', [playerId]);
    if (playerResult.rows.length === 0) {
      console.error(`❌ Player with ID ${playerId} not found.`);
      return;
    }
    const player = playerResult.rows[0];
    console.log(`📊 Player: ${player.username || player.full_name || `Player ${player.id}`} (ID: ${player.id})`);
    console.log(`   Current rating: ${player.rating}\n`);

    // Find completed tournaments for this player
    const tournamentsResult = await pool.query(`
      SELECT DISTINCT t.id, t.name, t.status, t.date
      FROM tournaments t
      INNER JOIN tournament_participants tp ON t.id = tp.tournament_id
      WHERE tp.player_id = $1
        AND (t.status = 'completed' OR t.status = 'cancelled')
      ORDER BY t.date ASC
    `, [playerId]);

    console.log(`📋 Found ${tournamentsResult.rows.length} completed tournaments\n`);

    // Get existing rating history tournament IDs
    const existingHistoryResult = await pool.query(`
      SELECT DISTINCT m.tournament_id
      FROM player_rating_history prh
      INNER JOIN matches m ON prh.match_id = m.id
      WHERE prh.player_id = $1
        AND m.tournament_id IS NOT NULL
    `, [playerId]);

    const existingTournamentIds = existingHistoryResult.rows.map(r => r.tournament_id);
    console.log(`✅ Tournaments with rating history: [${existingTournamentIds.join(', ')}]`);

    // Find tournaments without rating history
    const tournamentsWithoutRating = tournamentsResult.rows.filter(t => !existingTournamentIds.includes(t.id));
    
    if (tournamentsWithoutRating.length === 0) {
      console.log(`\n✅ All completed tournaments have rating history!`);
      return;
    }

    console.log(`\n⚠️  Found ${tournamentsWithoutRating.length} tournaments without rating history:`);
    tournamentsWithoutRating.forEach(t => {
      console.log(`   - Tournament ID ${t.id}: ${t.name} (${t.status})`);
    });

    // Process each tournament
    for (const tournament of tournamentsWithoutRating) {
      console.log(`\n🔄 Processing tournament ${tournament.id}: ${tournament.name}`);
      
      // Get all completed matches for this player in this tournament, ordered by date
      const matchesResult = await pool.query(`
        SELECT 
          m.id,
          m.player1_id,
          m.player2_id,
          m.winner_id,
          m.tournament_id,
          COALESCE(m.end_time, m.start_time, t.date) as match_date
        FROM matches m
        LEFT JOIN tournaments t ON m.tournament_id = t.id
        WHERE m.tournament_id = $1
          AND m.status = 'completed'
          AND m.winner_id IS NOT NULL
          AND (m.player1_id = $2 OR m.player2_id = $2)
        ORDER BY COALESCE(m.end_time, m.start_time, t.date) ASC
      `, [tournament.id, playerId]);

      if (matchesResult.rows.length === 0) {
        console.log(`   ⚠️  No completed matches found for this tournament`);
        continue;
      }

      console.log(`   📋 Found ${matchesResult.rows.length} completed matches`);

      // Get initial rating (rating before first match in this tournament)
      // This should be the rating from the last match of previous tournament, or default 1000
      let currentRating = 1000;
      
      // Try to get rating from last match before this tournament
      const lastRatingResult = await pool.query(`
        SELECT prh.rating
        FROM player_rating_history prh
        INNER JOIN matches m ON prh.match_id = m.id
        WHERE prh.player_id = $1
          AND m.tournament_id != $2
          AND COALESCE(m.end_time, m.start_time, (SELECT t.date FROM tournaments t WHERE t.id = m.tournament_id)) < 
              (SELECT MIN(COALESCE(m2.end_time, m2.start_time, t2.date)) 
               FROM matches m2 
               LEFT JOIN tournaments t2 ON m2.tournament_id = t2.id
               WHERE m2.tournament_id = $2)
        ORDER BY COALESCE(m.end_time, m.start_time, (SELECT t.date FROM tournaments t WHERE t.id = m.tournament_id)) DESC
        LIMIT 1
      `, [playerId, tournament.id]);

      if (lastRatingResult.rows.length > 0) {
        currentRating = lastRatingResult.rows[0].rating;
        console.log(`   📊 Starting rating: ${currentRating} (from previous tournament)`);
      } else {
        console.log(`   📊 Starting rating: ${currentRating} (default)`);
      }

      // Process each match
      for (const match of matchesResult.rows) {
        const isPlayer1 = match.player1_id === playerId;
        const opponentId = isPlayer1 ? match.player2_id : match.player1_id;
        const playerWon = match.winner_id === playerId;

        // Get opponent's rating at the time of the match
        // For simplicity, we'll use their current rating (in a real scenario, we'd need historical ratings)
        const opponentResult = await pool.query('SELECT rating FROM players WHERE id = $1', [opponentId]);
        const opponentRating = opponentResult.rows[0]?.rating || 1500;

        // Calculate rating change
        const result = calculateEloRating(currentRating, opponentRating, playerWon ? 1 : 0);
        const newRating = Math.max(800, currentRating + result.ratingChange);

        console.log(`   Match ${match.id}: ${currentRating} → ${newRating} (${result.ratingChange > 0 ? '+' : ''}${result.ratingChange}) ${playerWon ? 'WIN' : 'LOSS'} vs Player ${opponentId}`);

        // Check if history entry already exists
        const existingHistory = await pool.query(`
          SELECT id FROM player_rating_history 
          WHERE player_id = $1 AND match_id = $2
        `, [playerId, match.id]);

        if (existingHistory.rows.length === 0) {
          await pool.query(`
            INSERT INTO player_rating_history (player_id, rating, recorded_at, match_id)
            VALUES ($1, $2, $3, $4)
          `, [playerId, newRating, match.match_date, match.id]);
          console.log(`      ✅ Added rating history entry`);
        } else {
          await pool.query(`
            UPDATE player_rating_history 
            SET rating = $1, recorded_at = $2
            WHERE player_id = $3 AND match_id = $4
          `, [newRating, match.match_date, playerId, match.id]);
          console.log(`      ✅ Updated rating history entry`);
        }

        // Update current rating for next match
        currentRating = newRating;
      }

      console.log(`   ✅ Tournament ${tournament.id} processed. Final rating: ${currentRating}`);
    }

    console.log(`\n✨ Done! Added rating history for ${tournamentsWithoutRating.length} tournaments.`);

  } catch (error) {
    console.error('❌ Error adding missing rating history:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run script
const playerId = process.argv[2] ? parseInt(process.argv[2]) : 5; // Default to player 5 (leonidtkach)
addMissingRatingHistory(playerId);



