const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'table_tennis_tournament',
    user: process.env.DB_USER || 'leonidtkach',
    password: process.env.DB_PASSWORD || '',
});

async function verifyTournaments() {
    try {
        console.log('🔍 Verifying created tournaments...\n');

        // Check tournaments
        const tournamentsResult = await pool.query(`
      SELECT id, name, format, max_participants, current_participants, location, date, time
      FROM tournaments 
      WHERE id IN (29, 30, 31)
      ORDER BY id
    `);

        console.log('📋 Tournaments:');
        console.log('─'.repeat(120));
        tournamentsResult.rows.forEach(t => {
            console.log(`ID: ${t.id} | ${t.name}`);
            console.log(`   Format: ${t.format} | Participants: ${t.current_participants}/${t.max_participants}`);
            console.log(`   Location: ${t.location} | Date: ${t.date} at ${t.time}`);
            console.log('');
        });

        // Check participants for each tournament
        console.log('\n👥 Participants by Tournament:');
        console.log('─'.repeat(120));

        for (const tournament of tournamentsResult.rows) {
            const participantsResult = await pool.query(`
        SELECT p.id, p.full_name, p.rating
        FROM tournament_participants tp
        JOIN players p ON tp.player_id = p.id
        WHERE tp.tournament_id = $1
        ORDER BY p.rating DESC
      `, [tournament.id]);

            console.log(`\n${tournament.name} (ID: ${tournament.id}):`);
            participantsResult.rows.forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.full_name} (Rating: ${p.rating})`);
            });
        }

        console.log('\n\n✅ Verification complete!');

    } catch (error) {
        console.error('❌ Error verifying tournaments:', error);
    } finally {
        await pool.end();
    }
}

verifyTournaments();
