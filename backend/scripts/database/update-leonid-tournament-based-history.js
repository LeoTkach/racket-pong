// Script to update Leonid's rating history to show only:
// 1. Initial rating point (1000)
// 2. Final rating point after tournament completion
// Usage: node scripts/database/update-leonid-tournament-based-history.js

const pool = require('../../server/config/database');
require('dotenv').config();

async function updateTournamentBasedHistory() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔄 Updating rating history to tournament-based points only...\n');
    
    // Find Leonid Tkach
    const leonidResult = await client.query(`
      SELECT id, full_name, username, rating
      FROM players 
      WHERE LOWER(full_name) LIKE '%leonid%tkach%' 
         OR LOWER(username) LIKE '%leonid%tkach%'
         OR LOWER(full_name) = 'leonid tkach'
         OR LOWER(username) = 'leonid_tkach'
      LIMIT 1
    `);
    
    if (leonidResult.rows.length === 0) {
      console.error('❌ Leonid Tkach not found');
      await client.query('ROLLBACK');
      return;
    }
    
    const leonidId = leonidResult.rows[0].id;
    const leonidName = leonidResult.rows[0].full_name || leonidResult.rows[0].username;
    const currentRating = leonidResult.rows[0].rating;
    
    console.log(`✅ Found: ${leonidName} (ID: ${leonidId}, Rating: ${currentRating})\n`);
    
    // Delete all existing rating history
    const deleteResult = await client.query(`
      DELETE FROM player_rating_history WHERE player_id = $1
    `, [leonidId]);
    
    console.log(`🗑️  Deleted ${deleteResult.rowCount} existing points\n`);
    
    // Get completed tournaments where Leonid participated, ordered by date
    const tournamentsResult = await client.query(`
      SELECT DISTINCT t.id, t.name, t.date, t.status
      FROM tournaments t
      INNER JOIN matches m ON t.id = m.tournament_id
      WHERE (m.player1_id = $1 OR m.player2_id = $1)
        AND t.status = 'completed'
      ORDER BY t.date ASC
    `, [leonidId]);
    
    console.log(`📊 Found ${tournamentsResult.rows.length} completed tournament(s)\n`);
    
    if (tournamentsResult.rows.length === 0) {
      // Just add initial point
      await client.query(`
        INSERT INTO player_rating_history (player_id, rating, recorded_at)
        VALUES ($1, 1000, CURRENT_TIMESTAMP - INTERVAL '1 day')
      `, [leonidId]);
      console.log('✅ Added initial rating point: 1000\n');
      await client.query('COMMIT');
      return;
    }
    
    // Start with initial rating 1000
    let currentRatingValue = 1000;
    
    // Add initial point (1 day before first tournament)
    const firstTournamentDate = new Date(tournamentsResult.rows[0].date);
    firstTournamentDate.setDate(firstTournamentDate.getDate() - 1);
    
    await client.query(`
      INSERT INTO player_rating_history (player_id, rating, recorded_at)
      VALUES ($1, $2, $3)
    `, [leonidId, 1000, firstTournamentDate.toISOString()]);
    
    console.log(`📍 Added initial point: 1000 at ${firstTournamentDate.toISOString().split('T')[0]}\n`);
    
    // Process each completed tournament
    for (const tournament of tournamentsResult.rows) {
      console.log(`📅 Processing tournament: ${tournament.name} (${tournament.date})`);
      
      // Get all matches for this tournament where Leonid participated, ordered by time
      const matchesResult = await client.query(`
        SELECT 
          m.id,
          m.player1_id,
          m.player2_id,
          m.winner_id,
          COALESCE(m.end_time, m.start_time, t.date) as match_time,
          p1.rating as player1_rating,
          p2.rating as player2_rating
        FROM matches m
        INNER JOIN tournaments t ON m.tournament_id = t.id
        LEFT JOIN players p1 ON m.player1_id = p1.id
        LEFT JOIN players p2 ON m.player2_id = p2.id
        WHERE m.tournament_id = $1
          AND (m.player1_id = $2 OR m.player2_id = $2)
          AND m.status = 'completed'
          AND m.winner_id IS NOT NULL
        ORDER BY COALESCE(m.end_time, m.start_time, t.date) ASC
      `, [tournament.id, leonidId]);
      
      console.log(`   Found ${matchesResult.rows.length} completed matches`);
      
      if (matchesResult.rows.length === 0) {
        console.log(`   ⚠️  No completed matches, skipping tournament\n`);
        continue;
      }
      
      // Process each match to calculate final rating
      for (const match of matchesResult.rows) {
        const isPlayer1 = match.player1_id === leonidId;
        const isPlayer2 = match.player2_id === leonidId;
        
        if (!isPlayer1 && !isPlayer2) continue;
        
        // Get opponent rating
        const opponentRating = isPlayer1 
          ? (match.player2_rating || 1500)
          : (match.player1_rating || 1500);
        
        // Determine if Leonid won
        const leonidWon = match.winner_id === leonidId;
        const actualScore = leonidWon ? 1 : 0;
        
        // Calculate rating change using Elo
        const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRatingValue) / 400));
        const ratingChange = Math.round(32 * (actualScore - expectedScore));
        const newRating = Math.max(800, currentRatingValue + ratingChange);
        
        currentRatingValue = newRating;
      }
      
      // Get the date of the last match in the tournament
      const lastMatch = matchesResult.rows[matchesResult.rows.length - 1];
      const tournamentEndDate = lastMatch.match_time || tournament.date;
      
      // Add final point for this tournament
      await client.query(`
        INSERT INTO player_rating_history (player_id, rating, recorded_at)
        VALUES ($1, $2, $3)
      `, [leonidId, currentRatingValue, tournamentEndDate]);
      
      console.log(`   ✅ Tournament complete. Final rating: ${currentRatingValue} at ${new Date(tournamentEndDate).toISOString().split('T')[0]}\n`);
    }
    
    // Verify final rating matches current rating
    if (currentRatingValue !== currentRating) {
      console.log(`⚠️  Calculated rating (${currentRatingValue}) differs from current (${currentRating})`);
      console.log(`   Updating player rating to calculated value...\n`);
      await client.query(`
        UPDATE players 
        SET rating = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [currentRatingValue, leonidId]);
    }
    
    // Summary
    const historyResult = await client.query(`
      SELECT id, rating, recorded_at
      FROM player_rating_history
      WHERE player_id = $1
      ORDER BY recorded_at ASC
    `, [leonidId]);
    
    console.log(`\n✅ Rating history updated successfully!`);
    console.log(`   Total points: ${historyResult.rows.length}`);
    historyResult.rows.forEach((p, i) => {
      console.log(`   ${i + 1}. Rating: ${p.rating}, Date: ${new Date(p.recorded_at).toISOString().split('T')[0]}`);
    });
    console.log('');
    
    await client.query('COMMIT');
    console.log(`✅ Transaction committed successfully!\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating rating history:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
updateTournamentBasedHistory()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    pool.end();
    process.exit(1);
  });



