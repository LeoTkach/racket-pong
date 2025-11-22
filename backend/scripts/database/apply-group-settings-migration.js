const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'table_tennis_tournament',
  user: process.env.DB_USER || 'leonidtkach',
  password: process.env.DB_PASSWORD || '',
});

async function applyMigration() {
  try {
    console.log('🔧 Applying migration: add_group_stage_settings.sql');
    
    // Add columns if they don't exist
    await pool.query(`
      ALTER TABLE tournaments 
      ADD COLUMN IF NOT EXISTS num_groups INTEGER,
      ADD COLUMN IF NOT EXISTS players_per_group_advance INTEGER;
    `);
    
    console.log('✅ Migration applied successfully');
    
    // Check Dendron tournament
    const tournamentResult = await pool.query(
      'SELECT id, name, num_groups, players_per_group_advance, format, max_participants FROM tournaments WHERE LOWER(name) = LOWER($1) AND date = $2',
      ['Dendron', '2025-11-24']
    );
    
    if (tournamentResult.rows.length > 0) {
      const tournament = tournamentResult.rows[0];
      console.log('\n📊 Tournament "Dendron":');
      console.log(`   ID: ${tournament.id}`);
      console.log(`   Format: ${tournament.format}`);
      console.log(`   Max participants: ${tournament.max_participants}`);
      console.log(`   num_groups: ${tournament.num_groups || 'NULL'}`);
      console.log(`   players_per_group_advance: ${tournament.players_per_group_advance || 'NULL'}`);
      
      // Check participants
      const participantsResult = await pool.query(
        'SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = $1',
        [tournament.id]
      );
      const participantCount = parseInt(participantsResult.rows[0].count);
      console.log(`   Current participants: ${participantCount}`);
      
      // If it's a group-stage tournament and settings are missing, set defaults
      if (tournament.format === 'group-stage' && (!tournament.num_groups || !tournament.players_per_group_advance)) {
        console.log('\n⚠️  Group stage settings missing. Setting defaults...');
        
        // Calculate reasonable defaults: 3 groups for 11 players
        const numGroups = 3;
        const playersPerGroupAdvance = 2; // 2 players advance from each group
        
        await pool.query(
          'UPDATE tournaments SET num_groups = $1, players_per_group_advance = $2 WHERE id = $3',
          [numGroups, playersPerGroupAdvance, tournament.id]
        );
        
        console.log(`✅ Set num_groups = ${numGroups}, players_per_group_advance = ${playersPerGroupAdvance}`);
      }
      
      // Check how groups are currently distributed in matches
      const groupsResult = await pool.query(`
        SELECT 
          group_name,
          COUNT(DISTINCT player1_id) + COUNT(DISTINCT CASE WHEN player2_id IS NOT NULL THEN player2_id END) as unique_players
        FROM matches 
        WHERE tournament_id = $1 AND round = 'Group Stage'
        GROUP BY group_name
        ORDER BY group_name
      `, [tournament.id]);
      
      if (groupsResult.rows.length > 0) {
        console.log('\n📋 Current groups in matches:');
        groupsResult.rows.forEach(group => {
          console.log(`   ${group.group_name}: ${group.unique_players} players`);
        });
      } else {
        console.log('\n📋 No matches created yet');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

applyMigration();




