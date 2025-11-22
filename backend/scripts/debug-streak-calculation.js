const pool = require('../server/config/database');

async function debugStreakCalculation() {
  try {
    console.log('🔍 Debugging streak calculation...\n');

    const playerId = 5; // Leonid Tkach

    // Check how matches are ordered by the function
    const result = await pool.query(`
      SELECT 
        m.id,
        m.winner_id,
        m.player1_id,
        m.player2_id,
        m.start_time,
        m.end_time,
        t.date as tournament_date,
        t.name as tournament_name,
        CASE WHEN m.winner_id = $1 THEN 1 ELSE 0 END as is_win,
        COALESCE(m.end_time, m.start_time, t.date) as sort_date
      FROM matches m
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      WHERE (m.player1_id = $1 OR m.player2_id = $1)
        AND m.status = 'completed'
        AND m.winner_id IS NOT NULL
      ORDER BY 
        COALESCE(m.end_time, m.start_time, t.date) ASC
    `, [playerId]);

    console.log(`📋 Total matches: ${result.rows.length}\n`);
    console.log('📝 Matches in ORDER BY ASC (oldest to newest):');
    result.rows.forEach((match, index) => {
      const result_text = match.is_win === 1 ? '✅ WIN' : '❌ LOSS';
      console.log(`   ${index + 1}. ${result_text} - ${match.tournament_name} (Sort: ${match.sort_date}) [Match ID: ${match.id}]`);
    });
    console.log('');

    // Now DESC for current streak
    const descResult = await pool.query(`
      SELECT 
        m.id,
        m.winner_id,
        t.name as tournament_name,
        CASE WHEN m.winner_id = $1 THEN 1 ELSE 0 END as is_win,
        COALESCE(m.end_time, m.start_time, t.date) as sort_date
      FROM matches m
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      WHERE (m.player1_id = $1 OR m.player2_id = $1)
        AND m.status = 'completed'
        AND m.winner_id IS NOT NULL
      ORDER BY 
        COALESCE(m.end_time, m.start_time, t.date) DESC
    `, [playerId]);

    console.log('📝 Matches in ORDER BY DESC (newest to oldest):');
    descResult.rows.forEach((match, index) => {
      const result_text = match.is_win === 1 ? '✅ WIN' : '❌ LOSS';
      console.log(`   ${index + 1}. ${result_text} - ${match.tournament_name} (Sort: ${match.sort_date}) [Match ID: ${match.id}]`);
    });
    console.log('');

    // Calculate streaks using DESC order (current streak)
    let currentStreak = 0;
    for (const match of descResult.rows) {
      if (match.is_win === 1) {
        currentStreak++;
      } else {
        break; // Stop at first loss
      }
    }

    console.log(`🔥 Current Streak from DESC: ${currentStreak}`);

    // Calculate best streak using ASC order
    let runningStreak = 0;
    let bestStreak = 0;
    for (const match of result.rows) {
      if (match.is_win === 1) {
        runningStreak++;
        bestStreak = Math.max(bestStreak, runningStreak);
      } else {
        runningStreak = 0;
      }
    }

    console.log(`🏆 Best Streak from ASC: ${bestStreak}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

debugStreakCalculation();
