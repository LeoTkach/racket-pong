const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function enableFanZhendongHistory() {
  try {
    console.log('🔍 Finding Fan Zhendong...');
    
    // Find player by username
    const playerResult = await pool.query(
      'SELECT id, username, full_name FROM players WHERE username = $1 OR full_name ILIKE $2',
      ['fan_zhendong', '%Fan Zhendong%']
    );
    
    if (playerResult.rows.length === 0) {
      console.error('❌ Player Fan Zhendong not found!');
      return;
    }
    
    const player = playerResult.rows[0];
    console.log(`✅ Found player: ${player.full_name} (ID: ${player.id}, username: ${player.username})`);
    
    // Check if settings exist
    const settingsResult = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [player.id]
    );
    
    if (settingsResult.rows.length === 0) {
      // Create new settings with match_history_visibility = true
      console.log('📝 Creating new settings with match_history_visibility = true...');
      await pool.query(`
        INSERT INTO user_settings (
          user_id, language, timezone, tournament_notifications, match_notifications,
          achievement_notifications, email_notifications, profile_visibility,
          stats_visibility, match_history_visibility, achievements_visibility
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        player.id,
        'en',
        'utc+0',
        true,  // tournament_notifications
        true,  // match_notifications
        true,  // achievement_notifications
        true,  // email_notifications
        true,  // profile_visibility
        true,  // stats_visibility
        true,  // match_history_visibility - ВКЛЮЧЕНО
        true   // achievements_visibility
      ]);
      console.log('✅ Created new settings with match_history_visibility = true');
    } else {
      // Update existing settings
      console.log('📝 Updating existing settings to enable match_history_visibility...');
      await pool.query(`
        UPDATE user_settings 
        SET match_history_visibility = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `, [player.id]);
      console.log('✅ Updated settings: match_history_visibility = true');
    }
    
    // Verify the update
    const verifyResult = await pool.query(
      'SELECT match_history_visibility, achievements_visibility FROM user_settings WHERE user_id = $1',
      [player.id]
    );
    
    if (verifyResult.rows.length > 0) {
      const settings = verifyResult.rows[0];
      console.log('\n📊 Current settings for Fan Zhendong:');
      console.log(`   Match History Visibility: ${settings.match_history_visibility ? '✅ ENABLED' : '❌ DISABLED'}`);
      console.log(`   Achievements Visibility: ${settings.achievements_visibility ? '✅ ENABLED' : '❌ DISABLED'}`);
    }
    
    console.log('\n✅ Successfully enabled match history and tournament history for Fan Zhendong!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

enableFanZhendongHistory();





