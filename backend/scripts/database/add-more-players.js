const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

const additionalPlayers = [
  // Top players
  {
    username: 'ma_long',
    full_name: 'Ma Long',
    email: 'ma.long@example.com',
    country: 'China',
    rating: 3200,
    games_played: 450,
    wins: 380,
    losses: 70,
    win_rate: 84.44,
    bio: 'Olympic champion and world number 1',
    playing_style: 'Aggressive',
    favorite_shot: 'Forehand loop'
  },
  {
    username: 'fan_zhendong',
    full_name: 'Fan Zhendong',
    email: 'fan.zhendong@example.com',
    country: 'China',
    rating: 3150,
    games_played: 420,
    wins: 350,
    losses: 70,
    win_rate: 83.33,
    bio: 'World champion and rising star',
    playing_style: 'Powerful',
    favorite_shot: 'Backhand smash'
  },
  {
    username: 'tomokazu_harimoto',
    full_name: 'Tomokazu Harimoto',
    email: 'tomokazu.harimoto@example.com',
    country: 'Japan',
    rating: 3100,
    games_played: 400,
    wins: 320,
    losses: 80,
    win_rate: 80.00,
    bio: 'Young prodigy from Japan',
    playing_style: 'Fast',
    favorite_shot: 'Forehand drive'
  },
  {
    username: 'dimitrij_ovtcharov',
    full_name: 'Dimitrij Ovtcharov',
    email: 'dimitrij.ovtcharov@example.com',
    country: 'Germany',
    rating: 3050,
    games_played: 380,
    wins: 300,
    losses: 80,
    win_rate: 78.95,
    bio: 'European champion',
    playing_style: 'Tactical',
    favorite_shot: 'Backhand loop'
  },
  {
    username: 'lin_gaoyuan',
    full_name: 'Lin Gaoyuan',
    email: 'lin.gaoyuan@example.com',
    country: 'China',
    rating: 3000,
    games_played: 360,
    wins: 280,
    losses: 80,
    win_rate: 77.78,
    bio: 'Chinese national team member',
    playing_style: 'Consistent',
    favorite_shot: 'Forehand loop'
  },
  {
    username: 'hugo_calderano',
    full_name: 'Hugo Calderano',
    email: 'hugo.calderano@example.com',
    country: 'Brazil',
    rating: 2950,
    games_played: 340,
    wins: 260,
    losses: 80,
    win_rate: 76.47,
    bio: 'South American champion',
    playing_style: 'Aggressive',
    favorite_shot: 'Forehand smash'
  },
  {
    username: 'liang_jingkun',
    full_name: 'Liang Jingkun',
    email: 'liang.jingkun@example.com',
    country: 'China',
    rating: 2900,
    games_played: 320,
    wins: 240,
    losses: 80,
    win_rate: 75.00,
    bio: 'Rising Chinese talent',
    playing_style: 'Powerful',
    favorite_shot: 'Backhand drive'
  },
  {
    username: 'tim_boll',
    full_name: 'Tim Boll',
    email: 'tim.boll@example.com',
    country: 'Germany',
    rating: 2850,
    games_played: 500,
    wins: 360,
    losses: 140,
    win_rate: 72.00,
    bio: 'German table tennis legend',
    playing_style: 'Classic',
    favorite_shot: 'Forehand loop'
  },
  {
    username: 'mattias_falck',
    full_name: 'Mattias Falck',
    email: 'mattias.falck@example.com',
    country: 'Sweden',
    rating: 2800,
    games_played: 300,
    wins: 220,
    losses: 80,
    win_rate: 73.33,
    bio: 'Swedish champion',
    playing_style: 'Defensive',
    favorite_shot: 'Backhand chop'
  },
  {
    username: 'patrick_franziska',
    full_name: 'Patrick Franziska',
    email: 'patrick.franziska@example.com',
    country: 'Germany',
    rating: 2750,
    games_played: 280,
    wins: 200,
    losses: 80,
    win_rate: 71.43,
    bio: 'German national team',
    playing_style: 'Aggressive',
    favorite_shot: 'Forehand drive'
  },
  // Alex Jones with email login
  {
    username: 'alex_jones',
    full_name: 'Alex Jones',
    email: 'alex.jones@infowars.com',
    country: 'USA',
    rating: 1200,
    games_played: 50,
    wins: 20,
    losses: 30,
    win_rate: 40.00,
    bio: 'Conspiracy theorist and table tennis enthusiast',
    playing_style: 'Unpredictable',
    favorite_shot: 'Wild forehand'
  },
  // More players to fill the leaderboard
  {
    username: 'jean_michel_saive',
    full_name: 'Jean-Michel Saive',
    email: 'jean.saive@example.com',
    country: 'Belgium',
    rating: 2700,
    games_played: 600,
    wins: 420,
    losses: 180,
    win_rate: 70.00,
    bio: 'Belgian table tennis legend',
    playing_style: 'Classic',
    favorite_shot: 'Forehand loop'
  },
  {
    username: 'vladimir_samsonov',
    full_name: 'Vladimir Samsonov',
    email: 'vladimir.samsonov@example.com',
    country: 'Belarus',
    rating: 2650,
    games_played: 550,
    wins: 380,
    losses: 170,
    win_rate: 69.09,
    bio: 'Belarusian champion',
    playing_style: 'Tactical',
    favorite_shot: 'Backhand loop'
  },
  {
    username: 'ryu_seung_min',
    full_name: 'Ryu Seung Min',
    email: 'ryu.seungmin@example.com',
    country: 'South Korea',
    rating: 2600,
    games_played: 500,
    wins: 340,
    losses: 160,
    win_rate: 68.00,
    bio: 'Olympic gold medalist',
    playing_style: 'Fast',
    favorite_shot: 'Forehand drive'
  },
  {
    username: 'werner_schlager',
    full_name: 'Werner Schlager',
    email: 'werner.schlager@example.com',
    country: 'Austria',
    rating: 2550,
    games_played: 480,
    wins: 320,
    losses: 160,
    win_rate: 66.67,
    bio: 'Austrian champion',
    playing_style: 'Classic',
    favorite_shot: 'Forehand loop'
  },
  {
    username: 'jan_ove_waldner',
    full_name: 'Jan-Ove Waldner',
    email: 'jan.waldner@example.com',
    country: 'Sweden',
    rating: 2500,
    games_played: 700,
    wins: 450,
    losses: 250,
    win_rate: 64.29,
    bio: 'The Mozart of table tennis',
    playing_style: 'Genius',
    favorite_shot: 'Forehand loop'
  },
  {
    username: 'liu_guoliang',
    full_name: 'Liu Guoliang',
    email: 'liu.guoliang@example.com',
    country: 'China',
    rating: 2450,
    games_played: 400,
    wins: 260,
    losses: 140,
    win_rate: 65.00,
    bio: 'Chinese coach and former player',
    playing_style: 'Tactical',
    favorite_shot: 'Backhand loop'
  },
  {
    username: 'kong_linghui',
    full_name: 'Kong Linghui',
    email: 'kong.linghui@example.com',
    country: 'China',
    rating: 2400,
    games_played: 380,
    wins: 240,
    losses: 140,
    win_rate: 63.16,
    bio: 'Olympic champion',
    playing_style: 'Consistent',
    favorite_shot: 'Forehand loop'
  },
  {
    username: 'wang_liqin',
    full_name: 'Wang Liqin',
    email: 'wang.liqin@example.com',
    country: 'China',
    rating: 2350,
    games_played: 360,
    wins: 220,
    losses: 140,
    win_rate: 61.11,
    bio: 'Three-time world champion',
    playing_style: 'Powerful',
    favorite_shot: 'Forehand smash'
  },
  {
    username: 'zhang_jike',
    full_name: 'Zhang Jike',
    email: 'zhang.jike@example.com',
    country: 'China',
    rating: 2300,
    games_played: 340,
    wins: 200,
    losses: 140,
    win_rate: 58.82,
    bio: 'Grand slam winner',
    playing_style: 'Aggressive',
    favorite_shot: 'Backhand smash'
  },
  {
    username: 'xu_xin',
    full_name: 'Xu Xin',
    email: 'xu.xin@example.com',
    country: 'China',
    rating: 2250,
    games_played: 320,
    wins: 180,
    losses: 140,
    win_rate: 56.25,
    bio: 'Left-handed specialist',
    playing_style: 'Creative',
    favorite_shot: 'Forehand loop'
  },
  {
    username: 'ma_lin',
    full_name: 'Ma Lin',
    email: 'ma.lin@example.com',
    country: 'China',
    rating: 2200,
    games_played: 300,
    wins: 160,
    losses: 140,
    win_rate: 53.33,
    bio: 'Olympic champion',
    playing_style: 'Tactical',
    favorite_shot: 'Backhand loop'
  },
  {
    username: 'wang_hao',
    full_name: 'Wang Hao',
    email: 'wang.hao@example.com',
    country: 'China',
    rating: 2150,
    games_played: 280,
    wins: 140,
    losses: 140,
    win_rate: 50.00,
    bio: 'Three-time Olympic silver medalist',
    playing_style: 'Consistent',
    favorite_shot: 'Forehand loop'
  },
  {
    username: 'chen_qi',
    full_name: 'Chen Qi',
    email: 'chen.qi@example.com',
    country: 'China',
    rating: 2100,
    games_played: 260,
    wins: 120,
    losses: 140,
    win_rate: 46.15,
    bio: 'Olympic gold medalist',
    playing_style: 'Aggressive',
    favorite_shot: 'Forehand drive'
  },
  {
    username: 'ryu_seung_hyun',
    full_name: 'Ryu Seung Hyun',
    email: 'ryu.seunghyun@example.com',
    country: 'South Korea',
    rating: 2050,
    games_played: 240,
    wins: 100,
    losses: 140,
    win_rate: 41.67,
    bio: 'Korean national team',
    playing_style: 'Fast',
    favorite_shot: 'Backhand drive'
  },
  {
    username: 'oh_sang_eun',
    full_name: 'Oh Sang Eun',
    email: 'oh.sangeun@example.com',
    country: 'South Korea',
    rating: 2000,
    games_played: 220,
    wins: 80,
    losses: 140,
    win_rate: 36.36,
    bio: 'Korean champion',
    playing_style: 'Defensive',
    favorite_shot: 'Backhand chop'
  },
  {
    username: 'joo_se_hyuk',
    full_name: 'Joo Se Hyuk',
    email: 'joo.sehyuk@example.com',
    country: 'South Korea',
    rating: 1950,
    games_played: 200,
    wins: 60,
    losses: 140,
    win_rate: 30.00,
    bio: 'Defensive specialist',
    playing_style: 'Defensive',
    favorite_shot: 'Backhand chop'
  }
];

async function addPlayers() {
  try {
    console.log('Adding additional players to the database...');
    
    for (const player of additionalPlayers) {
      // Calculate rank based on rating (higher rating = better rank)
      const rankResult = await pool.query(
        'SELECT COUNT(*) + 1 as rank FROM players WHERE rating > $1',
        [player.rating]
      );
      const rank = parseInt(rankResult.rows[0].rank);
      
      const insertQuery = `
        INSERT INTO players (
          username, full_name, email, country, rating, rank, ranking,
          games_played, wins, losses, win_rate, bio, playing_style, favorite_shot
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (username) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          country = EXCLUDED.country,
          rating = EXCLUDED.rating,
          rank = EXCLUDED.rank,
          ranking = EXCLUDED.ranking,
          games_played = EXCLUDED.games_played,
          wins = EXCLUDED.wins,
          losses = EXCLUDED.losses,
          win_rate = EXCLUDED.win_rate,
          bio = EXCLUDED.bio,
          playing_style = EXCLUDED.playing_style,
          favorite_shot = EXCLUDED.favorite_shot,
          updated_at = CURRENT_TIMESTAMP
      `;
      
      await pool.query(insertQuery, [
        player.username,
        player.full_name,
        player.email,
        player.country,
        player.rating,
        rank,
        rank,
        player.games_played,
        player.wins,
        player.losses,
        player.win_rate,
        player.bio,
        player.playing_style,
        player.favorite_shot
      ]);
      
      console.log(`Added player: ${player.full_name} (${player.username})`);
    }
    
    // Update ranks for all players
    console.log('Updating player ranks...');
    await pool.query(`
      UPDATE players 
      SET rank = subquery.rank, ranking = subquery.rank
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY rating DESC) as rank
        FROM players
      ) as subquery
      WHERE players.id = subquery.id
    `);
    
    console.log('✅ Successfully added all players!');
    
    // Show final count
    const countResult = await pool.query('SELECT COUNT(*) FROM players');
    console.log(`Total players in database: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Error adding players:', error);
  } finally {
    await pool.end();
  }
}

addPlayers();
