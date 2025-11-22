// Script to regenerate Leonid Tkach's rating history based on actual tournament matches
// This removes fake data and recalculates rating history from real completed tournaments
// Usage: node scripts/database/regenerate-leonid-rating-history.js

const pool = require('../../server/config/database');
require('dotenv').config();

// Elo rating calculation function (same as in tournaments.js)
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

async function regenerateLeonidRatingHistory() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔄 Regenerating rating history for Leonid Tkach based on actual tournaments...\n');
    
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
    const currentRating = leonidResult.rows[0].rating || 1500;
    
    console.log(`✅ Found Leonid Tkach:`);
    console.log(`   ID: ${leonidId}`);
    console.log(`   Name: ${leonidName}`);
    console.log(`   Current Rating: ${currentRating}\n`);
    
    // Delete ALL existing rating history for this player
    const deleteResult = await client.query(`
      DELETE FROM player_rating_history WHERE player_id = $1
    `, [leonidId]);
    
    console.log(`🗑️  Deleted ${deleteResult.rowCount} existing rating history entries\n`);
    
    // Get all completed tournaments where Leonid participated, ordered by date
    const tournamentsResult = await client.query(`
      SELECT DISTINCT t.id, t.name, t.date, t.status
      FROM tournaments t
      INNER JOIN tournament_participants tp ON t.id = tp.tournament_id
      WHERE tp.player_id = $1
        AND t.status = 'completed'
      ORDER BY t.date ASC
    `, [leonidId]);
    
    console.log(`📊 Found ${tournamentsResult.rows.length} completed tournaments\n`);
    
    if (tournamentsResult.rows.length === 0) {
      console.log('⚠️  No completed tournaments found. Cannot generate rating history.');
      console.log('   Adding initial rating point with current rating...\n');
      
      // Add at least one point with current rating
      await client.query(`
        INSERT INTO player_rating_history (player_id, rating, recorded_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
      `, [leonidId, currentRating]);
      
      await client.query('COMMIT');
      console.log('✅ Added initial rating point\n');
      return;
    }
    
    // Start with initial rating 1000 as specified
    let currentRatingValue = 1000;
    
    // Track rating history points
    const ratingHistoryPoints = [];
    
    // Get ALL matches across ALL tournaments in chronological order
    const allMatchesResult = await client.query(`
      SELECT 
        m.id,
        m.tournament_id,
        m.player1_id,
        m.player2_id,
        m.winner_id,
        m.status,
        COALESCE(m.end_time, m.start_time, t.date) as match_time,
        t.name as tournament_name,
        t.date as tournament_date,
        p1.rating as player1_rating,
        p2.rating as player2_rating
      FROM matches m
      INNER JOIN tournaments t ON m.tournament_id = t.id
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      WHERE (m.player1_id = $1 OR m.player2_id = $1)
        AND m.status = 'completed'
        AND m.winner_id IS NOT NULL
        AND t.status = 'completed'
      ORDER BY 
        COALESCE(m.end_time, m.start_time, t.date) ASC, 
        m.id ASC
    `, [leonidId]);
    
    console.log(`📊 Found ${allMatchesResult.rows.length} total completed matches across all tournaments\n`);
    
    if (allMatchesResult.rows.length === 0) {
      console.log('⚠️  No completed matches found. Cannot generate rating history.');
      console.log('   Adding initial rating point with current rating...\n');
      
      // Add at least one point with current rating
      await client.query(`
        INSERT INTO player_rating_history (player_id, rating, recorded_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
      `, [leonidId, currentRating]);
      
      await client.query('COMMIT');
      console.log('✅ Added initial rating point\n');
      return;
    }
    
    let currentTournamentId = null;
    let currentTournamentName = null;
    
    // Process each match in chronological order
    for (const match of allMatchesResult.rows) {
      const isPlayer1 = match.player1_id === leonidId;
      const isPlayer2 = match.player2_id === leonidId;
      
      if (!isPlayer1 && !isPlayer2) continue;
      
      // Log tournament change
      if (currentTournamentId !== match.tournament_id) {
        if (currentTournamentId !== null) {
          console.log(`   ✅ Tournament complete. Final rating: ${currentRatingValue}\n`);
        }
        currentTournamentId = match.tournament_id;
        currentTournamentName = match.tournament_name;
        console.log(`📅 Processing tournament: ${currentTournamentName} (${match.tournament_date})`);
      }
      
      // Get opponent rating (use current rating from DB - this is an approximation)
      // In a perfect system, we'd track opponent ratings over time too, but this is simpler
      const opponentId = isPlayer1 ? match.player2_id : match.player1_id;
      const opponentRating = isPlayer1 
        ? (match.player2_rating || 1500)
        : (match.player1_rating || 1500);
      
      // Determine if Leonid won
      const leonidWon = match.winner_id === leonidId;
      const actualScore = leonidWon ? 1 : 0;
      
      // Calculate rating change
      const result = calculateEloRating(currentRatingValue, opponentRating, actualScore);
      const newRating = Math.max(800, result.newRating); // Minimum rating 800
      
      console.log(`   🏓 Match ${match.id}: vs Player ${opponentId} (${opponentRating}) - ${leonidWon ? 'WIN' : 'LOSS'}`);
      console.log(`      Rating: ${currentRatingValue} → ${newRating} (${result.ratingChange > 0 ? '+' : ''}${result.ratingChange})`);
      
      // Update current rating
      currentRatingValue = newRating;
      
      // Add to rating history
      ratingHistoryPoints.push({
        player_id: leonidId,
        rating: newRating,
        recorded_at: match.match_time,
        match_id: match.id
      });
    }
    
    // Log final tournament completion
    if (currentTournamentId !== null) {
      console.log(`   ✅ Tournament complete. Final rating: ${currentRatingValue}\n`);
    }
    
    // Insert all rating history points
    if (ratingHistoryPoints.length > 0) {
      console.log(`📝 Inserting ${ratingHistoryPoints.length} rating history points...\n`);
      
      // Add initial rating point (1000) before first match if we have matches
      const firstMatch = allMatchesResult.rows.find(m => 
        (m.player1_id === leonidId || m.player2_id === leonidId)
      );
      
      if (firstMatch) {
        // Get the date before the first match (subtract 1 day)
        const initialDate = new Date(firstMatch.match_time);
        initialDate.setDate(initialDate.getDate() - 1);
        
        // Insert initial rating point
        await client.query(`
          INSERT INTO player_rating_history (player_id, rating, recorded_at)
          VALUES ($1, $2, $3)
        `, [leonidId, 1000, initialDate.toISOString()]);
        
        console.log(`   📍 Added initial rating point: 1000 at ${initialDate.toISOString().split('T')[0]}\n`);
      }
      
      for (const point of ratingHistoryPoints) {
        await client.query(`
          INSERT INTO player_rating_history (player_id, rating, recorded_at, match_id)
          VALUES ($1, $2, $3, $4)
        `, [point.player_id, point.rating, point.recorded_at, point.match_id]);
      }
      
      // Add final point with calculated rating if it's different from last point
      const lastPoint = ratingHistoryPoints[ratingHistoryPoints.length - 1];
      if (lastPoint.rating !== currentRatingValue) {
        await client.query(`
          INSERT INTO player_rating_history (player_id, rating, recorded_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
        `, [leonidId, currentRatingValue]);
        ratingHistoryPoints.push({
          player_id: leonidId,
          rating: currentRatingValue,
          recorded_at: new Date(),
          match_id: null
        });
      }
      
      console.log(`✅ Inserted ${ratingHistoryPoints.length} rating history points\n`);
    } else {
      // If no points were generated, add at least one with current rating
      await client.query(`
        INSERT INTO player_rating_history (player_id, rating, recorded_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
      `, [leonidId, currentRatingValue]);
      console.log(`✅ Added initial rating point with calculated rating\n`);
    }
    
    // Only update player's current rating if calculated rating is higher or close to current
    // This preserves manual updates or ratings from other sources
    if (currentRatingValue >= currentRating - 100) {
      await client.query(`
        UPDATE players 
        SET rating = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [currentRatingValue, leonidId]);
      console.log(`   Rating updated in DB: ${currentRatingValue} (was ${currentRating})\n`);
    } else {
      console.log(`   ⚠️  Calculated rating (${currentRatingValue}) is significantly lower than current (${currentRating})`);
      console.log(`   Keeping current rating in DB to preserve manual updates or other data sources\n`);
    }
    
    // Summary
    console.log(`\n✅ Rating history regenerated successfully!`);
    console.log(`   Total points: ${ratingHistoryPoints.length}`);
    if (ratingHistoryPoints.length > 0) {
      const minRating = Math.min(...ratingHistoryPoints.map(p => p.rating));
      const maxRating = Math.max(...ratingHistoryPoints.map(p => p.rating));
      console.log(`   Rating range: ${minRating} - ${maxRating}`);
      console.log(`   Rating change: ${maxRating - minRating} points`);
    }
    console.log(`   Final calculated rating from matches: ${currentRatingValue}`);
    console.log(`   Current rating in DB: ${currentRating}\n`);
    
    await client.query('COMMIT');
    console.log(`✅ Transaction committed successfully!\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error regenerating rating history:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
regenerateLeonidRatingHistory()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    pool.end();
    process.exit(1);
  });

