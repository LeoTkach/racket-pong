const pool = require('../../server/config/database');
require('dotenv').config();

async function updateLeonidRatingHistory() {
  try {
    console.log('🔄 Updating rating history for Leonid Tkach...\n');

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
    const currentRating = leonid.rating || 2200;

    console.log(`✅ Found user: ${leonid.full_name} (ID: ${leonidId}, Current Rating: ${currentRating})`);

    // Delete existing rating history
    await pool.query('DELETE FROM player_rating_history WHERE player_id = $1', [leonidId]);
    console.log('✅ Deleted existing rating history');

    // Get an opponent for matches
    const opponentResult = await pool.query(
      'SELECT id FROM players WHERE id != $1 LIMIT 1',
      [leonidId]
    );

    if (opponentResult.rows.length === 0) {
      console.error('❌ No opponents found. Cannot create matches.');
      process.exit(1);
    }

    const opponentId = opponentResult.rows[0].id;

    // Get or create a tournament
    let tournamentResult = await pool.query('SELECT id FROM tournaments LIMIT 1');
    let tournamentId;

    if (tournamentResult.rows.length === 0) {
      const insertResult = await pool.query(`
        INSERT INTO tournaments (name, date, location, status, format, max_participants, current_participants)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        'Rating History Tournament',
        new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        'Online',
        'completed',
        'round-robin',
        16,
        2
      ]);
      tournamentId = insertResult.rows[0].id;
    } else {
      tournamentId = tournamentResult.rows[0].id;
    }

    // Generate rating history with varied ratings
    const totalPoints = 60;
    const daysSpan = 180;
    const startRating = Math.max(1500, currentRating - 700); // Start 700 points lower
    const startDate = new Date(Date.now() - daysSpan * 24 * 60 * 60 * 1000);

    let ratingValue = startRating;
    const ratingHistory = [];

    console.log(`\n📊 Generating ${totalPoints} rating history points...`);
    console.log(`   Start rating: ${startRating}`);
    console.log(`   Target rating: ${currentRating}`);
    console.log(`   Time span: ${daysSpan} days\n`);

    for (let i = 1; i <= totalPoints; i++) {
      const progress = (i - 1) / (totalPoints - 1);
      const daysAgo = daysSpan * (1 - progress);
      const matchDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      // Calculate target rating (gradual increase from start to current)
      const targetRating = Math.floor(startRating + (currentRating - startRating) * progress);

      // Simulate wins and losses with realistic variance
      const isWinner = (i % 4) !== 0; // Win 3 out of 4 matches

      let ratingChange;
      if (isWinner) {
        // Win: gain 8-25 points
        ratingChange = 8 + (i % 17);
      } else {
        // Loss: lose 5-15 points
        ratingChange = -(5 + (i % 10));
      }

      // Apply change
      ratingValue = ratingValue + ratingChange;

      // Smooth the rating toward target (prevents too much deviation)
      const deviation = targetRating - ratingValue;
      ratingValue = ratingValue + Math.floor(deviation * 0.3);

      // Ensure rating stays within reasonable bounds
      ratingValue = Math.max(1200, Math.min(currentRating + 100, ratingValue));

      // Create a match for this date
      const matchResult = await pool.query(`
        INSERT INTO matches (
          tournament_id,
          player1_id,
          player2_id,
          winner_id,
          status,
          start_time,
          end_time,
          round,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        tournamentId,
        leonidId,
        opponentId,
        isWinner ? leonidId : opponentId,
        'completed',
        matchDate.toISOString(),
        new Date(matchDate.getTime() + 30 * 60 * 1000).toISOString(),
        'Group Stage',
        matchDate.toISOString()
      ]);

      const matchId = matchResult.rows[0].id;

      // Insert rating history
      await pool.query(`
        INSERT INTO player_rating_history (
          player_id,
          rating,
          recorded_at,
          match_id
        ) VALUES ($1, $2, $3, $4)
      `, [
        leonidId,
        Math.round(ratingValue),
        matchDate.toISOString(),
        matchId
      ]);

      ratingHistory.push({
        date: matchDate,
        rating: Math.round(ratingValue)
      });

      if (i % 10 === 0 || i === 1 || i === totalPoints) {
        console.log(`   Point ${i}/${totalPoints}: rating ${Math.round(ratingValue)} at ${matchDate.toISOString().split('T')[0]}`);
      }
    }

    // Add final point with current rating
    await pool.query(`
      INSERT INTO player_rating_history (
        player_id,
        rating,
        recorded_at
      ) VALUES ($1, $2, $3)
    `, [
      leonidId,
      currentRating,
      new Date().toISOString()
    ]);

    ratingHistory.push({
      date: new Date(),
      rating: currentRating
    });

    // Update player stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as games_played,
        COUNT(*) FILTER (WHERE winner_id = $1) as wins,
        COUNT(*) FILTER (WHERE (player1_id = $1 OR player2_id = $1) AND winner_id != $1 AND winner_id IS NOT NULL) as losses
      FROM matches
      WHERE player1_id = $1 OR player2_id = $1
    `, [leonidId]);

    const stats = statsResult.rows[0];
    const winRate = stats.games_played > 0 
      ? (parseFloat(stats.wins) / parseFloat(stats.games_played) * 100).toFixed(2)
      : 0;

    await pool.query(`
      UPDATE players 
      SET 
        rating = $1,
        games_played = $2,
        wins = $3,
        losses = $4,
        win_rate = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [
      currentRating,
      parseInt(stats.games_played),
      parseInt(stats.wins),
      parseInt(stats.losses),
      parseFloat(winRate),
      leonidId
    ]);

    // Summary
    const minRating = Math.min(...ratingHistory.map(r => r.rating));
    const maxRating = Math.max(...ratingHistory.map(r => r.rating));

    console.log(`\n✅ Rating history updated successfully!`);
    console.log(`   Total points: ${ratingHistory.length}`);
    console.log(`   Rating range: ${minRating} - ${maxRating}`);
    console.log(`   Rating change: ${maxRating - minRating} points`);
    console.log(`   Games played: ${stats.games_played}`);
    console.log(`   Wins: ${stats.wins}, Losses: ${stats.losses}`);
    console.log(`   Win rate: ${winRate}%\n`);

  } catch (error) {
    console.error('❌ Error updating rating history:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
updateLeonidRatingHistory();

