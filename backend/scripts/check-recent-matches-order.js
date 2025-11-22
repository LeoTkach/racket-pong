const pool = require('../server/config/database');

async function checkRecentMatchesOrder() {
  try {
    console.log('🔍 Checking Recent Matches display order...\n');

    const playerId = 5; // Leonid Tkach

    // Get current streak from database
    const playerResult = await pool.query(`
      SELECT username, current_streak, best_streak
      FROM players
      WHERE id = $1
    `, [playerId]);

    const player = playerResult.rows[0];
    console.log('📊 Database Streaks:');
    console.log(`   Current Streak: ${player.current_streak}`);
    console.log(`   Best Streak: ${player.best_streak}`);
    console.log('');

    // Simulate the API query that frontend uses
    const matchesResult = await pool.query(`
      SELECT m.*, 
             p1.username as player1_username, p1.full_name as player1_name,
             p2.username as player2_username, p2.full_name as player2_name,
             winner.username as winner_username, winner.full_name as winner_name,
             t.name as tournament_name, t.id as tournament_id, t.date as tournament_date,
             ms.player1_scores, ms.player2_scores
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      LEFT JOIN players winner ON m.winner_id = winner.id
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      LEFT JOIN (
        SELECT DISTINCT ON (match_id) match_id, player1_scores, player2_scores
        FROM match_scores
        ORDER BY match_id, created_at DESC
      ) ms ON ms.match_id = m.id
      WHERE (m.player1_id = $1 OR m.player2_id = $1)
        AND m.status = 'completed'
        AND m.winner_id IS NOT NULL
      ORDER BY t.date DESC, m.id DESC
    `, [playerId]);

    console.log('📝 Recent Matches (as displayed in UI - newest first):');
    matchesResult.rows.forEach((match, index) => {
      const isWin = match.winner_id === playerId;
      const resultIcon = isWin ? '✅' : '❌';
      const result = isWin ? 'WIN' : 'LOSS';
      
      console.log(`   ${index + 1}. ${resultIcon} ${result} - ${match.tournament_name} (${match.tournament_date}) [Match ID: ${match.id}]`);
    });
    console.log('');

    // Calculate current streak from displayed matches
    let visualCurrentStreak = 0;
    for (const match of matchesResult.rows) {
      if (match.winner_id === playerId) {
        visualCurrentStreak++;
      } else {
        break; // Stop at first loss
      }
    }

    console.log('🔥 Visual Current Streak (counting from top):');
    console.log(`   ${visualCurrentStreak} wins`);
    console.log('');

    // Show discrepancy
    if (visualCurrentStreak !== player.current_streak) {
      console.log('⚠️  DISCREPANCY FOUND:');
      console.log(`   UI shows: ${visualCurrentStreak} consecutive wins`);
      console.log(`   Database says: ${player.current_streak} current streak`);
      console.log('');
      console.log('💡 This means either:');
      console.log('   1. The match order in UI is different from database calculation');
      console.log('   2. The streak calculation needs to be re-run');
      console.log('   3. There are matches not shown in Recent Matches');
    } else {
      console.log('✅ Visual streak matches database!');
    }

    // Now check what the improved streak function sees (DESC order)
    console.log('\n📊 What improved streak function sees (DESC order):');
    const functionOrderResult = await pool.query(`
      SELECT 
        m.id,
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
        COALESCE(m.end_time, m.start_time, t.date) DESC,
        (CASE 
          WHEN m.round ILIKE '%group%' OR m.round ILIKE '%round%robin%' THEN 1
          WHEN m.round ILIKE '%round%16%' OR m.round ILIKE '%16%' THEN 2
          WHEN m.round ILIKE '%quarter%' THEN 3
          WHEN m.round ILIKE '%semi%' THEN 4
          WHEN m.round ILIKE '%third%place%' THEN 5
          WHEN m.round ILIKE '%final%' THEN 6
          ELSE 0
        END) DESC,
        m.id DESC
      LIMIT 10
    `, [playerId]);

    let functionCurrentStreak = 0;
    functionOrderResult.rows.forEach((match, index) => {
      const resultIcon = match.result === 'WIN' ? '✅' : '❌';
      
      if (match.result === 'WIN' && functionCurrentStreak === index) {
        functionCurrentStreak++;
      }
      
      console.log(`   ${index + 1}. ${resultIcon} ${match.result} - ${match.tournament_name} - ${match.round} [Round Order: ${match.round_order}] [ID: ${match.id}]`);
    });
    
    console.log(`\n🔥 Function calculates: ${functionCurrentStreak} current streak`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkRecentMatchesOrder();
