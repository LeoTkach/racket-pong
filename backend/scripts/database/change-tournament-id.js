const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'table_tennis_tournament',
    user: process.env.DB_USER || 'leonidtkach',
    password: process.env.DB_PASSWORD || '',
});

async function changeTournamentId() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Find the current max ID
        const maxIdResult = await client.query('SELECT MAX(id) as max_id FROM tournaments');
        const newId = maxIdResult.rows[0].max_id + 1;

        console.log(`Changing tournament "leon malon" from ID 5 to ID ${newId}`);
        console.log(`New gradient index will be: ${newId % 24}`);

        // Get the old tournament data
        const oldTournament = await client.query('SELECT * FROM tournaments WHERE id = 5');
        if (oldTournament.rows.length === 0) {
            throw new Error('Tournament with ID 5 not found');
        }
        const tournament = oldTournament.rows[0];

        // Insert new tournament with new ID
        await client.query(`
      INSERT INTO tournaments (
        id, name, date, time, location, venue, status, format, match_format,
        max_participants, current_participants, description, image_url, organizer_id,
        created_at, updated_at, registration_deadline, num_groups, players_per_group_advance
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      )
    `, [
            newId, tournament.name, tournament.date, tournament.time, tournament.location,
            tournament.venue, tournament.status, tournament.format, tournament.match_format,
            tournament.max_participants, tournament.current_participants, tournament.description,
            tournament.image_url, tournament.organizer_id, tournament.created_at, tournament.updated_at,
            tournament.registration_deadline, tournament.num_groups, tournament.players_per_group_advance
        ]);
        console.log('✓ Created new tournament with new ID');

        // Copy tournament participants
        await client.query(`
      INSERT INTO tournament_participants (tournament_id, player_id)
      SELECT $1, player_id
      FROM tournament_participants
      WHERE tournament_id = 5
    `, [newId]);
        console.log('✓ Copied tournament participants');

        // Copy matches if they exist
        const matchesExist = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'matches'
    `);

        if (matchesExist.rows[0].count > 0) {
            const matches = await client.query('SELECT * FROM matches WHERE tournament_id = 5');
            if (matches.rows.length > 0) {
                for (const match of matches.rows) {
                    await client.query(`
            INSERT INTO matches (tournament_id, player1_id, player2_id, winner_id, score, round, match_number)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [newId, match.player1_id, match.player2_id, match.winner_id, match.score, match.round, match.match_number]);
                }
                console.log('✓ Copied matches');
            }
        }

        // Delete old tournament (cascade will delete participants and matches)
        await client.query('DELETE FROM tournaments WHERE id = 5');
        console.log('✓ Deleted old tournament');

        // Reset the sequence
        await client.query(`
      SELECT setval('tournaments_id_seq', (SELECT MAX(id) FROM tournaments))
    `);
        console.log('✓ Reset sequence');

        await client.query('COMMIT');

        console.log('\n✅ Successfully changed tournament ID!');
        console.log(`Tournament "leon malon" now has ID ${newId} with gradient index ${newId % 24}`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error changing tournament ID:', err.message);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

changeTournamentId();
