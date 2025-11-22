const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'table_tennis_tournament',
  user: process.env.DB_USER || 'leonidtkach',
  password: process.env.DB_PASSWORD || '',
});

async function createMatches() {
  try {
    const tournamentId = 4;
    
    // Проверяем турнир
    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [tournamentId]);
    if (tournament.rows.length === 0) {
      console.log('❌ Tournament not found');
      return;
    }
    
    const t = tournament.rows[0];
    console.log(`Tournament: ${t.name} (ID: ${t.id})`);
    console.log(`Format: ${t.format}`);
    console.log(`Status: ${t.status}`);
    
    // Проверяем существующие матчи
    const existingMatches = await pool.query('SELECT COUNT(*) as count FROM matches WHERE tournament_id = $1', [tournamentId]);
    const existingCount = parseInt(existingMatches.rows[0].count);
    console.log(`Existing matches: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log('⚠️  Matches already exist, skipping');
      return;
    }
    
    // Получаем участников
    const participants = await pool.query(`
      SELECT tp.player_id, p.username, p.full_name, p.rating
      FROM tournament_participants tp
      JOIN players p ON tp.player_id = p.id
      WHERE tp.tournament_id = $1
      ORDER BY p.rating DESC
    `, [tournamentId]);
    
    const players = participants.rows;
    console.log(`\nParticipants: ${players.length}`);
    
    if (players.length < 2) {
      console.log('❌ Not enough players');
      return;
    }
    
    // Определяем раунд
    let roundName;
    if (players.length === 4) {
      roundName = 'Semifinals';
    } else if (players.length === 8) {
      roundName = 'Quarterfinals';
    } else if (players.length === 16) {
      roundName = 'Round of 16';
    } else if (players.length === 32) {
      roundName = 'Round of 32';
    } else {
      roundName = 'First Round';
    }
    
    console.log(`Round: ${roundName}`);
    console.log(`Expected matches: ${Math.floor(players.length / 2)}\n`);
    
    // Создаем матчи
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      let createdCount = 0;
      for (let i = 0; i < players.length; i += 2) {
        if (i + 1 < players.length) {
          const player1 = players[i];
          const player2 = players[i + 1];
          
          await client.query(`
            INSERT INTO matches (tournament_id, player1_id, player2_id, round, status)
            VALUES ($1, $2, $3, $4, 'scheduled')
          `, [tournamentId, player1.player_id, player2.player_id, roundName]);
          
          createdCount++;
          console.log(`✅ Created match: ${player1.full_name || player1.username} vs ${player2.full_name || player2.username}`);
        }
      }
      
      await client.query('COMMIT');
      console.log(`\n✅ Successfully created ${createdCount} matches`);
      
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

createMatches();





