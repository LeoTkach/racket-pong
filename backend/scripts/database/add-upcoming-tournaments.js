const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function addUpcomingTournaments() {
  try {
    console.log('🏓 Adding upcoming tournaments...');

    // Get some players to use as organizers
    const playersResult = await pool.query('SELECT id, username, full_name FROM players ORDER BY rating DESC LIMIT 10');
    const players = playersResult.rows;
    
    if (players.length < 3) {
      console.log('❌ Not enough players in database. Please run add-more-players.js first.');
      return;
    }

    console.log(`📊 Found ${players.length} players for tournaments`);

    // Get current date and create tournaments for the next few months
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const twoWeeks = new Date(today);
    twoWeeks.setDate(today.getDate() + 14);
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    const twoMonths = new Date(today);
    twoMonths.setMonth(today.getMonth() + 2);

    // Format dates as YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Create upcoming tournaments
    const upcomingTournaments = [
      {
        name: "Spring Championship 2025",
        date: formatDate(nextWeek),
        time: "10:00:00",
        location: "Tokyo, Japan",
        venue: "Tokyo Sports Center",
        status: "upcoming",
        format: "single-elimination",
        match_format: "best-of-3",
        max_participants: 16,
        description: "Annual spring championship featuring top players from around the world",
        organizer_id: players[0].id
      },
      {
        name: "Summer Open 2025",
        date: formatDate(twoWeeks),
        time: "14:00:00",
        location: "Berlin, Germany",
        venue: "Olympic Sports Complex",
        status: "upcoming",
        format: "round-robin",
        match_format: "best-of-5",
        max_participants: 12,
        description: "International summer tournament with round-robin format",
        organizer_id: players[1].id
      },
      {
        name: "Masters Tournament 2025",
        date: formatDate(nextMonth),
        time: "09:00:00",
        location: "New York, USA",
        venue: "Madison Square Garden",
        status: "upcoming",
        format: "group-stage",
        match_format: "best-of-3",
        max_participants: 20,
        description: "Prestigious masters tournament with group stage format",
        organizer_id: players[2].id
      },
      {
        name: "Winter Cup 2025",
        date: formatDate(twoMonths),
        time: "11:00:00",
        location: "London, UK",
        venue: "Wembley Arena",
        status: "upcoming",
        format: "single-elimination",
        match_format: "best-of-5",
        max_participants: 32,
        description: "End-of-year championship cup",
        organizer_id: players[0].id
      },
      {
        name: "International Grand Prix",
        date: formatDate(nextWeek),
        time: "16:00:00",
        location: "Paris, France",
        venue: "Roland Garros",
        status: "upcoming",
        format: "single-elimination",
        match_format: "best-of-5",
        max_participants: 24,
        description: "International grand prix tournament",
        organizer_id: players[1].id
      }
    ];

    // Insert tournaments
    for (const tournament of upcomingTournaments) {
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
    for (const tournament of upcomingTournaments) {
      // Skip if tournament wasn't created
      if (!tournament.id) continue;

      const participantCount = Math.min(Math.floor(tournament.max_participants * 0.6), players.length);
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

    console.log('✅ Upcoming tournaments added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding upcoming tournaments:', error);
  } finally {
    await pool.end();
  }
}

addUpcomingTournaments();



