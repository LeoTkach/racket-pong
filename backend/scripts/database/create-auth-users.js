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

async function createAuthUsers() {
  try {
    console.log('Creating authenticated users...');

    // First, check if password_hash column exists, if not add it
    try {
      await pool.query('SELECT password_hash FROM players LIMIT 1');
      console.log('✅ password_hash column already exists');
    } catch (error) {
      console.log('⚠️  password_hash column does not exist, adding it...');
      await pool.query('ALTER TABLE players ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)');
      console.log('✅ Added password_hash column');
    }

    const users = [
      {
        username: 'JohnDoe',
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        country: 'USA',
        rating: 2000,
        games_played: 50,
        wins: 30,
        losses: 20,
        win_rate: 60.0,
        bio: 'Table tennis enthusiast and tournament participant',
      },
      {
        username: 'leonidtkach',
        full_name: 'Leonid Tkach',
        email: 'leonidt1908@gmail.com',
        password: 'password123',
        country: 'USA',
        rating: 2200,
        games_played: 75,
        wins: 50,
        losses: 25,
        win_rate: 66.67,
        bio: 'Passionate table tennis player',
      },
    ];

    for (const userData of users) {
      const password_hash = await hashPassword(userData.password);
      
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id, email FROM players WHERE email = $1',
        [userData.email]
      );

      if (existingUser.rows.length > 0) {
        // Update existing user with password
        await pool.query(
          'UPDATE players SET password_hash = $1 WHERE email = $2',
          [password_hash, userData.email]
        );
        console.log(`✅ Updated password for user: ${userData.email}`);
      } else {
        // Create new user
        await pool.query(`
          INSERT INTO players (username, full_name, email, country, rating, games_played, wins, losses, win_rate, bio, password_hash)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          userData.username,
          userData.full_name,
          userData.email,
          userData.country,
          userData.rating,
          userData.games_played,
          userData.wins,
          userData.losses,
          userData.win_rate,
          userData.bio,
          password_hash
        ]);
        console.log(`✅ Created user: ${userData.email}`);
      }
    }

    console.log('\n📝 Credentials:');
    console.log('John Doe:');
    console.log('  Email: john.doe@example.com');
    console.log('  Password: password123');
    console.log('\nLeonid Tkach:');
    console.log('  Email: leonidt1908@gmail.com');
    console.log('  Password: password123');

    console.log('\n🎉 Authentication users created/updated successfully!');
  } catch (error) {
    console.error('❌ Error creating users:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAuthUsers();


