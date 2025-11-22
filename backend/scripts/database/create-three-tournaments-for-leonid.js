const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'table_tennis_tournament',
  user: process.env.DB_USER || 'leonidtkach',
  password: process.env.DB_PASSWORD || '',
});

async function createThreeTournamentsForLeonid() {
  try {
    console.log('🏓 Creating 3 tournaments for Leonid Tkach...\n');

    // Find Leonid Tkach user ID
    const leonidResult = await pool.query(`
      SELECT id, rating, username, full_name 
      FROM players 
      WHERE username LIKE '%leonid%' OR username LIKE '%tkach%' 
         OR full_name LIKE '%Leonid%' OR full_name LIKE '%Tkach%'
      LIMIT 1
    `);

    if (leonidResult.rows.length === 0) {
      console.error('❌ User Leonid Tkach not found!');
      process.exit(1);
    }

    const leonid = leonidResult.rows[0];
    const leonidId = leonid.id;
    console.log(`✅ Found user: ${leonid.full_name} (ID: ${leonidId}, Rating: ${leonid.rating})\n`);

    // Get 4 more players to fill up to 5 slots (excluding Leonid)
    const otherPlayersResult = await pool.query(`
      SELECT id, username, full_name, rating
      FROM players 
      WHERE id != $1
      ORDER BY rating DESC
      LIMIT 4
    `, [leonidId]);

    if (otherPlayersResult.rows.length < 2) {
      console.error('❌ Not enough players in database. Need at least 2 other players.');
      process.exit(1);
    }

    const otherPlayers = otherPlayersResult.rows;

    console.log(`👥 Available players:`)
    console.log(`   1. ${leonid.full_name} (Rating: ${leonid.rating}) - Leonid Tkach`);
    otherPlayers.forEach((p, i) => {
      console.log(`   ${i + 2}. ${p.full_name} (Rating: ${p.rating})`);
    });
    console.log('');

    // Get tomorrow's date for tournament dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    // Define the 3 tournaments with different participant counts
    const tournaments = [
      {
        name: 'Winter Classic Round Robin',
        date: dateStr,
        time: '10:00:00',
        location: 'Moscow, Russia',
        venue: 'Luzhniki Sports Palace',
        status: 'upcoming',
        format: 'round-robin',
        match_format: 'best-of-3',
        max_participants: 3,
        participantCount: 3, // Leonid + 2 others
        description: 'Intimate round robin tournament where every player faces each other',
      },
      {
        name: 'Speed Knockout Challenge',
        date: dateStr,
        time: '14:00:00',
        location: 'Shanghai, China',
        venue: 'Oriental Sports Center',
        status: 'upcoming',
        format: 'single-elimination',
        match_format: 'best-of-5',
        max_participants: 3,
        participantCount: 3, // Leonid + 2 others
        description: 'Fast-paced single elimination tournament with intense best-of-5 matches',
      },
      {
        name: 'International Masters Cup',
        date: dateStr,
        time: '18:00:00',
        location: 'Paris, France',
        venue: 'AccorHotels Arena',
        status: 'upcoming',
        format: 'group-stage',
        match_format: 'best-of-3',
        max_participants: 5,
        participantCount: 5, // Leonid + 4 others
        description: 'Premier group stage tournament featuring top players from around the world',
      },
    ];

    // Create tournaments and add participants
    for (let i = 0; i < tournaments.length; i++) {
      const tournament = tournaments[i];

      console.log(`📅 Creating tournament ${i + 1}: ${tournament.name}`);
      console.log(`   Format: ${tournament.format}`);
      console.log(`   Date: ${tournament.date} at ${tournament.time}`);

      // Insert tournament
      const tournamentResult = await pool.query(`
        INSERT INTO tournaments (
          name, date, time, location, venue, status, format, match_format,
          max_participants, description, organizer_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        tournament.name,
        tournament.date,
        tournament.time,
        tournament.location,
        tournament.venue,
        tournament.status,
        tournament.format,
        tournament.match_format,
        tournament.max_participants,
        tournament.description,
        leonidId, // Leonid is the organizer
      ]);

      const tournamentId = tournamentResult.rows[0].id;
      console.log(`   ✅ Tournament created with ID: ${tournamentId}`);

      // Add participants based on tournament's participantCount
      const playersToAdd = tournament.participantCount;
      const participants = [leonid, ...otherPlayers.slice(0, playersToAdd - 1)];

      let addedCount = 0;
      for (const player of participants) {
        try {
          await pool.query(`
            INSERT INTO tournament_participants (tournament_id, player_id)
            VALUES ($1, $2)
            ON CONFLICT (tournament_id, player_id) DO NOTHING
          `, [tournamentId, player.id]);

          const checkResult = await pool.query(`
            SELECT COUNT(*) as count
            FROM tournament_participants
            WHERE tournament_id = $1 AND player_id = $2
          `, [tournamentId, player.id]);

          if (parseInt(checkResult.rows[0].count) > 0) {
            addedCount++;
            console.log(`   ✓ Added ${player.full_name}`);
          }
        } catch (err) {
          console.error(`   ❌ Error adding ${player.full_name}:`, err.message);
        }
      }

      // Update participant count
      await pool.query(`
        UPDATE tournaments 
        SET current_participants = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [addedCount, tournamentId]);

      console.log(`   👥 Total participants: ${addedCount}/${tournament.max_participants}\n`);
    }

    console.log('✅ Successfully created all 3 tournaments!');
    console.log('\n📊 Summary:');
    console.log('   1. Winter Classic Round Robin - round-robin format (3 participants)');
    console.log('   2. Speed Knockout Challenge - single-elimination format (3 participants)');
    console.log('   3. International Masters Cup - group-stage format (5 participants)');
    console.log(`\n   All tournaments scheduled for ${dateStr}`);
    console.log(`   All tournaments organized by Leonid Tkach`);

  } catch (error) {
    console.error('❌ Error creating tournaments:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
createThreeTournamentsForLeonid();




