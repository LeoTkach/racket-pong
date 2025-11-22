const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'table_tennis_tournament',
  user: process.env.DB_USER || 'leonidtkach',
  password: process.env.DB_PASSWORD || '',
});

async function addParticipantsToTournament() {
  try {
    // Find tournament by ID, name and date, or just date
    const tournamentId = null; // Dendron tournament
    const tournamentName = 'Dendron';
    const tournamentDate = '2025-11-24';
    
    console.log(`🔍 Looking for tournament "${tournamentName}" on ${tournamentDate}...`);
    
    // Try to find by ID first (if provided)
    let tournamentResult = { rows: [] };
    if (tournamentId) {
      tournamentResult = await pool.query(`
        SELECT id, name, date, max_participants, current_participants, status
        FROM tournaments 
        WHERE id = $1
      `, [tournamentId]);
    }
    
    // If not found by ID, try by name and date
    if (tournamentResult.rows.length === 0) {
      if (tournamentId) {
        console.log(`   Tournament ID ${tournamentId} not found, trying name and date...`);
      }
      tournamentResult = await pool.query(`
        SELECT id, name, date, max_participants, current_participants, status
        FROM tournaments 
        WHERE LOWER(name) = LOWER($1) AND date = $2
      `, [tournamentName, tournamentDate]);
    }
    
    // If still not found, try by date only
    if (tournamentResult.rows.length === 0) {
      console.log(`   Tournament "${tournamentName}" not found, trying date ${tournamentDate}...`);
      tournamentResult = await pool.query(`
        SELECT id, name, date, max_participants, current_participants, status
        FROM tournaments 
        WHERE date = $1
        ORDER BY id DESC
        LIMIT 1
      `, [tournamentDate]);
    }
    
    if (tournamentResult.rows.length === 0) {
      console.error(`❌ Tournament "${tournamentName}" on ${tournamentDate} not found`);
      console.log('Available tournaments:');
      const allTournaments = await pool.query(`
        SELECT id, name, date, current_participants, max_participants 
        FROM tournaments 
        ORDER BY date DESC, name
      `);
      allTournaments.rows.forEach(t => {
        console.log(`  - ID: ${t.id}, "${t.name}" on ${t.date} (${t.current_participants}/${t.max_participants} participants)`);
      });
      return;
    }
    
    const tournament = tournamentResult.rows[0];
    console.log(`✅ Found tournament: "${tournament.name}" (ID: ${tournament.id})`);
    console.log(`   Status: ${tournament.status}`);
    console.log(`   Current participants: ${tournament.current_participants}/${tournament.max_participants}`);
    
    // Get available players (exclude those already registered)
    const availablePlayersResult = await pool.query(`
      SELECT p.id, p.username, p.full_name, p.rating
      FROM players p
      WHERE p.id NOT IN (
        SELECT tp.player_id 
        FROM tournament_participants tp 
        WHERE tp.tournament_id = $1
      )
      ORDER BY p.rating DESC
      LIMIT $2
    `, [tournament.id, tournament.max_participants - tournament.current_participants]);
    
    const availablePlayers = availablePlayersResult.rows;
    console.log(`\n👥 Available players: ${availablePlayers.length}`);
    
    if (availablePlayers.length === 0) {
      console.log('⚠️  No available players to add');
      return;
    }
    
    // Add participants
    let addedCount = 0;
    for (const player of availablePlayers) {
      try {
        await pool.query(`
          INSERT INTO tournament_participants (tournament_id, player_id)
          VALUES ($1, $2)
          ON CONFLICT (tournament_id, player_id) DO NOTHING
        `, [tournament.id, player.id]);
        
        // Check if actually inserted
        const checkResult = await pool.query(`
          SELECT COUNT(*) as count
          FROM tournament_participants
          WHERE tournament_id = $1 AND player_id = $2
        `, [tournament.id, player.id]);
        
        if (parseInt(checkResult.rows[0].count) > 0) {
          addedCount++;
          console.log(`   ✅ Added: ${player.full_name || player.username} (Rating: ${player.rating})`);
        }
      } catch (err) {
        console.error(`   ❌ Error adding ${player.full_name || player.username}:`, err.message);
      }
    }
    
    // Update participant count
    const finalCountResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM tournament_participants
      WHERE tournament_id = $1
    `, [tournament.id]);
    
    const finalCount = parseInt(finalCountResult.rows[0].count);
    
    await pool.query(`
      UPDATE tournaments 
      SET current_participants = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [finalCount, tournament.id]);
    
    console.log(`\n✅ Successfully added ${addedCount} participants`);
    console.log(`📊 Tournament now has ${finalCount}/${tournament.max_participants} participants`);
    
  } catch (error) {
    console.error('❌ Error adding participants:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
addParticipantsToTournament();

