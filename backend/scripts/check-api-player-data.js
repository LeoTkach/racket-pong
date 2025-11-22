const pool = require('../server/config/database');

async function checkPlayerAPIData() {
  try {
    console.log('🔍 Checking Player API Data for Leonid Tkach...\n');

    // Simulate the exact query from GET /api/players/:id endpoint
    const playerResult = await pool.query(`
      SELECT 
        p.id, p.username, p.full_name, p.email, p.country, p.avatar_url, p.rating, p.rank, p.ranking,
        p.max_points, p.best_ranking, p.join_date, p.bio, p.playing_style, p.favorite_shot,
        p.current_streak, p.best_streak,
        p.wins as db_wins,
        p.losses as db_losses,
        p.games_played as db_games_played,
        p.win_rate as db_win_rate,
        COALESCE(
          (SELECT COUNT(*) 
           FROM matches m 
           WHERE (m.player1_id = p.id OR m.player2_id = p.id) 
             AND m.status = 'completed' 
             AND m.winner_id IS NOT NULL), 
          0
        ) as calculated_games_played,
        COALESCE(
          (SELECT COUNT(*) 
           FROM matches m 
           WHERE m.winner_id = p.id 
             AND m.status = 'completed' 
             AND m.winner_id IS NOT NULL), 
          0
        ) as calculated_wins,
        COALESCE(
          (SELECT COUNT(*) 
           FROM matches m 
           WHERE (m.player1_id = p.id OR m.player2_id = p.id) 
             AND m.winner_id != p.id 
             AND m.winner_id IS NOT NULL 
             AND m.status = 'completed'), 
          0
        ) as calculated_losses
      FROM players p
      WHERE p.username = 'leonidtkach'
    `);

    if (playerResult.rows.length === 0) {
      console.log('❌ Player not found');
      return;
    }

    const player = playerResult.rows[0];
    
    console.log('📊 Player Database Fields:');
    console.log(`   DB Wins: ${player.db_wins}`);
    console.log(`   DB Losses: ${player.db_losses}`);
    console.log(`   DB Games Played: ${player.db_games_played}`);
    console.log(`   DB Win Rate: ${player.db_win_rate}%`);
    console.log('');

    console.log('🔢 Calculated from Matches (same as API /players):');
    console.log(`   Calculated Games Played: ${player.calculated_games_played}`);
    console.log(`   Calculated Wins: ${player.calculated_wins}`);
    console.log(`   Calculated Losses: ${player.calculated_losses}`);
    const calcWinRate = player.calculated_games_played > 0 
      ? ((player.calculated_wins / player.calculated_games_played) * 100).toFixed(2)
      : 0;
    console.log(`   Calculated Win Rate: ${calcWinRate}%`);
    console.log('');

    // Check matches API endpoint
    const matchesResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM matches m
      WHERE (m.player1_id = $1 OR m.player2_id = $1)
        AND m.status = 'completed'
        AND m.winner_id IS NOT NULL
    `, [player.id]);

    console.log('🎮 Matches API Endpoint Data (/players/:id/matches):');
    console.log(`   Total matches returned: ${matchesResult.rows[0].total}`);
    console.log('');

    // Show what would be sent by the API
    console.log('📡 API Response Summary:');
    console.log(`   What /api/players returns:`);
    console.log(`   - games_played: ${player.calculated_games_played}`);
    console.log(`   - wins: ${player.calculated_wins}`);
    console.log(`   - losses: ${player.calculated_losses}`);
    console.log(`   - win_rate: ${calcWinRate}%`);
    console.log('');
    console.log(`   What /api/players/:id/matches returns:`);
    console.log(`   - ${matchesResult.rows[0].total} matches`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkPlayerAPIData();
