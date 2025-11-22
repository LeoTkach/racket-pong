const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'table_tennis_tournament',
  user: process.env.DB_USER || 'leonidtkach',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Функция для обновления max_points и best_ranking для игрока
async function updatePlayerStats(playerId) {
  try {
    // Получаем текущие данные игрока
    const player = await pool.query(
      'SELECT wins, losses, ranking, rank FROM players WHERE id = $1',
      [playerId]
    );

    if (player.rows.length === 0) {
      throw new Error('Player not found');
    }

    const { wins, losses, ranking, rank } = player.rows[0];
    
    // Вычисляем текущие поинты
    const currentPoints = wins * 3 + losses * 1;
    
    // Определяем лучший рейтинг (меньшее число = лучше)
    const currentRanking = ranking || rank || null;
    
    // Обновляем max_points и best_ranking
    if (currentRanking !== null) {
      await pool.query(`
        UPDATE players 
        SET 
          max_points = GREATEST(COALESCE(max_points, 0), $1),
          best_ranking = CASE 
            WHEN best_ranking IS NULL THEN $2
            WHEN $2 < best_ranking THEN $2
            ELSE best_ranking
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [currentPoints, currentRanking, playerId]);
    } else {
      await pool.query(`
        UPDATE players 
        SET 
          max_points = GREATEST(COALESCE(max_points, 0), $1),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [currentPoints, playerId]);
    }
    
    console.log(`✅ Updated stats for player ${playerId}: max_points = ${currentPoints}, best_ranking = ${currentRanking}`);
  } catch (error) {
    console.error(`❌ Error updating stats for player ${playerId}:`, error.message);
    throw error;
  }
}

// Обновляем статистику для всех игроков
async function updateAllPlayersStats() {
  try {
    const players = await pool.query('SELECT id FROM players');
    
    for (const player of players.rows) {
      await updatePlayerStats(player.id);
    }
    
    console.log(`\n🎉 Updated stats for ${players.rows.length} players`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Если запущен напрямую, обновляем всех игроков
if (require.main === module) {
  updateAllPlayersStats();
}

module.exports = { updatePlayerStats };

