const pool = require('../server/config/database');

async function checkMatchRounds() {
  try {
    console.log('🔍 Checking match rounds...\n');

    const playerId = 5; // Leonid Tkach

    const result = await pool.query(`
      SELECT 
        m.id,
        m.winner_id,
        m.round,
        t.id as tournament_id,
        t.name as tournament_name,
        t.date as tournament_date,
        CASE WHEN m.winner_id = $1 THEN 'WIN' ELSE 'LOSS' END as result
      FROM matches m
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      WHERE (m.player1_id = $1 OR m.player2_id = $1)
        AND m.status = 'completed'
        AND m.winner_id IS NOT NULL
      ORDER BY t.date ASC, t.id ASC, m.id ASC
    `, [playerId]);

    console.log(`📋 Total matches: ${result.rows.length}\n`);
    
    // Group by tournament
    const byTournament = {};
    result.rows.forEach(match => {
      if (!byTournament[match.tournament_id]) {
        byTournament[match.tournament_id] = {
          name: match.tournament_name,
          date: match.tournament_date,
          matches: []
        };
      }
      byTournament[match.tournament_id].matches.push(match);
    });

    Object.values(byTournament).forEach(tournament => {
      console.log(`\n🏆 ${tournament.name} (${tournament.date})`);
      tournament.matches.forEach(match => {
        const resultIcon = match.result === 'WIN' ? '✅' : '❌';
        console.log(`   ${resultIcon} ${match.result} - Round: ${match.round || 'N/A'} [Match ID: ${match.id}]`);
      });
    });

    console.log('\n\n💡 PROBLEM: Matches within the same tournament have the same date.');
    console.log('   The sorting by date alone cannot determine the correct match order.');
    console.log('   Need to use round information or match_number for proper ordering.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkMatchRounds();
