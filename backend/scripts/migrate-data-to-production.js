const { Pool } = require('pg');

// Local database connection
const localPool = new Pool({
  user: 'leonidtkach',
  host: 'localhost',
  database: 'table_tennis_tournament',
  password: '19082004lt',
  port: 5432,
});

// Production database connection
const productionPool = new Pool({
  connectionString: 'postgresql://table_tennis_tournament_user:gFhhIyDmTpIPrTCgSf6JrfhyepUhqZiD@dpg-d4gh21fdiees73at4srg-a.oregon-postgres.render.com/table_tennis_tournament',
  ssl: { rejectUnauthorized: false }
});

async function copyTable(tableName, excludeColumns = []) {
  console.log(`\n📦 Copying ${tableName}...`);
  
  try {
    // Get data from local
    const result = await localPool.query(`SELECT * FROM ${tableName}`);
    console.log(`   Found ${result.rows.length} rows`);
    
    if (result.rows.length === 0) {
      console.log(`   ⏭️  Skipping (empty)`);
      return;
    }
    
    // Insert into production
    let inserted = 0;
    for (const row of result.rows) {
      try {
        // Filter out excluded columns
        const filteredRow = {};
        for (const [key, value] of Object.entries(row)) {
          if (!excludeColumns.includes(key)) {
            filteredRow[key] = value;
          }
        }
        
        const cols = Object.keys(filteredRow).join(', ');
        const placeholders = Object.keys(filteredRow).map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(filteredRow);
        
        await productionPool.query(
          `INSERT INTO ${tableName} (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        );
        inserted++;
      } catch (err) {
        console.log(`   ⚠️  Row ${row.id || inserted} skipped: ${err.message.substring(0, 80)}`);
      }
    }
    
    console.log(`   ✅ Inserted ${inserted}/${result.rows.length} rows`);
    
    // Reset sequence if exists
    const sequenceName = `${tableName}_id_seq`;
    try {
      await productionPool.query(`SELECT setval('${sequenceName}', (SELECT MAX(id) FROM ${tableName}))`);
      console.log(`   🔄 Reset sequence ${sequenceName}`);
    } catch (err) {
      // Sequence might not exist, that's ok
    }
    
  } catch (error) {
    console.error(`   ❌ Error copying ${tableName}:`, error.message);
  }
}

async function migrateData() {
  console.log('🚀 Starting data migration...\n');
  
  try {
    // Test connections
    await localPool.query('SELECT 1');
    console.log('✅ Connected to local database');
    
    await productionPool.query('SELECT 1');
    console.log('✅ Connected to production database\n');
    
    // Copy tables in correct order (respecting foreign keys)
    await copyTable('players', ['firebase_uid']); // Exclude firebase_uid (not in production)
    await copyTable('achievements');
    await copyTable('player_achievements');
    await copyTable('tournaments');
    await copyTable('guest_tournament_players');
    await copyTable('tournament_participants');
    await copyTable('matches');
    await copyTable('match_scores');
    await copyTable('tournament_standings');
    await copyTable('player_rating_history');
    await copyTable('notifications');
    
    console.log('\n🎉 Data migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await localPool.end();
    await productionPool.end();
  }
}

migrateData();
