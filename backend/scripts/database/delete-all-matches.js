const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function deleteAllMatches() {
  try {
    const t = await pool.query(
      "SELECT id FROM tournaments WHERE LOWER(name) = LOWER('qwe') ORDER BY date DESC LIMIT 1"
    );
    
    if (t.rows.length === 0) {
      console.log('Tournament not found');
      return;
    }
    
    const tournamentId = t.rows[0].id;
    let totalDeleted = 0;
    let remaining = 999;
    let iteration = 0;
    let res = null;
    
    while (remaining > 0 && iteration < 500) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Delete match_scores first
        await client.query(
          'DELETE FROM match_scores WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = $1)',
          [tournamentId]
        );
        
        // Delete matches
        res = await client.query(
          'DELETE FROM matches WHERE tournament_id = $1',
          [tournamentId]
        );
        
        totalDeleted += res.rowCount;
        await client.query('COMMIT');
        
        // Check remaining
        const count = await client.query(
          'SELECT COUNT(*) as count FROM matches WHERE tournament_id = $1',
          [tournamentId]
        );
        remaining = parseInt(count.rows[0].count);
        iteration++;
        
        if (iteration % 20 === 0 || remaining === 0 || res.rowCount === 0) {
          console.log(`Iteration ${iteration}: Deleted ${res.rowCount}, Remaining: ${remaining}`);
        }
        
        // If no more matches were deleted and still have remaining, try to break
        if (res.rowCount === 0 && remaining > 0) {
          console.log('No more matches deleted but still have matches. Trying one more time...');
          // Try one more direct delete
          const finalRes = await client.query(
            'DELETE FROM matches WHERE tournament_id = $1',
            [tournamentId]
          );
          if (finalRes.rowCount === 0) {
            break;
          }
        }
      } catch (e) {
        await client.query('ROLLBACK');
        console.error(`Error in iteration ${iteration}:`, e.message);
      } finally {
        client.release();
      }
      
      // Safety break if no progress
      if (res && res.rowCount === 0 && remaining > 0) {
        console.log('Breaking: no more matches can be deleted');
        break;
      }
    }
    
    console.log(`\n✅ Total deleted: ${totalDeleted} matches in ${iteration} iterations`);
    const final = await pool.query(
      'SELECT COUNT(*) as count FROM matches WHERE tournament_id = $1',
      [tournamentId]
    );
    console.log(`✅ Final remaining matches: ${final.rows[0].count}`);
    
    if (parseInt(final.rows[0].count) > 0) {
      console.log('\n⚠️  Some matches remain. Checking if they belong to this tournament...');
      const remainingMatches = await pool.query(
        'SELECT id, round, status FROM matches WHERE tournament_id = $1 LIMIT 10',
        [tournamentId]
      );
      console.log('Sample remaining matches:', remainingMatches.rows);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

deleteAllMatches();


