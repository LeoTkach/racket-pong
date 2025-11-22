const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function addNovemberTournaments() {
  try {
    console.log('🏓 Adding November 2025 tournaments...');

    // Get some players to use as organizers
    const playersResult = await pool.query('SELECT id, username, full_name FROM players ORDER BY rating DESC LIMIT 10');
    const players = playersResult.rows;
    
    if (players.length < 3) {
      console.log('❌ Not enough players in database. Please run add-more-players.js first.');
      return;
    }

    console.log(`📊 Found ${players.length} players for tournaments`);

    // Create tournaments for November 2025
    // Special day with all three statuses (November 15, 2025)
    const testDayTournaments = [
      {
        name: "Morning Championship - November",
        date: "2025-11-15",
        time: "09:00:00",
        location: "Tokyo, Japan",
        venue: "Tokyo Sports Center",
        status: "completed",
        format: "single-elimination",
        match_format: "best-of-3",
        max_participants: 16,
        description: "Completed morning tournament",
        organizer_id: players[0].id
      },
      {
        name: "Afternoon Live Tournament",
        date: "2025-11-15",
        time: "14:00:00",
        location: "Tokyo, Japan",
        venue: "Tokyo Sports Center",
        status: "ongoing",
        format: "round-robin",
        match_format: "best-of-5",
        max_participants: 12,
        description: "Currently ongoing tournament",
        organizer_id: players[1].id
      },
      {
        name: "Evening Championship",
        date: "2025-11-15",
        time: "19:00:00",
        location: "Tokyo, Japan",
        venue: "Tokyo Sports Center",
        status: "upcoming",
        format: "single-elimination",
        match_format: "best-of-3",
        max_participants: 16,
        description: "Upcoming evening tournament",
        organizer_id: players[2].id
      }
    ];

    // Additional tournaments throughout November
    const novemberTournaments = [
      {
        name: "November Open 2025",
        date: "2025-11-05",
        time: "10:00:00",
        location: "Berlin, Germany",
        venue: "Olympic Sports Complex",
        status: "completed",
        format: "single-elimination",
        match_format: "best-of-5",
        max_participants: 16,
        description: "November open championship",
        organizer_id: players[0].id
      },
      {
        name: "November Masters",
        date: "2025-11-08",
        time: "11:00:00",
        location: "New York, USA",
        venue: "Madison Square Garden",
        status: "ongoing",
        format: "group-stage",
        match_format: "best-of-3",
        max_participants: 20,
        description: "November masters tournament",
        organizer_id: players[1].id
      },
      {
        name: "November Cup",
        date: "2025-11-12",
        time: "13:00:00",
        location: "London, UK",
        venue: "Wembley Arena",
        status: "upcoming",
        format: "round-robin",
        match_format: "best-of-5",
        max_participants: 12,
        description: "November cup tournament",
        organizer_id: players[2].id
      },
      {
        name: "November Finals",
        date: "2025-11-18",
        time: "15:00:00",
        location: "Paris, France",
        venue: "Roland Garros",
        status: "upcoming",
        format: "single-elimination",
        match_format: "best-of-5",
        max_participants: 32,
        description: "November finals championship",
        organizer_id: players[0].id
      },
      {
        name: "November Weekend Tournament",
        date: "2025-11-22",
        time: "10:00:00",
        location: "Sydney, Australia",
        venue: "Sydney Olympic Park",
        status: "ongoing",
        format: "round-robin",
        match_format: "best-of-3",
        max_participants: 16,
        description: "Weekend tournament in Sydney",
        organizer_id: players[1].id
      },
      {
        name: "November Championship",
        date: "2025-11-25",
        time: "12:00:00",
        location: "Shanghai, China",
        venue: "Shanghai Sports Center",
        status: "upcoming",
        format: "single-elimination",
        match_format: "best-of-3",
        max_participants: 24,
        description: "November championship",
        organizer_id: players[2].id
      },
      {
        name: "November Grand Prix",
        date: "2025-11-28",
        time: "14:00:00",
        location: "Berlin, Germany",
        venue: "Olympic Sports Complex",
        status: "completed",
        format: "group-stage",
        match_format: "best-of-5",
        max_participants: 20,
        description: "November grand prix",
        organizer_id: players[0].id
      }
    ];

    // Combine all tournaments
    const allTournaments = [...testDayTournaments, ...novemberTournaments];

    // Insert tournaments
    for (const tournament of allTournaments) {
      // Check if tournament already exists
      const existing = await pool.query(
        'SELECT id FROM tournaments WHERE name = $1 AND date = $2',
        [tournament.name, tournament.date]
      );

      if (existing.rows.length > 0) {
        console.log(`⏭️  Skipping ${tournament.name} - already exists`);
        continue;
      }

      const result = await pool.query(`
        INSERT INTO tournaments (name, date, time, location, venue, status, format, match_format, max_participants, description, organizer_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        tournament.name, tournament.date, tournament.time, tournament.location,
        tournament.venue, tournament.status, tournament.format, tournament.match_format,
        tournament.max_participants, tournament.description, tournament.organizer_id
      ]);
      
      tournament.id = result.rows[0].id;
      console.log(`✅ Created tournament: ${tournament.name} (ID: ${tournament.id}) on ${tournament.date}`);
    }

    // Add participants to tournaments
    for (const tournament of allTournaments) {
      // Skip if tournament wasn't created
      if (!tournament.id) continue;

      const participantCount = Math.min(tournament.max_participants, players.length);
      const tournamentPlayers = players.slice(0, participantCount);
      
      for (const player of tournamentPlayers) {
        await pool.query(`
          INSERT INTO tournament_participants (tournament_id, player_id)
          VALUES ($1, $2)
          ON CONFLICT (tournament_id, player_id) DO NOTHING
        `, [tournament.id, player.id]);
      }
      
      // Update current_participants count
      await pool.query(`
        UPDATE tournaments 
        SET current_participants = $1 
        WHERE id = $2
      `, [participantCount, tournament.id]);
      
      console.log(`👥 Added ${participantCount} participants to ${tournament.name}`);
    }

    console.log('✅ November 2025 tournaments added successfully!');
    console.log(`📅 Special test day: November 15, 2025 has ${testDayTournaments.length} tournaments with different statuses`);
    
  } catch (error) {
    console.error('❌ Error adding November tournaments:', error);
  } finally {
    await pool.end();
  }
}

addNovemberTournaments();





