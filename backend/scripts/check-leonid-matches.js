const pool = require('../server/config/database');

async function checkLeonidMatches() {
  try {
    console.log('🔍 Checking Leonid Tkach matches...\n');

    // Get player data
    const playerResult = await pool.query(`
      SELECT id, username, full_name, wins, losses, games_played, win_rate
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

    // Get all matches for this player
    const matchesResult = await pool.query(`
      SELECT 
        m.id,
        m.tournament_id,
        m.player1_id,
        m.player2_id,
        m.winner_id,
        m.status,
        m.round,
        t.name as tournament_name,
        t.status as tournament_status
      FROM matches m
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      WHERE (m.player1_id = $1 OR m.player2_id = $1)
      ORDER BY m.id DESC
    `, [player.id]);

    console.log(`📋 Total matches in database: ${matchesResult.rows.length}\n`);

    // Count by status
    const statusCounts = {};
    const completedWithWinner = [];
    const completedWithoutWinner = [];
    const otherMatches = [];

    matchesResult.rows.forEach(match => {
      statusCounts[match.status] = (statusCounts[match.status] || 0) + 1;
      
      if (match.status === 'completed' && match.winner_id) {
        completedWithWinner.push(match);
      } else if (match.status === 'completed' && !match.winner_id) {
        completedWithoutWinner.push(match);
      } else {
        otherMatches.push(match);
      }
    });

    console.log('📊 Matches by status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log('');

    console.log(`✅ Completed with winner: ${completedWithWinner.length}`);
    console.log(`⚠️  Completed without winner: ${completedWithoutWinner.length}`);
    console.log(`⏳ Other (pending/scheduled): ${otherMatches.length}`);
    console.log('');

    // Calculate stats from completed matches with winner
    const wins = completedWithWinner.filter(m => m.winner_id === player.id).length;
    const losses = completedWithWinner.filter(m => m.winner_id !== player.id).length;
    const gamesPlayed = completedWithWinner.length;
    const winRate = gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(2) : 0;

    console.log('🎯 Calculated Stats (from completed matches with winner):');
    console.log(`   Wins: ${wins}`);
    console.log(`   Losses: ${losses}`);
    console.log(`   Games Played: ${gamesPlayed}`);
    console.log(`   Win Rate: ${winRate}%`);
    console.log('');

    console.log('💾 Database Stats:');
    console.log(`   DB Wins: ${player.wins}`);
    console.log(`   DB Losses: ${player.losses}`);
    console.log(`   DB Games Played: ${player.games_played}`);
    console.log(`   DB Win Rate: ${player.win_rate}%`);
    console.log('');

    // Show discrepancy
    if (gamesPlayed !== player.games_played) {
      console.log('⚠️  DISCREPANCY FOUND!');
      console.log(`   Frontend shows: ${player.games_played} games`);
      console.log(`   Actual completed matches: ${gamesPlayed} games`);
      console.log('');
    }

    // Show some sample matches
    if (completedWithWinner.length > 0) {
      console.log('📝 Sample completed matches (last 5):');
      completedWithWinner.slice(0, 5).forEach(match => {
        const isWinner = match.winner_id === player.id;
        const result = isWinner ? '✅ WIN' : '❌ LOSS';
        console.log(`   Match ${match.id}: ${result} - Tournament: ${match.tournament_name || 'N/A'} (${match.tournament_status})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkLeonidMatches();
