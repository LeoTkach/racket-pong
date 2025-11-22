const pool = require('../server/config/database');

async function demoTimestampUpdate() {
  try {
    console.log('📅 Demo: CURRENT_TIMESTAMP behavior\n');

    // Show what CURRENT_TIMESTAMP returns
    const timestampResult = await pool.query('SELECT CURRENT_TIMESTAMP as now');
    const now = timestampResult.rows[0].now;
    
    console.log('🕐 CURRENT_TIMESTAMP returns:');
    console.log(`   Raw value: ${now}`);
    console.log(`   Type: ${typeof now}`);
    console.log(`   Date object: ${new Date(now)}`);
    console.log('');

    // Get a sample match to see its timestamps
    const matchResult = await pool.query(`
      SELECT 
        id,
        tournament_id,
        start_time,
        end_time,
        status,
        created_at
      FROM matches
      ORDER BY id DESC
      LIMIT 3
    `);

    console.log('📋 Sample matches with timestamps:');
    matchResult.rows.forEach(match => {
      console.log(`\n   Match ID: ${match.id}`);
      console.log(`   Status: ${match.status}`);
      console.log(`   start_time: ${match.start_time || 'NULL'}`);
      console.log(`   end_time: ${match.end_time || 'NULL'}`);
      console.log(`   created_at: ${match.created_at}`);
    });
    console.log('');

    // Show how the streak function uses timestamps
    console.log('💡 How streak calculation uses timestamps:');
    console.log('   COALESCE(m.end_time, m.start_time, t.date)');
    console.log('   ↓');
    console.log('   Priority: end_time → start_time → tournament date');
    console.log('   ↓');
    console.log('   Result: Full date+time for accurate ordering');
    console.log('');

    console.log('✅ When tournament starts:');
    console.log('   UPDATE matches SET start_time = CURRENT_TIMESTAMP');
    console.log('   ↓');
    console.log('   Sets: 2025-11-21 20:43:15.123456');
    console.log('        ^^^^^^^^^^^^ ^^^^^^^^');
    console.log('        Date         Time');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

demoTimestampUpdate();
