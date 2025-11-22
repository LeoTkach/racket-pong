const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'table_tennis_tournament',
  user: process.env.DB_USER || 'leonidtkach',
  password: process.env.DB_PASSWORD || '',
});

async function checkDuplicates() {
  try {
    const tournamentId = 4;
    
    // Проверяем дубликаты матчей
    const duplicates = await pool.query(`
      SELECT tournament_id, round, player1_id, player2_id, COUNT(*) as count
      FROM matches
      WHERE tournament_id = $1
      GROUP BY tournament_id, round, player1_id, player2_id
      HAVING COUNT(*) > 1
    `, [tournamentId]);
    
    console.log('Duplicate matches found:');
    duplicates.rows.forEach(dup => {
      console.log(`  Round: ${dup.round}, P1: ${dup.player1_id}, P2: ${dup.player2_id}, Count: ${dup.count}`);
    });
    
    if (duplicates.rows.length > 0) {
      // Удаляем дубликаты, оставляя только самый новый матч
      for (const dup of duplicates.rows) {
        const matches = await pool.query(`
          SELECT id FROM matches
          WHERE tournament_id = $1 
            AND round = $2 
            AND player1_id = $3 
            AND player2_id = $4
          ORDER BY id DESC
        `, [tournamentId, dup.round, dup.player1_id, dup.player2_id]);
        
        // Удаляем все кроме первого (самого нового)
        if (matches.rows.length > 1) {
          const idsToDelete = matches.rows.slice(1).map(m => m.id);
          await pool.query(`
            DELETE FROM matches WHERE id = ANY($1)
          `, [idsToDelete]);
          console.log(`✅ Removed ${idsToDelete.length} duplicate matches (kept ID: ${matches.rows[0].id})`);
        }
      }
    } else {
      console.log('✅ No duplicate matches found');
    }
    
    // Показываем все матчи
    const allMatches = await pool.query(`
      SELECT id, round, player1_id, player2_id, status, winner_id
      FROM matches
      WHERE tournament_id = $1
      ORDER BY round, id
    `, [tournamentId]);
    
    console.log('\nAll matches:');
    allMatches.rows.forEach(m => {
      console.log(`  ID: ${m.id}, Round: ${m.round}, P1: ${m.player1_id}, P2: ${m.player2_id}, Status: ${m.status}, Winner: ${m.winner_id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkDuplicates();





