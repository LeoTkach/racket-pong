const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function createNovember16Tournament() {
  try {
    console.log('🏓 Creating November 16, 2025 tournament...');

    // Get leonidtkach as organizer (ID: 5)
    const organizerResult = await pool.query('SELECT id, username, full_name FROM players WHERE username = $1 OR id = $2', ['leonidtkach', 5]);
    let organizer;
    
    if (organizerResult.rows.length > 0) {
      organizer = organizerResult.rows[0];
    } else {
      // Fallback to first player if leonidtkach not found
      const fallbackResult = await pool.query('SELECT id, username, full_name FROM players ORDER BY id LIMIT 1');
      if (fallbackResult.rows.length === 0) {
        console.log('❌ No players in database. Please run add-more-players.js first.');
        return;
      }
      organizer = fallbackResult.rows[0];
    }
    
    // Get players for participants
    const playersResult = await pool.query('SELECT id, username, full_name FROM players ORDER BY rating DESC LIMIT 10');
    const players = playersResult.rows;
    
    if (players.length < 5) {
      console.log('❌ Not enough players in database. Please run add-more-players.js first.');
      return;
    }

    console.log(`📊 Organizer: ${organizer.username} (ID: ${organizer.id})`);
    console.log(`📊 Found ${players.length} players for participants`);

    // Delete existing tournament with same name and date if exists
    await pool.query(
      'DELETE FROM tournaments WHERE name = $1 AND date = $2',
      ['Group Stage & Playoffs', '2025-11-16']
    );
    console.log('🗑️  Deleted existing tournament if any');

    // Create tournament
    const result = await pool.query(`
      INSERT INTO tournaments (
        name, 
        date, 
        time, 
        location, 
        venue, 
        status, 
        format, 
        match_format, 
        max_participants, 
        description, 
        organizer_id,
        num_groups,
        players_per_group_advance
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [
      'Group Stage & Playoffs',
      '2025-11-16',
      '18:00:00',
      'New York, USA',
      'Madison Square Garden',
      'upcoming', // НЕ ongoing, пользователь сам переведет
      'group-stage',
      'best-of-5',
      5,
      'Group stage tournament with 5 players, 2 groups, 1 player advancing per group',
      organizer.id, // Use leonidtkach as organizer
      2, // num_groups
      1  // players_per_group_advance
    ]);
    
    const tournamentId = result.rows[0].id;
    console.log(`✅ Created tournament: Group Stage & Playoffs (ID: ${tournamentId})`);

    // Add 5 participants
    const tournamentPlayers = players.slice(0, 5);
    
    for (const player of tournamentPlayers) {
      await pool.query(`
        INSERT INTO tournament_participants (tournament_id, player_id)
        VALUES ($1, $2)
        ON CONFLICT (tournament_id, player_id) DO NOTHING
      `, [tournamentId, player.id]);
    }
    
    // Update current_participants count
    await pool.query(`
      UPDATE tournaments 
      SET current_participants = $1 
      WHERE id = $2
    `, [5, tournamentId]);
    
    console.log(`👥 Added 5 participants to tournament`);
    console.log(`📋 Tournament settings: 2 groups, 1 player advancing per group`);
    console.log(`✅ Tournament created successfully! ID: ${tournamentId}`);
    console.log(`⚠️  Tournament status: upcoming (you can change it to ongoing when ready)`);
    
  } catch (error) {
    console.error('❌ Error creating tournament:', error);
  } finally {
    await pool.end();
  }
}

createNovember16Tournament();

