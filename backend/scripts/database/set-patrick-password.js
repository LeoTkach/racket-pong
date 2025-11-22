const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'table_tennis_tournament',
  user: process.env.DB_USER || 'leonidtkach',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function setPatrickPassword() {
  try {
    console.log('🔍 Finding Patrick Franziska...');
    
    // Find player by email or username
    const playerResult = await pool.query(
      'SELECT id, username, full_name, email FROM players WHERE email = $1 OR username = $2 OR full_name ILIKE $3',
      ['patrick.franziska@example.com', 'patrick_franziska', '%Patrick Franziska%']
    );
    
    if (playerResult.rows.length === 0) {
      console.error('❌ Player Patrick Franziska not found!');
      return;
    }
    
    const player = playerResult.rows[0];
    console.log(`✅ Found player: ${player.full_name} (ID: ${player.id})`);
    console.log(`   Email: ${player.email}`);
    console.log(`   Username: ${player.username}`);
    
    // Set password
    const password = 'password123';
    const password_hash = await hashPassword(password);
    
    await pool.query(
      'UPDATE players SET password_hash = $1 WHERE id = $2',
      [password_hash, player.id]
    );
    
    console.log('\n✅ Password set successfully!');
    console.log('\n📝 Credentials for Patrick Franziska:');
    console.log(`   Email: ${player.email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🎉 You can now login with these credentials!');
    
  } catch (error) {
    console.error('❌ Error setting password:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setPatrickPassword();



