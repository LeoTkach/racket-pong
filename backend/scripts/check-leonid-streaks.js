const pool = require('../server/config/database');

async function checkLeonidStreaks() {
  try {
    console.log('🔥 Checking Leonid Tkach win streaks...\n');

    // Get player data
    const playerResult = await pool.query(`
      SELECT id, username, full_name, current_streak, best_streak
      FROM players
      WHERE username = 'leonidtkach' OR full_name ILIKE '%leonid%tkach%'
    `);

    if (playerResult.rows.length === 0) {
      console.log('❌ Player not found');
      return;
    }

    const player = playerResult.rows[0];
    console.log('📊 Player Info:');
    console.log(`   ID: ${player.id}`);
    console.log(`   Username: ${player.username}`);
    console.log(`   Full Name: ${player.full_name}`);
    console.log('');
    console.log('📈 Stored Streaks (from database):');
    console.log(`   Current Streak: ${player.current_streak}`);
    console.log(`   Best Streak: ${player.best_streak}`);
    console.log('');

    // Get all matches ordered by date to calculate streaks manually
    const matchesResult = await pool.query(`
      SELECT 
        m.id,
        m.winner_id,
        m.player1_id,
        m.player2_id,
        m.status,
        t.name as tournament_name,
        t.date as tournament_date
      FROM matches m
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      WHERE (m.player1_id = $1 OR m.player2_id = $1)
        AND m.status = 'completed'
        AND m.winner_id IS NOT NULL
      ORDER BY t.date ASC, m.id ASC
    `, [player.id]);

    console.log(`📋 Total completed matches: ${matchesResult.rows.length}\n`);

    // Calculate streaks manually
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    const results = [];

    matchesResult.rows.forEach((match, index) => {
      const isWin = match.winner_id === player.id;
      
      if (isWin) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }

      results.push({
        matchNum: index + 1,
        matchId: match.id,
        tournament: match.tournament_name,
        date: match.tournament_date,
        result: isWin ? '✅ WIN' : '❌ LOSS',
        streakAfter: isWin ? tempStreak : 0
      });
    });

    // Current streak is the last streak value
    currentStreak = tempStreak;

    console.log('🔢 Calculated Streaks (from matches):');
    console.log(`   Current Streak: ${currentStreak}`);
    console.log(`   Max Streak: ${maxStreak}`);
    console.log('');

    console.log('📝 Match Results (chronological order):');
    results.forEach(r => {
      const streakInfo = r.streakAfter > 0 ? ` (Streak: ${r.streakAfter})` : '';
      console.log(`   ${r.matchNum}. ${r.result} - ${r.tournament} (${r.date})${streakInfo}`);
    });
    console.log('');

    // Show discrepancy
    if (currentStreak !== player.current_streak || maxStreak !== player.best_streak) {
      console.log('⚠️  DISCREPANCY FOUND!');
      console.log(`   Database shows: Current=${player.current_streak}, Best=${player.best_streak}`);
      console.log(`   Calculated:     Current=${currentStreak}, Best=${maxStreak}`);
      console.log('');
      console.log('💡 This means the database needs to be updated with recalculate_player_streaks()');
    } else {
      console.log('✅ Streaks match! Database is correct.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkLeonidStreaks();
