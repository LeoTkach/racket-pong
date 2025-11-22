const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432
});

async function updateAllPlayersStats() {
  try {
    console.log('🔄 Updating player statistics based on actual matches...\n');
    
    // Get all players
    const playersResult = await pool.query(`
      SELECT id, username, full_name
      FROM players
      ORDER BY id
    `);
    
    console.log(`Found ${playersResult.rows.length} players\n`);
    
    let updatedCount = 0;
    
    // Update stats for each player
    for (const player of playersResult.rows) {
      try {
        // Calculate actual stats from matches
        const statsResult = await pool.query(`
          SELECT 
            COUNT(*) FILTER (WHERE status = 'completed' AND winner_id IS NOT NULL) as games_played,
            COUNT(*) FILTER (WHERE winner_id = $1) as wins,
            COUNT(*) FILTER (WHERE (player1_id = $1 OR player2_id = $1) 
                              AND winner_id != $1 
                              AND winner_id IS NOT NULL 
                              AND status = 'completed') as losses
          FROM matches
          WHERE (player1_id = $1 OR player2_id = $1)
        `, [player.id]);
        
        const stats = statsResult.rows[0];
        const gamesPlayed = parseInt(stats.games_played) || 0;
        const wins = parseInt(stats.wins) || 0;
        const losses = parseInt(stats.losses) || 0;
        const winRate = gamesPlayed > 0 
          ? parseFloat(((wins / gamesPlayed) * 100).toFixed(2))
          : 0;
        
        // Update player stats
        await pool.query(`
          UPDATE players 
          SET 
            games_played = $1,
            wins = $2,
            losses = $3,
            win_rate = $4,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
        `, [gamesPlayed, wins, losses, winRate, player.id]);
        
        updatedCount++;
        
        if (updatedCount % 10 === 0 || updatedCount === 1 || updatedCount === playersResult.rows.length) {
          console.log(`   Updated ${updatedCount}/${playersResult.rows.length} players`);
        }
        
      } catch (playerError) {
        console.error(`   ⚠️ Error updating stats for player ${player.id} (${player.full_name}):`, playerError.message);
      }
    }
    
    console.log(`\n✅ Updated statistics for ${updatedCount} players`);
    
    // Show summary
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_players,
        SUM(games_played) as total_games,
        SUM(wins) as total_wins,
        SUM(losses) as total_losses,
        AVG(win_rate)::NUMERIC(5,2) as avg_win_rate
      FROM players
    `);
    
    const summary = summaryResult.rows[0];
    console.log('\n📊 Summary:');
    console.log(`   Total players: ${summary.total_players}`);
    console.log(`   Total games: ${summary.total_games}`);
    console.log(`   Total wins: ${summary.total_wins}`);
    console.log(`   Total losses: ${summary.total_losses}`);
    console.log(`   Average win rate: ${summary.avg_win_rate}%`);
    
    // Show top 5 players by games played
    const topPlayersResult = await pool.query(`
      SELECT username, full_name, games_played, wins, losses, win_rate
      FROM players
      WHERE games_played > 0
      ORDER BY games_played DESC
      LIMIT 5
    `);
    
    if (topPlayersResult.rows.length > 0) {
      console.log('\n🏆 Top 5 players by games played:');
      topPlayersResult.rows.forEach((p, i) => {
        console.log(`   ${i+1}. ${p.full_name}: ${p.games_played} games (${p.wins}W/${p.losses}L, ${p.win_rate}%)`);
      });
    }
    
    console.log('\n🎉 All done!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

updateAllPlayersStats()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });



