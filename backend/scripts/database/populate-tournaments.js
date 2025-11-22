// ⚠️⚠️⚠️ КРИТИЧЕСКИ ВАЖНО: ЭТОТ СКРИПТ ПОЛНОСТЬЮ ОТКЛЮЧЕН! ⚠️⚠️⚠️
// ВСЕ ФУНКЦИИ СОЗДАНИЯ МАТЧЕЙ ЗАКОММЕНТИРОВАНЫ!
// НЕ ЗАПУСКАТЬ АВТОМАТИЧЕСКИ!

/*
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'table_tennis_tournament',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function populateTournaments() {
  try {
    console.log('🏓 Populating tournaments with matches and results...');

    // First, let's get some players to use in tournaments
    const playersResult = await pool.query('SELECT id, username, full_name FROM players ORDER BY rating DESC LIMIT 20');
    const players = playersResult.rows;
    
    if (players.length < 8) {
      console.log('❌ Not enough players in database. Please run add-more-players.js first.');
      return;
    }

    console.log(`📊 Found ${players.length} players for tournaments`);

    // Create tournaments
    const tournaments = [
      {
        name: "Spring Championship 2024",
        date: "2024-03-15",
        time: "10:00:00",
        location: "Tokyo, Japan",
        venue: "Tokyo Sports Center",
        status: "completed",
        format: "single-elimination",
        match_format: "best-of-3",
        max_participants: 16,
        description: "Annual spring championship featuring top players from around the world",
        organizer_id: players[0].id
      },
      {
        name: "Summer Open 2024",
        date: "2024-06-20",
        time: "14:00:00",
        location: "Berlin, Germany",
        venue: "Olympic Sports Complex",
        status: "completed",
        format: "round-robin",
        match_format: "best-of-5",
        max_participants: 12,
        description: "International summer tournament with round-robin format",
        organizer_id: players[1].id
      },
      {
        name: "Autumn Masters 2024",
        date: "2024-09-10",
        time: "09:00:00",
        location: "New York, USA",
        venue: "Madison Square Garden",
        status: "ongoing",
        format: "group-stage",
        match_format: "best-of-3",
        max_participants: 20,
        description: "Prestigious masters tournament with group stage format",
        organizer_id: players[2].id
      },
      {
        name: "Winter Cup 2024",
        date: "2024-12-05",
        time: "11:00:00",
        location: "London, UK",
        venue: "Wembley Arena",
        status: "upcoming",
        format: "single-elimination",
        match_format: "best-of-5",
        max_participants: 32,
        description: "End-of-year championship cup",
        organizer_id: players[3].id
      },
      // Примеры для демонстрации разных статусов в один день
      {
        name: "Morning Championship",
        date: "2024-12-20",
        time: "09:00:00",
        location: "Tokyo, Japan",
        venue: "Tokyo Sports Center",
        status: "completed",
        format: "single-elimination",
        match_format: "best-of-3",
        max_participants: 32,
        description: "Morning tournament that finished early",
        organizer_id: players[0].id
      },
      {
        name: "Afternoon Live Tournament",
        date: "2024-12-20",
        time: "14:00:00",
        location: "Tokyo, Japan",
        venue: "Tokyo Sports Center",
        status: "ongoing",
        format: "round-robin",
        match_format: "best-of-5",
        max_participants: 32,
        description: "Currently ongoing tournament",
        organizer_id: players[1].id
      },
      {
        name: "Evening Championship",
        date: "2024-12-20",
        time: "19:00:00",
        location: "Tokyo, Japan",
        venue: "Tokyo Sports Center",
        status: "upcoming",
        format: "single-elimination",
        match_format: "best-of-3",
        max_participants: 32,
        description: "Evening tournament starting soon",
        organizer_id: players[2].id
      },
      {
        name: "Weekend Finals",
        date: "2024-12-21",
        time: "10:00:00",
        location: "Berlin, Germany",
        venue: "Olympic Sports Complex",
        status: "completed",
        format: "single-elimination",
        match_format: "best-of-5",
        max_participants: 16,
        description: "Completed tournament",
        organizer_id: players[3].id
      },
      {
        name: "Weekend Live Finals",
        date: "2024-12-21",
        time: "15:00:00",
        location: "Berlin, Germany",
        venue: "Olympic Sports Complex",
        status: "ongoing",
        format: "single-elimination",
        match_format: "best-of-5",
        max_participants: 16,
        description: "Live tournament in progress",
        organizer_id: players[0].id
      }
    ];

    // Insert tournaments
    for (const tournament of tournaments) {
      const result = await pool.query(`
        INSERT INTO tournaments (name, date, time, location, venue, status, format, match_format, max_participants, description, organizer_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `, [
        tournament.name, tournament.date, tournament.time, tournament.location,
        tournament.venue, tournament.status, tournament.format, tournament.match_format,
        tournament.max_participants, tournament.description, tournament.organizer_id
      ]);
      
      tournament.id = result.rows[0].id;
      console.log(`✅ Created tournament: ${tournament.name} (ID: ${tournament.id})`);
    }

    // Add participants to tournaments
    for (const tournament of tournaments) {
      const participantCount = Math.min(tournament.max_participants, players.length);
      const tournamentPlayers = players.slice(0, participantCount);
      
      for (const player of tournamentPlayers) {
        await pool.query(`
          INSERT INTO tournament_participants (tournament_id, player_id)
          VALUES ($1, $2)
          ON CONFLICT (tournament_id, player_id) DO NOTHING
        `, [tournament.id, player.id]);
      }
      
      // Update current_participants count
      await pool.query(`
        UPDATE tournaments 
        SET current_participants = $1 
        WHERE id = $2
      `, [participantCount, tournament.id]);
      
      console.log(`👥 Added ${participantCount} participants to ${tournament.name}`);
    }

    // Create matches and results for completed tournaments
    // ⚠️ ЗАКОММЕНТИРОВАНО: Матчи НЕ должны создаваться автоматически через скрипт!
    // Матчи должны создаваться только через API при переводе турнира в ongoing или через ручное управление
    /*
    for (const tournament of tournaments.filter(t => t.status === 'completed')) {
      console.log(`🏆 Creating matches for ${tournament.name}...`);
      
      const participants = await pool.query(`
        SELECT tp.player_id, p.username, p.full_name, p.rating
        FROM tournament_participants tp
        JOIN players p ON tp.player_id = p.id
        WHERE tp.tournament_id = $1
        ORDER BY p.rating DESC
      `, [tournament.id]);
      
      const tournamentPlayers = participants.rows;
      
      if (tournament.format === 'single-elimination') {
        await createSingleEliminationMatches(pool, tournament, tournamentPlayers);
      } else if (tournament.format === 'round-robin') {
        await createRoundRobinMatches(pool, tournament, tournamentPlayers);
      }
    }
    */

    // Create ongoing tournament matches
    // ⚠️ ВНИМАНИЕ: Этот блок НЕ должен выполняться автоматически!
    // Матчи для ongoing турниров должны создаваться только при переводе турнира из upcoming в ongoing через API
    // ЗАКОММЕНТИРОВАНО для предотвращения автоматического создания матчей
    /*
    for (const tournament of tournaments.filter(t => t.status === 'ongoing')) {
      // КРИТИЧЕСКАЯ ПРОВЕРКА: Проверяем, есть ли уже матчи
      const existingMatches = await pool.query(
        'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
        [tournament.id]
      );
      const matchCount = parseInt(existingMatches.rows[0].count);
      
      if (matchCount > 0) {
        console.log(`⏭️  Skipping ${tournament.name}: Already has ${matchCount} matches`);
        continue;
      }
      
      console.log(`🔥 Creating ongoing matches for ${tournament.name}...`);
      
      const participants = await pool.query(`
        SELECT tp.player_id, p.username, p.full_name, p.rating
        FROM tournament_participants tp
        JOIN players p ON tp.player_id = p.id
        WHERE tp.tournament_id = $1
        ORDER BY p.rating DESC
      `, [tournament.id]);
      
      const tournamentPlayers = participants.rows;
      
      if (tournament.format === 'single-elimination') {
        await createSingleEliminationMatches(pool, tournament, tournamentPlayers);
      } else if (tournament.format === 'round-robin') {
        await createRoundRobinMatches(pool, tournament, tournamentPlayers);
      } else if (tournament.format === 'group-stage') {
        await createGroupStageMatches(pool, tournament, tournamentPlayers);
      }
    }
    */

    console.log('✅ Tournament data populated successfully!');
    
  } catch (error) {
    console.error('❌ Error populating tournaments:', error);
  } finally {
    await pool.end();
  }
}

async function createSingleEliminationMatches(pool, tournament, players) {
  const rounds = ['Round of 16', 'Quarterfinals', 'Semifinals', 'Finals'];
  let currentPlayers = [...players];
  let roundIndex = 0;
  
  // ЗАЩИТА ОТ БЕСКОНЕЧНОГО ЦИКЛА: максимум 10 раундов
  const MAX_ROUNDS = 10;
  
  while (currentPlayers.length > 1 && roundIndex < MAX_ROUNDS) {
    const roundName = rounds[roundIndex] || `Round ${roundIndex + 1}`;
    const nextRoundPlayers = [];
    
    // Дополнительная защита: проверяем, что currentPlayers действительно уменьшается
    const playersBeforeRound = currentPlayers.length;
    
    for (let i = 0; i < currentPlayers.length; i += 2) {
      if (i + 1 < currentPlayers.length) {
        const player1 = currentPlayers[i];
        const player2 = currentPlayers[i + 1];
        
        // Create match
        const startTime = new Date(tournament.date + ' ' + tournament.time);
        const endTime = new Date(startTime.getTime() + (Math.random() * 3600000) + 3600000);
        
        const matchResult = await pool.query(`
          INSERT INTO matches (tournament_id, player1_id, player2_id, round, status, start_time, end_time)
          VALUES ($1, $2, $3, $4, 'completed', $5, $6)
          RETURNING id
        `, [
          tournament.id,
          player1.player_id,
          player2.player_id,
          roundName,
          startTime,
          endTime
        ]);
        
        const matchId = matchResult.rows[0].id;
        
        // Determine winner (higher rated player wins 70% of the time)
        const player1Wins = Math.random() < 0.7 ? (player1.rating > player2.rating) : Math.random() < 0.5;
        const winner = player1Wins ? player1 : player2;
        const loser = player1Wins ? player2 : player1;
        
        // Update match with winner
        await pool.query(`
          UPDATE matches SET winner_id = $1 WHERE id = $2
        `, [winner.player_id, matchId]);
        
        // Create match scores
        const sets = tournament.match_format === 'best-of-5' ? 3 : 2;
        const player1Scores = [];
        const player2Scores = [];
        
        for (let set = 0; set < sets; set++) {
          if (player1Wins) {
            player1Scores.push(11);
            player2Scores.push(Math.floor(Math.random() * 8) + 3);
          } else {
            player1Scores.push(Math.floor(Math.random() * 8) + 3);
            player2Scores.push(11);
          }
        }
        
        await pool.query(`
          INSERT INTO match_scores (match_id, player1_scores, player2_scores)
          VALUES ($1, $2, $3)
        `, [matchId, player1Scores, player2Scores]);
        
        nextRoundPlayers.push(winner);
        console.log(`  🏓 ${player1.full_name} vs ${player2.full_name} - Winner: ${winner.full_name}`);
      }
    }
    
    // ЗАЩИТА: Проверяем, что currentPlayers действительно уменьшился
    const playersAfterRound = nextRoundPlayers.length;
    if (playersAfterRound >= playersBeforeRound && playersAfterRound > 1) {
      console.error(`  ⚠️  WARNING: Players count didn't decrease! Before: ${playersBeforeRound}, After: ${playersAfterRound}. Breaking loop.`);
      break; // Прерываем цикл, чтобы избежать бесконечного цикла
    }
    
    currentPlayers = nextRoundPlayers;
    roundIndex++;
    
    console.log(`  📊 Round ${roundIndex} completed: ${playersAfterRound} players remaining`);
  }
  
  if (roundIndex >= MAX_ROUNDS) {
    console.error(`  ⚠️  WARNING: Reached maximum rounds (${MAX_ROUNDS}), stopping match generation`);
  }
  
  // Create final standings
  await createTournamentStandings(pool, tournament.id);
}

async function createRoundRobinMatches(pool, tournament, players) {
  console.log(`  🔄 Creating round-robin matches for ${players.length} players`);
  
  const matches = [];
  
  // Create all possible match combinations
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matches.push([players[i], players[j]]);
    }
  }
  
  // Shuffle matches for more realistic scheduling
  for (let i = matches.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [matches[i], matches[j]] = [matches[j], matches[i]];
  }
  
  for (const [player1, player2] of matches) {
    const startTime = new Date(tournament.date + ' ' + tournament.time);
    const endTime = new Date(startTime.getTime() + (Math.random() * 3600000) + 3600000);
    
    // Use tournament status to determine match status
    const matchStatus = tournament.status === 'completed' ? 'completed' : 'scheduled';
    
    const matchResult = await pool.query(`
      INSERT INTO matches (tournament_id, player1_id, player2_id, round, status, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      tournament.id,
      player1.player_id,
      player2.player_id,
      'Round Robin',
      matchStatus,
      startTime,
      endTime
    ]);
    
    const matchId = matchResult.rows[0].id;
    
    // Only create results if tournament is completed
    if (tournament.status === 'completed') {
      // Determine winner
      const player1Wins = Math.random() < 0.7 ? (player1.rating > player2.rating) : Math.random() < 0.5;
      const winner = player1Wins ? player1 : player2;
      
      await pool.query(`
        UPDATE matches SET winner_id = $1 WHERE id = $2
      `, [winner.player_id, matchId]);
      
      // Create match scores
      const sets = tournament.match_format === 'best-of-5' ? 3 : 2;
      const player1Scores = [];
      const player2Scores = [];
      
      for (let set = 0; set < sets; set++) {
        if (player1Wins) {
          player1Scores.push(11);
          player2Scores.push(Math.floor(Math.random() * 8) + 3);
        } else {
          player1Scores.push(Math.floor(Math.random() * 8) + 3);
          player2Scores.push(11);
        }
      }
      
      await pool.query(`
        INSERT INTO match_scores (match_id, player1_scores, player2_scores)
        VALUES ($1, $2, $3)
      `, [matchId, player1Scores, player2Scores]);
      
      console.log(`  🏓 ${player1.full_name} vs ${player2.full_name} - Winner: ${winner.full_name}`);
    } else {
      console.log(`  🏓 ${player1.full_name} vs ${player2.full_name} (scheduled)`);
    }
  }
  
  await createTournamentStandings(pool, tournament.id);
}

async function createGroupStageMatches(pool, tournament, players) {
  console.log(`  👥 Creating group stage matches for ${players.length} players`);
  
  // Divide players into groups
  const groupSize = Math.ceil(players.length / 4);
  const groups = [];
  
  for (let i = 0; i < players.length; i += groupSize) {
    groups.push(players.slice(i, i + groupSize));
  }
  
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const group = groups[groupIndex];
    const groupName = `Group ${String.fromCharCode(65 + groupIndex)}`;
    
    console.log(`    📊 ${groupName}: ${group.map(p => p.full_name).join(', ')}`);
    
    // Create matches within group
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const player1 = group[i];
        const player2 = group[j];
        
        const startTime = new Date(tournament.date + ' ' + tournament.time);
        const endTime = new Date(startTime.getTime() + (Math.random() * 3600000) + 3600000);
        
        const matchResult = await pool.query(`
          INSERT INTO matches (tournament_id, player1_id, player2_id, round, group_name, status, start_time, end_time)
          VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7)
          RETURNING id
        `, [
          tournament.id,
          player1.player_id,
          player2.player_id,
          'Group Stage',
          groupName,
          startTime,
          endTime
        ]);
        
        const matchId = matchResult.rows[0].id;
        
        // Determine winner
        const player1Wins = Math.random() < 0.7 ? (player1.rating > player2.rating) : Math.random() < 0.5;
        const winner = player1Wins ? player1 : player2;
        
        await pool.query(`
          UPDATE matches SET winner_id = $1 WHERE id = $2
        `, [winner.player_id, matchId]);
        
        // Create match scores
        const sets = tournament.match_format === 'best-of-5' ? 3 : 2;
        const player1Scores = [];
        const player2Scores = [];
        
        for (let set = 0; set < sets; set++) {
          if (player1Wins) {
            player1Scores.push(11);
            player2Scores.push(Math.floor(Math.random() * 8) + 3);
          } else {
            player1Scores.push(Math.floor(Math.random() * 8) + 3);
            player2Scores.push(11);
          }
        }
        
        await pool.query(`
          INSERT INTO match_scores (match_id, player1_scores, player2_scores)
          VALUES ($1, $2, $3)
        `, [matchId, player1Scores, player2Scores]);
        
        console.log(`    🏓 ${player1.full_name} vs ${player2.full_name} - Winner: ${winner.full_name}`);
      }
    }
  }
  
  await createTournamentStandings(pool, tournament.id);
}

async function createTournamentStandings(pool, tournamentId) {
  console.log(`  📊 Creating standings for tournament ${tournamentId}`);
  
  // Get all participants
  const participants = await pool.query(`
    SELECT tp.player_id, p.username, p.full_name
    FROM tournament_participants tp
    JOIN players p ON tp.player_id = p.id
    WHERE tp.tournament_id = $1
  `, [tournamentId]);
  
  // Get match results for each player
  for (const participant of participants.rows) {
    const matches = await pool.query(`
      SELECT 
        CASE 
          WHEN player1_id = $1 THEN 'player1'
          WHEN player2_id = $1 THEN 'player2'
        END as player_position,
        winner_id,
        ms.player1_scores,
        ms.player2_scores
      FROM matches m
      LEFT JOIN match_scores ms ON m.id = ms.match_id
      WHERE (m.player1_id = $1 OR m.player2_id = $1) 
        AND m.tournament_id = $2 
        AND m.status = 'completed'
    `, [participant.player_id, tournamentId]);
    
    let wins = 0;
    let losses = 0;
    let setsWon = 0;
    let setsLost = 0;
    
    for (const match of matches.rows) {
      if (match.winner_id === participant.player_id) {
        wins++;
      } else {
        losses++;
      }
      
      // Calculate sets won/lost
      if (match.player1_scores && match.player2_scores) {
        for (let i = 0; i < match.player1_scores.length; i++) {
          if (match.player_position === 'player1') {
            if (match.player1_scores[i] > match.player2_scores[i]) {
              setsWon++;
            } else {
              setsLost++;
            }
          } else {
            if (match.player2_scores[i] > match.player1_scores[i]) {
              setsWon++;
            } else {
              setsLost++;
            }
          }
        }
      }
    }
    
    const matchesPlayed = wins + losses;
    const points = wins * 3; // 3 points for win, 0 for loss
    
    await pool.query(`
      INSERT INTO tournament_standings (tournament_id, player_id, rank, matches_played, wins, losses, sets_won, sets_lost, points)
      VALUES ($1, $2, 0, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (tournament_id, player_id) 
      DO UPDATE SET 
        matches_played = $3,
        wins = $4,
        losses = $5,
        sets_won = $6,
        sets_lost = $7,
        points = $8
    `, [tournamentId, participant.player_id, matchesPlayed, wins, losses, setsWon, setsLost, points]);
  }
  
  // Update ranks based on points
  await pool.query(`
    UPDATE tournament_standings 
    SET rank = subquery.rank
    FROM (
      SELECT player_id, 
             ROW_NUMBER() OVER (ORDER BY points DESC, sets_won DESC, sets_lost ASC) as rank
      FROM tournament_standings 
      WHERE tournament_id = $1
    ) subquery
    WHERE tournament_standings.tournament_id = $1 
      AND tournament_standings.player_id = subquery.player_id
  `, [tournamentId]);
  
  console.log(`  ✅ Standings created for tournament ${tournamentId}`);
}

// populateTournaments();
*/
