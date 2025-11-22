const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'table_tennis_tournament',
  user: process.env.DB_USER || 'username',
  password: process.env.DB_PASSWORD || 'password',
});

async function setupDatabase() {
  try {
    console.log('Setting up database...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await pool.query(schema);
    console.log('✅ Database schema created successfully');

    // Insert sample data
    await insertSampleData();
    console.log('✅ Sample data inserted successfully');

    console.log('🎉 Database setup completed!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function insertSampleData() {
  // Insert sample players
  const players = [
    {
      username: 'ChenWei',
      full_name: 'Chen Wei',
      email: 'chen.wei@example.com',
      country: 'China',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      rating: 2850,
      rank: 1,
      ranking: 1,
      games_played: 156,
      wins: 142,
      losses: 14,
      win_rate: 91.0,
      join_date: '2022-01-15',
      bio: 'Professional table tennis player specializing in aggressive offensive play. 3-time national champion.',
      playing_style: 'Offensive',
      favorite_shot: 'Forehand Loop'
    },
    {
      username: 'EmmaSchmidt',
      full_name: 'Emma Schmidt',
      email: 'emma.schmidt@example.com',
      country: 'Germany',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      rating: 2720,
      rank: 2,
      ranking: 2,
      games_played: 134,
      wins: 115,
      losses: 19,
      win_rate: 85.8,
      join_date: '2022-03-20',
      bio: 'Defensive specialist with excellent blocking skills. European champion 2023.',
      playing_style: 'Defensive',
      favorite_shot: 'Backhand Block'
    },
    {
      username: 'AlexJohnson',
      full_name: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      country: 'USA',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      rating: 2440,
      rank: 6,
      ranking: 6,
      games_played: 102,
      wins: 74,
      losses: 28,
      win_rate: 72.5,
      join_date: '2022-06-18',
      bio: 'Passionate table tennis player with 5 years of competitive experience. Always looking to improve and face new challenges.',
      playing_style: 'Balanced',
      favorite_shot: 'Forehand Loop'
    }
  ];

  for (const player of players) {
    await pool.query(`
      INSERT INTO players (username, full_name, email, country, avatar_url, rating, rank, ranking, 
                          games_played, wins, losses, win_rate, join_date, bio, playing_style, favorite_shot)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (username) DO NOTHING
    `, [
      player.username, player.full_name, player.email, player.country, player.avatar_url,
      player.rating, player.rank, player.ranking, player.games_played, player.wins,
      player.losses, player.win_rate, player.join_date, player.bio, player.playing_style, player.favorite_shot
    ]);
  }

  // Insert sample tournaments
  const tournaments = [
    {
      name: 'Asian Championship 2024',
      date: '2024-03-15',
      time: '10:00:00',
      location: 'Tokyo, Japan',
      venue: 'Tokyo Metropolitan Gymnasium',
      status: 'completed',
      format: 'single-elimination',
      match_format: 'best-of-5',
      max_participants: 16,
      current_participants: 16,
      description: 'Premier table tennis championship featuring top Asian players competing for glory.',
      image_url: 'https://images.unsplash.com/photo-1576617497557-22895ee5930b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      organizer_id: 1,
      registration_deadline: '2024-03-10'
    },
    {
      name: 'European Masters',
      date: '2024-04-22',
      time: '09:00:00',
      location: 'Berlin, Germany',
      venue: 'Berlin Sports Arena',
      status: 'completed',
      format: 'round-robin',
      match_format: 'best-of-3',
      max_participants: 8,
      current_participants: 8,
      description: 'Europe\'s finest players compete in an intense round-robin tournament.',
      image_url: 'https://images.unsplash.com/photo-1758634016761-74aaacbf8739?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      organizer_id: 2,
      registration_deadline: '2024-04-15'
    },
    {
      name: 'New Year Championship',
      date: '2025-01-15',
      time: '10:00:00',
      location: 'Dubai, UAE',
      venue: 'Dubai Sports City',
      status: 'upcoming',
      format: 'single-elimination',
      match_format: 'best-of-5',
      max_participants: 32,
      current_participants: 18,
      description: 'Start the new year with top-tier international competition and prize money.',
      image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      organizer_id: 1,
      registration_deadline: '2025-01-08'
    }
  ];

  for (const tournament of tournaments) {
    const result = await pool.query(`
      INSERT INTO tournaments (name, date, time, location, venue, status, format, match_format, 
                              max_participants, current_participants, description, image_url, organizer_id, registration_deadline)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `, [
      tournament.name, tournament.date, tournament.time, tournament.location, tournament.venue,
      tournament.status, tournament.format, tournament.match_format, tournament.max_participants,
      tournament.current_participants, tournament.description, tournament.image_url, tournament.organizer_id, tournament.registration_deadline
    ]);

    const tournamentId = result.rows[0].id;

    // Add participants to tournaments
    if (tournament.status === 'completed' || tournament.status === 'upcoming') {
      for (let i = 1; i <= Math.min(3, tournament.current_participants); i++) {
        await pool.query(`
          INSERT INTO tournament_participants (tournament_id, player_id)
          VALUES ($1, $2)
          ON CONFLICT (tournament_id, player_id) DO NOTHING
        `, [tournamentId, i]);
      }
    }
  }

  // Insert sample achievements (all 18 achievements)
  const achievements = [
    { name: 'First Victory', description: 'Win your first tournament match', rarity: 'common', icon_name: 'Swords' },
    { name: 'Win Streak', description: 'Win 5 matches in a row', rarity: 'rare', icon_name: 'Flame' },
    { name: 'Paper Champion', description: 'Reach the tournament final but lose', rarity: 'epic', icon_name: 'Medal' },
    { name: 'Champion', description: 'Win a professional tournament', rarity: 'legendary', icon_name: 'Crown' },
    { name: 'Perfect Game', description: 'Win a match 3-0', rarity: 'rare', icon_name: 'Star' },
    { name: 'Lightning Fast', description: 'Win 3 matches in a single tournament', rarity: 'uncommon', icon_name: 'Zap' },
    { name: 'Newcomer', description: 'Play for 1 week', rarity: 'common', icon_name: 'Leaf' },
    { name: 'Regular Player', description: 'Play in 3 tournaments', rarity: 'uncommon', icon_name: 'Shield' },
    { name: 'Veteran', description: 'Play for 1 month', rarity: 'rare', icon_name: 'Tree' },
    { name: 'Jungle Explorer', description: 'Play for 3 months', rarity: 'rare', icon_name: 'TreePalm' },
    { name: 'Legend', description: 'Win 10 tournament matches', rarity: 'legendary', icon_name: 'Sparkles' },
    { name: 'Community Member', description: 'Join 5 tournaments', rarity: 'common', icon_name: 'Users' },
    { name: 'Tournament Enthusiast', description: 'Join 10 tournaments', rarity: 'epic', icon_name: 'Heart' },
    { name: 'Match Master', description: 'Achieve 30 wins in tournament matches', rarity: 'rare', icon_name: 'Target' },
    { name: 'Path Finder', description: 'Complete all tournament formats', rarity: 'uncommon', icon_name: 'Target' },
    { name: 'Comeback King', description: 'Win after being 2-0 down', rarity: 'epic', icon_name: 'Rocket' },
    { name: 'Undefeated', description: 'Win a tournament without losing a single set', rarity: 'legendary', icon_name: 'Shield' },
    { name: 'Scout', description: 'Play against 10 different opponents', rarity: 'uncommon', icon_name: 'Users' }
  ];

  for (const achievement of achievements) {
    await pool.query(`
      INSERT INTO achievements (name, description, rarity, icon_name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
    `, [achievement.name, achievement.description, achievement.rarity, achievement.icon_name]);
  }
}

// Run setup
setupDatabase();
