const pool = require('../server/config/database');

async function verifyNewStreakOrder() {
  try {
    console.log('🔍 Verifying new streak calculation order...\n');

    const playerId = 5; // Leonid Tkach

    // Test the new ordering
    const result = await pool.query(`
      SELECT 
        m.id,
        m.winner_id,
        m.round,
        t.name as tournament_name,
        t.date as tournament_date,
        CASE WHEN m.winner_id = $1 THEN 'WIN' ELSE 'LOSS' END as result,
        CASE 
          WHEN m.round ILIKE '%group%' OR m.round ILIKE '%round%robin%' THEN 1
          WHEN m.round ILIKE '%round%16%' OR m.round ILIKE '%16%' THEN 2
          WHEN m.round ILIKE '%quarter%' THEN 3
          WHEN m.round ILIKE '%semi%' THEN 4
          WHEN m.round ILIKE '%third%place%' THEN 5
          WHEN m.round ILIKE '%final%' THEN 6
          ELSE 0
        END as round_order
      FROM matches m
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      WHERE (m.player1_id = $1 OR m.player2_id = $1)
        AND m.status = 'completed'
        AND m.winner_id IS NOT NULL
      ORDER BY 
        COALESCE(m.end_time, m.start_time, t.date) DESC,
        round_order DESC,
        m.id DESC
    `, [playerId]);

    console.log('📝 Matches in NEW DESC ORDER (for current streak):');
    let currentStreakTest = 0;
    result.rows.forEach((match, index) => {
      const resultIcon = match.result === 'WIN' ? '✅' : '❌';
      const roundInfo = match.round_order > 0 ? ` [Order: ${match.round_order}]` : '';
      
      if (match.result === 'WIN' && currentStreakTest === index) {
        currentStreakTest++;
      }
      
      console.log(`   ${index + 1}. ${resultIcon} ${match.result} - ${match.tournament_name} - ${match.round}${roundInfo} [ID: ${match.id}]`);
    });
    
    console.log(`\n🔥 Current Streak (counting from top): ${currentStreakTest}`);

    // Now ASC for best streak
    const ascResult = await pool.query(`
      SELECT 
        m.id,
        m.winner_id,
        m.round,
        t.name as tournament_name,
        CASE WHEN m.winner_id = $1 THEN 'WIN' ELSE 'LOSS' END as result,
        CASE 
          WHEN m.round ILIKE '%group%' OR m.round ILIKE '%round%robin%' THEN 1
          WHEN m.round ILIKE '%round%16%' OR m.round ILIKE '%16%' THEN 2
          WHEN m.round ILIKE '%quarter%' THEN 3
          WHEN m.round ILIKE '%semi%' THEN 4
          WHEN m.round ILIKE '%third%place%' THEN 5
          WHEN m.round ILIKE '%final%' THEN 6
          ELSE 0
        END as round_order
      FROM matches m
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      WHERE (m.player1_id = $1 OR m.player2_id = $1)
        AND m.status = 'completed'
        AND m.winner_id IS NOT NULL
      ORDER BY 
        COALESCE(m.end_time, m.start_time, t.date) ASC,
        round_order ASC,
        m.id ASC
    `, [playerId]);

    console.log('\n📝 Matches in NEW ASC ORDER (for best streak):');
    let runningStreak = 0;
    let bestStreakTest = 0;
    ascResult.rows.forEach((match, index) => {
      const resultIcon = match.result === 'WIN' ? '✅' : '❌';
      const roundInfo = match.round_order > 0 ? ` [Order: ${match.round_order}]` : '';
      
      if (match.result === 'WIN') {
        runningStreak++;
        bestStreakTest = Math.max(bestStreakTest, runningStreak);
      } else {
        runningStreak = 0;
      }
      
      const streakInfo = runningStreak > 0 ? ` (Streak: ${runningStreak})` : '';
      console.log(`   ${index + 1}. ${resultIcon} ${match.result} - ${match.tournament_name} - ${match.round}${roundInfo} [ID: ${match.id}]${streakInfo}`);
    });
    
    console.log(`\n🏆 Best Streak: ${bestStreakTest}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

verifyNewStreakOrder();
