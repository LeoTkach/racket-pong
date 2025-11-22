const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'table_tennis_tournament',
  user: process.env.DB_USER || 'leonidtkach',
  password: process.env.DB_PASSWORD || '',
});

async function resetTournament() {
  try {
    const tournamentId = 12;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Удаляем матчи
      const deleteResult = await client.query('DELETE FROM matches WHERE tournament_id = $1', [tournamentId]);
      console.log(`✅ Deleted ${deleteResult.rowCount} matches`);
      
      // Возвращаем статус в upcoming
      await client.query('UPDATE tournaments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['upcoming', tournamentId]);
      console.log('✅ Tournament status reset to upcoming');
      
      await client.query('COMMIT');
      
      // Проверяем результат
      const tournament = await pool.query('SELECT id, name, status FROM tournaments WHERE id = $1', [tournamentId]);
      const matches = await pool.query('SELECT COUNT(*) as count FROM matches WHERE tournament_id = $1', [tournamentId]);
      
      console.log('\n📊 Final state:');
      console.log(`  Tournament: ${tournament.rows[0].name} (ID: ${tournament.rows[0].id})`);
      console.log(`  Status: ${tournament.rows[0].status}`);
      console.log(`  Matches: ${matches.rows[0].count}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

resetTournament();





