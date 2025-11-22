const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Import completeTournamentForTournaments from tournaments.js
// Note: We use a lazy require to avoid circular dependencies
let completeTournamentForTournaments;
function getCompleteTournamentFunction() {
  if (!completeTournamentForTournaments) {
    try {
      const tournamentsModule = require('./tournaments');
      completeTournamentForTournaments = tournamentsModule.completeTournamentForTournaments;
      if (!completeTournamentForTournaments) {
        console.error('[MATCHES] completeTournamentForTournaments not found in tournaments module');
      }
    } catch (err) {
      console.error('[MATCHES] Could not import completeTournamentForTournaments:', err.message);
    }
  }
  return completeTournamentForTournaments;
}

// Get all matches with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      tournament_id, 
      player_id, 
      status,
      sort = 'start_time',
      order = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT m.*, 
             p1.username as player1_username, p1.full_name as player1_name,
             p2.username as player2_username, p2.full_name as player2_name,
             winner.username as winner_username, winner.full_name as winner_name,
             t.name as tournament_name
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      LEFT JOIN players winner ON m.winner_id = winner.id
      LEFT JOIN tournaments t ON m.tournament_id = t.id
    `;
    
    const params = [];
    let paramCount = 0;
    const conditions = [];
    
    if (tournament_id) {
      paramCount++;
      conditions.push(`m.tournament_id = $${paramCount}`);
      params.push(tournament_id);
    }
    
    if (player_id) {
      paramCount++;
      conditions.push(`(m.player1_id = $${paramCount} OR m.player2_id = $${paramCount})`);
      params.push(player_id);
    }
    
    if (status) {
      paramCount++;
      conditions.push(`m.status = $${paramCount}`);
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY m.${sort} ${order.toUpperCase()}`;
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM matches m';
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      matches: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get match by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT m.*, 
             p1.username as player1_username, p1.full_name as player1_name,
             p2.username as player2_username, p2.full_name as player2_name,
             winner.username as winner_username, winner.full_name as winner_name,
             t.name as tournament_name
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      LEFT JOIN players winner ON m.winner_id = winner.id
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      WHERE m.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Get match scores
    const scoresResult = await pool.query(`
      SELECT player1_scores, player2_scores
      FROM match_scores
      WHERE match_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [id]);
    
    const match = result.rows[0];
    if (scoresResult.rows.length > 0) {
      match.scores = {
        player1: scoresResult.rows[0].player1_scores || [],
        player2: scoresResult.rows[0].player2_scores || []
      };
    } else {
      match.scores = { player1: [], player2: [] };
    }
    
    res.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// Create new match
router.post('/', async (req, res) => {
  try {
    const {
      tournament_id, player1_id, player2_id, round, group_name,
      start_time, table_number
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO matches (tournament_id, player1_id, player2_id, round, group_name, start_time, table_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [tournament_id, player1_id, player2_id, round, group_name, start_time, table_number]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// Helper function to calculate and update ratings after match completion
async function updateRatingsAfterMatch(matchId) {
  try {
    console.log(`[📊 RATING UPDATE] Calculating rating changes for match ${matchId}...`);
    
    // Get match details with player ratings
    const matchResult = await pool.query(`
      SELECT 
        m.id,
        m.player1_id,
        m.player2_id,
        m.winner_id,
        m.tournament_id,
        p1.rating as player1_rating,
        p2.rating as player2_rating,
        COALESCE(m.end_time, m.start_time, CURRENT_TIMESTAMP) as match_date
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      WHERE m.id = $1
        AND m.status = 'completed'
        AND m.winner_id IS NOT NULL
        AND m.player1_id IS NOT NULL
        AND m.player2_id IS NOT NULL
    `, [matchId]);
    
    if (matchResult.rows.length === 0) {
      console.log(`[📊 RATING UPDATE] Match ${matchId} not found or not completed, skipping rating calculation`);
      return;
    }
    
    const match = matchResult.rows[0];
    const player1Id = match.player1_id;
    const player2Id = match.player2_id;
    const tournamentId = match.tournament_id;
    const player1Rating = match.player1_rating || 1500;
    const player2Rating = match.player2_rating || 1500;
    const matchDate = match.match_date || new Date();
    
    // Determine winner
    const player1Won = match.winner_id === player1Id;
    const player2Won = match.winner_id === player2Id;
    
    if (!player1Won && !player2Won) {
      console.log(`[📊 RATING UPDATE] No clear winner for match ${matchId}, skipping rating calculation`);
      return;
    }
    
    // Calculate rating changes using ELO system
    let player1Result, player2Result;
    
    if (player1Won) {
      player1Result = calculateEloRating(player1Rating, player2Rating, 1);
      player2Result = calculateEloRating(player2Rating, player1Rating, 0);
    } else {
      player1Result = calculateEloRating(player1Rating, player2Rating, 0);
      player2Result = calculateEloRating(player2Rating, player1Rating, 1);
    }
    
    // Update player 1 rating
    const player1NewRating = Math.max(800, player1Rating + player1Result.ratingChange);
    await pool.query(`
      UPDATE players 
      SET rating = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [player1NewRating, player1Id]);
    
    console.log(`[📊 RATING UPDATE] Player ${player1Id}: ${player1Rating} → ${player1NewRating} (${player1Result.ratingChange > 0 ? '+' : ''}${player1Result.ratingChange})`);
    
    // Update player 2 rating
    const player2NewRating = Math.max(800, player2Rating + player2Result.ratingChange);
    await pool.query(`
      UPDATE players 
      SET rating = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [player2NewRating, player2Id]);
    
    console.log(`[📊 RATING UPDATE] Player ${player2Id}: ${player2Rating} → ${player2NewRating} (${player2Result.ratingChange > 0 ? '+' : ''}${player2Result.ratingChange})`);
    
    // Add rating history entries for both players
    // Check if history entry already exists for this match
    const existingHistory1 = await pool.query(`
      SELECT id FROM player_rating_history 
      WHERE player_id = $1 AND match_id = $2
    `, [player1Id, matchId]);
    
    if (existingHistory1.rows.length === 0) {
      await pool.query(`
        INSERT INTO player_rating_history (player_id, rating, recorded_at, match_id, tournament_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [player1Id, player1NewRating, matchDate, matchId, tournamentId]);
    } else {
      // Update existing entry
      await pool.query(`
        UPDATE player_rating_history 
        SET rating = $1, recorded_at = $2, tournament_id = $3
        WHERE player_id = $4 AND match_id = $5
      `, [player1NewRating, matchDate, tournamentId, player1Id, matchId]);
    }
    
    const existingHistory2 = await pool.query(`
      SELECT id FROM player_rating_history 
      WHERE player_id = $1 AND match_id = $2
    `, [player2Id, matchId]);
    
    if (existingHistory2.rows.length === 0) {
      await pool.query(`
        INSERT INTO player_rating_history (player_id, rating, recorded_at, match_id, tournament_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [player2Id, player2NewRating, matchDate, matchId, tournamentId]);
    } else {
      // Update existing entry
      await pool.query(`
        UPDATE player_rating_history 
        SET rating = $1, recorded_at = $2, tournament_id = $3
        WHERE player_id = $4 AND match_id = $5
      `, [player2NewRating, matchDate, tournamentId, player2Id, matchId]);
    }
    
    console.log(`[📊 RATING UPDATE] ✅ Updated ratings for match ${matchId}`);
    
  } catch (error) {
    console.error(`[📊 RATING UPDATE] ⚠️ Error updating ratings for match ${matchId}:`, error);
    // Don't throw - rating update failure shouldn't break match completion
  }
}

// Helper function to calculate ELO rating change
function calculateEloRating(playerRating, opponentRating, actualScore, kFactor = 32) {
  // actualScore: 1 for win, 0.5 for draw, 0 for loss
  // Expected score based on rating difference
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  
  // Calculate rating change
  const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
  
  return {
    ratingChange,
    newRating: playerRating + ratingChange,
    expectedScore
  };
}

// Helper function to complete tournament when final match is finished
async function completeTournament(tournamentId, winnerId) {
  try {
    // Получаем информацию о турнире
    const tournamentInfo = await pool.query(`
      SELECT id, format, name FROM tournaments WHERE id = $1
    `, [tournamentId]);
    
    if (tournamentInfo.rows.length === 0) {
      console.error(`[🏆 TOURNAMENT COMPLETE] Tournament ${tournamentId} not found`);
      return;
    }
    
    const tournament = tournamentInfo.rows[0];
    const tournamentFormat = tournament.format;
    
    // Получаем информацию о победителе
    const winnerInfo = await pool.query(`
      SELECT id, full_name, username FROM players WHERE id = $1
    `, [winnerId]);
    
    const winner = winnerInfo.rows[0];
    if (!winner) {
      console.error(`[🏆 TOURNAMENT COMPLETE] Winner ${winnerId} not found`);
      return;
    }
    
    // Обновляем статус турнира на completed
    await pool.query(`
      UPDATE tournaments 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [tournamentId]);
    
    console.log(`[🏆 TOURNAMENT COMPLETE] ========================================`);
    console.log(`[🏆 TOURNAMENT COMPLETE] Tournament ${tournamentId} completed!`);
    console.log(`[🏆 TOURNAMENT COMPLETE] Winner: ${winner.full_name || winner.username} (ID: ${winnerId})`);
    console.log(`[🏆 TOURNAMENT COMPLETE] Format: ${tournamentFormat}`);
    
    // Создаем standings для single-elimination турнира
    if (tournamentFormat === 'single-elimination') {
      try {
        // Получаем все матчи турнира, отсортированные по раундам
        const allMatches = await pool.query(`
          SELECT m.id, m.round, m.player1_id, m.player2_id, m.winner_id
          FROM matches m
          WHERE m.tournament_id = $1
          ORDER BY 
            CASE m.round
              WHEN 'Final' THEN 1
              WHEN 'Semifinals' THEN 2
              WHEN 'Quarterfinals' THEN 3
              WHEN 'Round of 16' THEN 4
              WHEN 'Round of 32' THEN 5
              ELSE 6
            END,
            m.id
        `, [tournamentId]);
        
        // Определяем ранг игроков на основе результатов матчей
        // Для single-elimination используем диапазоны рангов в зависимости от раунда выбытия
        const standings = new Map(); // player_id -> {rank, eliminatedInRound, wins, losses}
        
        // Функция для определения диапазона рангов в зависимости от раунда
        const getRankRange = (round, totalPlayers) => {
          switch (round) {
            case 'Final':
              // Финал: 1-2 место (точный ранг определится после финала)
              return { min: 1, max: 2 };
            case 'Semifinals':
              // Проигравшие в полуфинале: 3-4 место
              return { min: 3, max: 4 };
            case 'Quarterfinals':
              // Проигравшие в четвертьфинале: 5-8 место
              return { min: 5, max: 8 };
            case 'Round of 16':
              // Проигравшие в 1/8 финала: 9-16 место
              return { min: 9, max: 16 };
            case 'Round of 32':
              // Проигравшие в 1/16 финала: 17-32 место
              return { min: 17, max: 32 };
            default:
              return { min: totalPlayers, max: totalPlayers };
          }
        };
        
        // Получаем количество участников турнира
        const participantCount = await pool.query(
          'SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = $1',
          [tournamentId]
        );
        const totalPlayers = parseInt(participantCount.rows[0].count) || 8;
        
        // Определяем последний проигранный матч для каждого игрока (раунд выбытия)
        const playerEliminationRounds = new Map(); // player_id -> round
        
        // Победитель финала - 1 место (точный ранг)
        const finalMatch = allMatches.rows.find(m => m.round === 'Final');
        if (finalMatch && finalMatch.winner_id) {
          // Победитель финала получил точный ранг 1
          standings.set(finalMatch.winner_id, { 
            rank: 1, 
            eliminatedInRound: null, // Не выбыл, победил
            wins: 0, 
            losses: 0 
          });
          
          // Проигравший финала - 2 место (точный ранг)
          const finalLoser = finalMatch.player1_id === finalMatch.winner_id 
            ? finalMatch.player2_id 
            : finalMatch.player1_id;
          if (finalLoser) {
            standings.set(finalLoser, { 
              rank: 2, 
              eliminatedInRound: 'Final',
              wins: 0, 
              losses: 0 
            });
            playerEliminationRounds.set(finalLoser, 'Final');
          }
        }
        
        // Определяем раунд выбытия для всех проигравших на основе последнего проигранного матча
        // Проходим по матчам в обратном порядке (от финала к ранним раундам)
        const roundsOrder = ['Final', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32'];
        
        for (const round of roundsOrder) {
          const roundMatches = allMatches.rows.filter(m => m.round === round);
          for (const match of roundMatches) {
            if (match.winner_id && match.player1_id && match.player2_id) {
              const loser = match.player1_id === match.winner_id 
                ? match.player2_id 
                : match.player1_id;
              
              // Если игрок еще не добавлен в standings, добавляем его
              if (loser && !standings.has(loser)) {
                const rankRange = getRankRange(round, totalPlayers);
                standings.set(loser, { 
                  rank: rankRange.min, // Сохраняем минимальный ранг для сортировки
                  eliminatedInRound: round,
                  wins: 0, 
                  losses: 0 
                });
                playerEliminationRounds.set(loser, round);
              }
            }
          }
        }
        
        // Подсчитываем количество побед и поражений для каждого игрока
        for (const match of allMatches.rows) {
          if (match.winner_id && match.player1_id && match.player2_id) {
            const loser = match.player1_id === match.winner_id 
              ? match.player2_id 
              : match.player1_id;
            
            // Обновляем статистику победителя
            if (standings.has(match.winner_id)) {
              const stats = standings.get(match.winner_id);
              stats.wins++;
            }
            
            // Обновляем статистику проигравшего
            if (standings.has(loser)) {
              const stats = standings.get(loser);
              stats.losses++;
            }
          }
        }
        
        // Удаляем существующие standings для этого турнира
        await pool.query('DELETE FROM tournament_standings WHERE tournament_id = $1', [tournamentId]);
        
        // Вставляем новые standings
        // Сохраняем минимальный ранг в поле rank для сортировки
        // Раунд выбытия будем определять на frontend на основе ранга или передавать отдельно
        for (const [playerId, stats] of standings.entries()) {
          await pool.query(`
            INSERT INTO tournament_standings (tournament_id, player_id, rank, wins, losses, points)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (tournament_id, player_id) 
            DO UPDATE SET rank = $3, wins = $4, losses = $5, points = $6, updated_at = CURRENT_TIMESTAMP
          `, [tournamentId, playerId, stats.rank, stats.wins, stats.losses, stats.wins * 3]);
        }
        
        console.log(`[🏆 TOURNAMENT COMPLETE] ✅ Created ${standings.size} standings`);
      } catch (standingsError) {
        console.error(`[🏆 TOURNAMENT COMPLETE] ⚠️ Error creating standings:`, standingsError);
        // Не прерываем выполнение, просто логируем ошибку
      }
    }
    
    console.log(`[🏆 TOURNAMENT COMPLETE] ========================================`);
  } catch (error) {
    console.error(`[🏆 TOURNAMENT COMPLETE] Error completing tournament:`, error);
    throw error;
  }
}

// Helper function to reset dependent matches (cascade reset) - only matches that depend on the changed match
async function resetDependentMatches(tournamentId, matchId, currentRound) {
  console.log(`[🔄 CASCADE RESET] ========================================`);
  console.log(`[🔄 CASCADE RESET] Starting cascade reset for match ${matchId} in ${currentRound}`);
  
  const roundOrder = ['Round of 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final', 'First Round'];
  const currentIndex = roundOrder.findIndex(r => r === currentRound);
  
  if (currentIndex === -1) {
    console.log(`[🔄 CASCADE RESET] ❌ Unknown round: ${currentRound}`);
    return; // Unknown round
  }
  
  // Находим позицию текущего матча в раунде
  // ВАЖНО: Используем currentRound (который был передан), а не ищем в БД
  // Потому что матч может быть уже обновлен, но нам нужна его позиция ДО обновления
  const currentMatches = await pool.query(`
    SELECT id FROM matches 
    WHERE tournament_id = $1 AND round = $2
    ORDER BY id ASC
  `, [tournamentId, currentRound]);
  
  console.log(`[🔄 CASCADE RESET] Searching for match ${matchId} in ${currentRound}`);
  console.log(`[🔄 CASCADE RESET] Found ${currentMatches.rows.length} matches in ${currentRound}`);
  console.log(`[🔄 CASCADE RESET] Match IDs in round: [${currentMatches.rows.map(r => r.id).join(', ')}]`);
  
  let matchIndex = currentMatches.rows.findIndex(m => m.id === matchId);
  if (matchIndex === -1) {
    // Если матч не найден, это может быть потому что:
    // 1. Матч был удален (маловероятно)
    // 2. Матч находится в другом раунде (возможно, если был обновлен)
    // 3. Ошибка в данных
    console.log(`[🔄 CASCADE RESET] ⚠️ Match ${matchId} not found in ${currentRound}`);
    
    // Проверяем, существует ли матч вообще
    const matchCheck = await pool.query('SELECT id, round, tournament_id FROM matches WHERE id = $1', [matchId]);
    if (matchCheck.rows.length === 0) {
      console.log(`[🔄 CASCADE RESET] ❌ Match ${matchId} does not exist in database`);
      return;
    }
    
    const actualRound = matchCheck.rows[0].round;
    const actualTournamentId = matchCheck.rows[0].tournament_id;
    console.log(`[🔄 CASCADE RESET] Match ${matchId} exists: round=${actualRound}, tournament=${actualTournamentId}`);
    
    if (actualRound !== currentRound) {
      console.log(`[🔄 CASCADE RESET] ⚠️ Match ${matchId} is in ${actualRound}, not ${currentRound}. Using ${actualRound} instead.`);
      // Пробуем найти в актуальном раунде
      const actualMatches = await pool.query(`
        SELECT id FROM matches 
        WHERE tournament_id = $1 AND round = $2
        ORDER BY id ASC
      `, [tournamentId, actualRound]);
      
      matchIndex = actualMatches.rows.findIndex(m => m.id === matchId);
      if (matchIndex === -1) {
        console.log(`[🔄 CASCADE RESET] ❌ Match ${matchId} not found even in ${actualRound}`);
        return;
      }
      console.log(`[🔄 CASCADE RESET] Found match ${matchId} at index ${matchIndex} in ${actualRound}`);
    } else {
      console.log(`[🔄 CASCADE RESET] ❌ Cannot determine match position, aborting reset`);
      return;
    }
  }
  
  // Определяем, какой раунд использовать для расчета следующего раунда
  // Используем currentRound (переданный параметр), так как это раунд ДО обновления
  const roundToUse = currentRound;
  console.log(`[🔄 CASCADE RESET] Match ${matchId} is at index ${matchIndex} in ${roundToUse}`);
  
  // Определяем, какой матч в следующем раунде зависит от этого матча
  const roundProgression = {
    'Round of 32': 'Round of 16',
    'Round of 16': 'Quarterfinals',
    'Quarterfinals': 'Semifinals',
    'Semifinals': 'Final',
    'First Round': 'Semifinals'
  };
  
  const nextRound = roundProgression[roundToUse];
  if (!nextRound) {
    console.log(`[🔄 CASCADE RESET] No next round for ${roundToUse}`);
    return; // Это финал
  }
  
  // Определяем позицию в следующем раунде и какой слот нужно очистить
  // Используем roundToUse вместо currentRound для правильного расчета
  let targetMatchIndex, targetSlot;
  if (roundToUse === 'Quarterfinals') {
    targetMatchIndex = Math.floor(matchIndex / 2);
    targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
  } else if (roundToUse === 'Semifinals') {
    targetMatchIndex = 0; // Final всегда один
    targetSlot = matchIndex === 0 ? 'player1' : 'player2';
  } else if (roundToUse === 'Round of 16') {
    targetMatchIndex = Math.floor(matchIndex / 2);
    targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
  } else if (roundToUse === 'Round of 32') {
    targetMatchIndex = Math.floor(matchIndex / 2);
    targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
  } else if (roundToUse === 'First Round') {
    targetMatchIndex = 0;
    targetSlot = matchIndex === 0 ? 'player1' : 'player2';
  } else {
    console.log(`[🔄 CASCADE RESET] ❌ Unknown round: ${roundToUse}`);
    return;
  }
  
  // Получаем матчи следующего раунда
  const nextMatches = await pool.query(`
    SELECT id, player1_id, player2_id FROM matches 
    WHERE tournament_id = $1 AND round = $2
    ORDER BY id ASC
  `, [tournamentId, nextRound]);
  
  if (targetMatchIndex >= nextMatches.rows.length) {
    console.log(`[🔄 CASCADE RESET] ⚠️ Target match index ${targetMatchIndex} >= ${nextMatches.rows.length} matches in ${nextRound}`);
    return;
  }
  
  const dependentMatch = nextMatches.rows[targetMatchIndex];
  const dependentMatchId = dependentMatch.id;
  const updateField = targetSlot === 'player1' ? 'player1_id' : 'player2_id';
  const otherField = targetSlot === 'player1' ? 'player2_id' : 'player1_id';
  
  console.log(`[🔄 CASCADE RESET] Match ${matchId} in ${roundToUse} (index ${matchIndex}) affects match ${dependentMatchId} in ${nextRound} (index ${targetMatchIndex}, slot ${targetSlot})`);
  
  // Получаем текущее состояние матча перед обнулением
  const beforeReset = await pool.query(`
    SELECT id, player1_id, player2_id, winner_id, status FROM matches WHERE id = $1
  `, [dependentMatchId]);
  
  if (beforeReset.rows.length > 0) {
    const match = beforeReset.rows[0];
    console.log(`[🔄 CASCADE RESET] Before reset - Match ${dependentMatchId}:`);
    console.log(`[🔄 CASCADE RESET]   - player1_id: ${match.player1_id}`);
    console.log(`[🔄 CASCADE RESET]   - player2_id: ${match.player2_id}`);
    console.log(`[🔄 CASCADE RESET]   - winner_id: ${match.winner_id}`);
    console.log(`[🔄 CASCADE RESET]   - status: ${match.status}`);
    console.log(`[🔄 CASCADE RESET]   - Clearing slot: ${targetSlot} (${updateField})`);
    console.log(`[🔄 CASCADE RESET]   - Preserving slot: ${otherField} = ${match[otherField]}`);
  }
  
  // Обнуляем только конкретный слот в зависимом матче, сохраняя другой слот если он заполнен
  // Сначала удаляем scores если матч был завершен
  const scoresDeleted = await pool.query(`
    DELETE FROM match_scores 
    WHERE match_id = $1
    RETURNING match_id
  `, [dependentMatchId]);
  
  console.log(`[🔄 CASCADE RESET] Deleted ${scoresDeleted.rows.length} score record(s) for match ${dependentMatchId}`);
  
  // Очищаем только наш слот и winner_id/status, но сохраняем другой слот
  // ВАЖНО: Если мы очищаем один из слотов, матч должен быть 'scheduled',
  // даже если другой слот заполнен, потому что матч не может быть завершен
  // если один из игроков неизвестен
  const otherSlotValue = beforeReset.rows[0]?.[otherField];
  // Всегда устанавливаем status в 'scheduled' при очистке слота
  const newStatus = 'scheduled';
  
  const resetResult = await pool.query(`
    UPDATE matches 
    SET ${updateField} = NULL,
        winner_id = NULL, 
        status = $2,
        end_time = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, player1_id, player2_id, winner_id, status
  `, [dependentMatchId, newStatus]);
  
  let afterReset = null;
  if (resetResult.rows.length > 0) {
    afterReset = resetResult.rows[0];
    console.log(`[🔄 CASCADE RESET] ✅ Reset match ${dependentMatchId} in ${nextRound}`);
    console.log(`[🔄 CASCADE RESET] After reset - Match ${dependentMatchId}:`);
    console.log(`[🔄 CASCADE RESET]   - player1_id: ${afterReset.player1_id} (was ${beforeReset.rows[0]?.player1_id || 'NULL'})`);
    console.log(`[🔄 CASCADE RESET]   - player2_id: ${afterReset.player2_id} (was ${beforeReset.rows[0]?.player2_id || 'NULL'})`);
    console.log(`[🔄 CASCADE RESET]   - winner_id: ${afterReset.winner_id} (was ${beforeReset.rows[0]?.winner_id || 'NULL'})`);
    console.log(`[🔄 CASCADE RESET]   - status: ${afterReset.status} (was ${beforeReset.rows[0]?.status || 'NULL'})`);
  } else {
    console.log(`[🔄 CASCADE RESET] ⚠️ Match ${dependentMatchId} not found or already reset`);
  }
  
  // Рекурсивно обнуляем матчи, которые зависят от этого матча
  // ВАЖНО: Для финала НЕ делаем полный сброс, а только очищаем конкретный слот
  // Это гарантирует, что если один полуфинал изменился, а другой нет,
  // то в финале останется участник из неизмененного полуфинала
  if (nextRound !== 'Final') {
    await resetDependentMatches(tournamentId, dependentMatchId, nextRound);
  } else {
    // Если это Final, мы уже очистили конкретный слот выше (строки 347-356)
    // Не нужно очищать финал полностью, так как другой слот может быть заполнен
    // участником из другого полуфинала, который не изменился
    if (afterReset) {
      console.log(`[🔄 CASCADE RESET] ✅ Reset slot ${targetSlot} in Final match ${dependentMatchId}`);
      console.log(`[🔄 CASCADE RESET]   - Cleared ${updateField}, winner_id, status, end_time, scores`);
      console.log(`[🔄 CASCADE RESET]   - Preserved ${otherField} = ${afterReset[otherField] || 'NULL'}`);
    }
  }
}

// Helper function to update next round when winner changes
async function updateNextRoundOnWinnerChange(tournamentId, matchId, currentRound, oldWinnerId, newWinnerId) {
  console.log(`[🏆 UPDATE WINNER] ========================================`);
  console.log(`[🏆 UPDATE WINNER] Winner changed in match ${matchId} (${currentRound})`);
  console.log(`[🏆 UPDATE WINNER] Old winner: ${oldWinnerId}`);
  console.log(`[🏆 UPDATE WINNER] New winner: ${newWinnerId}`);
  
  // Сначала обнуляем только зависимые матчи (каскадное обнуление)
  // Если resetDependentMatches не находит матч, продолжаем все равно
  try {
    await resetDependentMatches(tournamentId, matchId, currentRound);
  } catch (resetError) {
    console.error(`[🏆 UPDATE WINNER] ⚠️ Error in resetDependentMatches, but continuing:`, resetError.message);
  }
  
  // Определяем следующий раунд
  const roundProgression = {
    'Round of 32': 'Round of 16',
    'Round of 16': 'Quarterfinals',
    'Quarterfinals': 'Semifinals',
    'Semifinals': 'Final',
    'First Round': 'Semifinals'
  };
  
  const nextRound = roundProgression[currentRound];
  if (!nextRound) {
    console.log(`[🏆 UPDATE WINNER] No next round for ${currentRound}`);
    return; // Это финал
  }
  
  // Находим позицию текущего матча в раунде
  // Используем прямой поиск по ID, если не находим в списке
  const matchCheck = await pool.query('SELECT round, tournament_id FROM matches WHERE id = $1', [matchId]);
  if (matchCheck.rows.length === 0) {
    console.error(`[🏆 UPDATE WINNER] ❌ Match ${matchId} not found in database`);
    return;
  }
  
  const actualRound = matchCheck.rows[0].round || currentRound;
  const roundToUse = actualRound;
  
  const currentMatches = await pool.query(`
    SELECT id FROM matches 
    WHERE tournament_id = $1 AND round = $2
    ORDER BY id ASC
  `, [tournamentId, roundToUse]);
  
  console.log(`[🏆 UPDATE WINNER] Found ${currentMatches.rows.length} matches in ${roundToUse}`);
  
  let matchIndex = currentMatches.rows.findIndex(m => m.id === matchId);
  if (matchIndex === -1) {
    // Если не нашли в списке, попробуем найти по порядку ID
    const sortedIds = currentMatches.rows.map(r => r.id).sort((a, b) => a - b);
    matchIndex = sortedIds.indexOf(matchId);
    if (matchIndex === -1) {
      console.error(`[🏆 UPDATE WINNER] ❌ Match ${matchId} not found in ${roundToUse}, cannot determine position`);
      return;
    }
    console.log(`[🏆 UPDATE WINNER] Found match ${matchId} at index ${matchIndex} by ID search`);
  }
  
  // Определяем позицию в следующем раунде
  const nextMatches = await pool.query(`
    SELECT id, player1_id, player2_id, winner_id FROM matches 
    WHERE tournament_id = $1 AND round = $2
    ORDER BY id ASC
  `, [tournamentId, nextRound]);
  
  if (nextMatches.rows.length === 0) {
    return;
  }
  
  let targetMatchIndex, targetSlot;
  
  if (currentRound === 'Quarterfinals') {
    targetMatchIndex = Math.floor(matchIndex / 2);
    targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
  } else if (currentRound === 'Semifinals') {
    targetMatchIndex = 0;
    targetSlot = matchIndex === 0 ? 'player1' : 'player2';
  } else if (currentRound === 'Round of 16') {
    targetMatchIndex = Math.floor(matchIndex / 2);
    targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
  } else if (currentRound === 'Round of 32') {
    targetMatchIndex = Math.floor(matchIndex / 2);
    targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
  } else if (currentRound === 'First Round') {
    targetMatchIndex = 0;
    targetSlot = matchIndex === 0 ? 'player1' : 'player2';
  } else {
    return;
  }
  
  if (targetMatchIndex >= nextMatches.rows.length) {
    return;
  }
  
  const targetMatch = nextMatches.rows[targetMatchIndex];
  const updateField = targetSlot === 'player1' ? 'player1_id' : 'player2_id';
  const otherField = targetSlot === 'player1' ? 'player2_id' : 'player1_id';
  
  // После каскадного обнуления слот должен быть NULL, просто устанавливаем нового победителя
  // Но на всякий случай проверяем, что там либо NULL, либо старый победитель
  const currentValue = targetMatch[updateField];
  const otherValue = targetMatch[otherField];
  
  console.log(`[🏆 UPDATE WINNER] Target match ${targetMatch.id} in ${nextRound}:`);
  console.log(`[🏆 UPDATE WINNER]   - player1_id: ${targetMatch.player1_id}`);
  console.log(`[🏆 UPDATE WINNER]   - player2_id: ${targetMatch.player2_id}`);
  console.log(`[🏆 UPDATE WINNER]   - Target slot (${targetSlot}): ${currentValue}`);
  console.log(`[🏆 UPDATE WINNER]   - Other slot (${otherField}): ${otherValue}`);
  console.log(`[🏆 UPDATE WINNER]   - Expected: NULL or ${oldWinnerId}`);
  
  // ВАЖНО: При обновлении слота игрока ВСЕГДА очищаем winner_id
  // Это гарантирует, что старый победитель не останется в матче
  // Очищаем winner_id ВСЕГДА, так как игрок в слоте изменился
  const shouldClearWinner = true; // Всегда очищаем при обновлении слота
  
  console.log(`[🏆 UPDATE WINNER] Clearing winner_id: ${shouldClearWinner}`);
  console.log(`[🏆 UPDATE WINNER] Current winner_id: ${targetMatch.winner_id}`);
  console.log(`[🏆 UPDATE WINNER] Old winner: ${oldWinnerId}, New winner: ${newWinnerId}`);
  console.log(`[🏆 UPDATE WINNER] Current slot value: ${currentValue}`);
  
  // ВАЖНО: При изменении участника в следующем раунде ВСЕГДА очищаем winner_id и status
  // Это гарантирует, что старый победитель не останется в матче
  // Также устанавливаем status в 'scheduled', если другой слот пустой, иначе оставляем текущий
  const otherSlotValue = targetMatch[otherField];
  const newStatus = otherSlotValue ? (targetMatch.status || 'scheduled') : 'scheduled';
  
  await pool.query(`
    UPDATE matches 
    SET ${updateField} = $1, 
        winner_id = NULL,
        status = $3,
        end_time = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [newWinnerId, targetMatch.id, newStatus]);
  
  // Проверяем результат обновленного матча
  const afterUpdate = await pool.query(`
    SELECT id, ${updateField}, ${otherField}, winner_id, status, round 
    FROM matches WHERE id = $1
  `, [targetMatch.id]);
  
  console.log(`[🏆 UPDATE WINNER] ✅ Set ${newWinnerId} in ${nextRound} Match ${targetMatchIndex} (${targetSlot})`);
  console.log(`[🏆 UPDATE WINNER]   - After update, ${targetSlot} = ${afterUpdate.rows[0]?.[updateField]}`);
  console.log(`[🏆 UPDATE WINNER]   - After update, ${otherField} = ${afterUpdate.rows[0]?.[otherField]}`);
  console.log(`[🏆 UPDATE WINNER]   - After update, winner_id = ${afterUpdate.rows[0]?.winner_id} (should be NULL)`);
  
  if (afterUpdate.rows[0]?.winner_id != null) {
    console.error(`[🏆 UPDATE WINNER] ❌ ERROR: winner_id was NOT cleared! Value: ${afterUpdate.rows[0]?.winner_id}`);
  }
  
  // Проверяем ВСЕ матчи следующего раунда, чтобы убедиться, что все правильно
  const allNextRoundMatches = await pool.query(`
    SELECT m.id, m.player1_id, m.player2_id, m.winner_id, m.status, m.round,
           p1.full_name as player1_name, p1.username as player1_username,
           p2.full_name as player2_name, p2.username as player2_username,
           w.full_name as winner_name, w.username as winner_username
    FROM matches m
    LEFT JOIN players p1 ON m.player1_id = p1.id
    LEFT JOIN players p2 ON m.player2_id = p2.id
    LEFT JOIN players w ON m.winner_id = w.id
    WHERE m.tournament_id = $1 AND m.round = $2
    ORDER BY m.id ASC
  `, [tournamentId, nextRound]);
  
  console.log(`[🏆 UPDATE WINNER] 📊 All matches in ${nextRound} after update:`);
  allNextRoundMatches.rows.forEach((match) => {
    const player1 = match.player1_name || match.player1_username || `Player ${match.player1_id}`;
    const player2 = match.player2_name || match.player2_username || `Player ${match.player2_id}`;
    const winner = match.winner_name || match.winner_username || (match.winner_id ? `Player ${match.winner_id}` : 'None');
    
    console.log(`[🏆 UPDATE WINNER]   Match ${match.id}:`, {
      player1: `${player1} (ID: ${match.player1_id})`,
      player2: `${player2} (ID: ${match.player2_id})`,
      winner: `${winner} (ID: ${match.winner_id || 'NULL'})`,
      status: match.status,
      isUpdated: match.id === targetMatch.id ? '✅ UPDATED' : ''
    });
  });
  
  // Если есть еще раунды, проверяем их тоже
  const furtherRoundProgression = {
    'Semifinals': 'Final',
    'Round of 16': 'Quarterfinals',
    'Quarterfinals': 'Semifinals'
  };
  
  const furtherRound = furtherRoundProgression[nextRound];
  if (furtherRound) {
    const furtherMatches = await pool.query(`
      SELECT m.id, m.player1_id, m.player2_id, m.winner_id, m.status, m.round,
             p1.full_name as player1_name, p1.username as player1_username,
             p2.full_name as player2_name, p2.username as player2_username,
             w.full_name as winner_name, w.username as winner_username
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      LEFT JOIN players w ON m.winner_id = w.id
      WHERE m.tournament_id = $1 AND m.round = $2
      ORDER BY m.id ASC
    `, [tournamentId, furtherRound]);
    
    console.log(`[🏆 UPDATE WINNER] 📊 All matches in ${furtherRound} (may be affected):`);
    furtherMatches.rows.forEach((match) => {
      const player1 = match.player1_name || match.player1_username || `Player ${match.player1_id}`;
      const player2 = match.player2_name || match.player2_username || `Player ${match.player2_id}`;
      const winner = match.winner_name || match.winner_username || (match.winner_id ? `Player ${match.winner_id}` : 'None');
      
      console.log(`[🏆 UPDATE WINNER]   Match ${match.id}:`, {
        player1: `${player1} (ID: ${match.player1_id})`,
        player2: `${player2} (ID: ${match.player2_id})`,
        winner: `${winner} (ID: ${match.winner_id || 'NULL'})`,
        status: match.status
      });
    });
  }
  
  console.log(`[🏆 UPDATE WINNER] ========================================\n`);
}

// Helper function to advance winner to next round
async function advanceWinnerToNextRound(tournamentId, matchId, currentRound, winnerId, forceUpdate = false) {
  // Определяем следующий раунд
  const roundProgression = {
    'Round of 32': 'Round of 16',
    'Round of 16': 'Quarterfinals',
    'Quarterfinals': 'Semifinals',
    'Semifinals': 'Final',
    'First Round': 'Semifinals' // Для 4 игроков
  };
  
  const nextRound = roundProgression[currentRound];
  if (!nextRound) {
    console.log(`[🏆 ADVANCE] No next round for ${currentRound}`);
    return; // Это финал или неизвестный раунд
  }
  
  // Находим позицию текущего матча в раунде
  const currentMatches = await pool.query(`
    SELECT id FROM matches 
    WHERE tournament_id = $1 AND round = $2
    ORDER BY id ASC
  `, [tournamentId, currentRound]);
  
  const matchIndex = currentMatches.rows.findIndex(m => m.id === matchId);
  if (matchIndex === -1) {
    console.error(`[🏆 ADVANCE] Match ${matchId} not found in round ${currentRound}`);
    return;
  }
  
  // Определяем позицию в следующем раунде
  // Для Quarterfinals (4 матча) -> Semifinals (2 матча):
  // Match 0,1 -> Semifinals Match 0 (player1, player2)
  // Match 2,3 -> Semifinals Match 1 (player1, player2)
  // Для Semifinals (2 матча) -> Final (1 матч):
  // Match 0 -> Final Match 0 player1
  // Match 1 -> Final Match 0 player2
  
  const nextMatches = await pool.query(`
    SELECT id, player1_id, player2_id FROM matches 
    WHERE tournament_id = $1 AND round = $2
    ORDER BY id ASC
  `, [tournamentId, nextRound]);
  
  if (nextMatches.rows.length === 0) {
    console.error(`[🏆 ADVANCE] No matches found for next round ${nextRound}`);
    return;
  }
  
  let targetMatchIndex, targetSlot;
  
  if (currentRound === 'Quarterfinals') {
    // 4 матча -> 2 матча: 0,1 -> 0; 2,3 -> 1
    targetMatchIndex = Math.floor(matchIndex / 2);
    targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
  } else if (currentRound === 'Semifinals') {
    // 2 матча -> 1 матч: 0 -> player1, 1 -> player2
    targetMatchIndex = 0;
    targetSlot = matchIndex === 0 ? 'player1' : 'player2';
  } else if (currentRound === 'Round of 16') {
    // 8 матчей -> 4 матча: 0,1 -> 0; 2,3 -> 1; 4,5 -> 2; 6,7 -> 3
    targetMatchIndex = Math.floor(matchIndex / 2);
    targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
  } else if (currentRound === 'Round of 32') {
    // 16 матчей -> 8 матчей: 0,1 -> 0; 2,3 -> 1; ...
    targetMatchIndex = Math.floor(matchIndex / 2);
    targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
  } else if (currentRound === 'First Round') {
    // Для 4 игроков: 2 матча -> 1 матч
    targetMatchIndex = 0;
    targetSlot = matchIndex === 0 ? 'player1' : 'player2';
  } else {
    console.error(`[🏆 ADVANCE] Unknown round progression: ${currentRound}`);
    return;
  }
  
  if (targetMatchIndex >= nextMatches.rows.length) {
    console.error(`[🏆 ADVANCE] Target match index ${targetMatchIndex} out of range (${nextMatches.rows.length} matches)`);
    return;
  }
  
  const targetMatch = nextMatches.rows[targetMatchIndex];
  const updateField = targetSlot === 'player1' ? 'player1_id' : 'player2_id';
  
  // Проверяем, не заполнен ли уже этот слот (чтобы не перезаписывать при повторном вызове)
  const currentValue = targetMatch[updateField];
  if (!forceUpdate && currentValue && currentValue != winnerId) {
    console.log(`[🏆 ADVANCE] ⚠️ Slot ${targetSlot} in match ${targetMatch.id} already has player ${currentValue}, not updating to ${winnerId}`);
    return; // Не перезаписываем, если слот уже заполнен другим игроком (если не forceUpdate)
  }
  
  // Обновляем матч следующего раунда
  // ВАЖНО: При обновлении слота игрока ВСЕГДА очищаем winner_id
  console.log(`[🏆 ADVANCE] Before update - Match ${targetMatch.id}:`);
  console.log(`[🏆 ADVANCE]   - ${updateField}: ${currentValue}`);
  console.log(`[🏆 ADVANCE]   - winner_id: ${targetMatch.winner_id || 'NULL'}`);
  console.log(`[🏆 ADVANCE]   - Setting ${updateField} to ${winnerId}`);
  
  if (forceUpdate) {
    await pool.query(`
      UPDATE matches 
      SET ${updateField} = $1, 
          winner_id = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [winnerId, targetMatch.id]);
    console.log(`[🏆 ADVANCE] ✅ Winner ${winnerId} force-updated in ${nextRound} Match ${targetMatchIndex} (${targetSlot})`);
  } else {
    await pool.query(`
      UPDATE matches 
      SET ${updateField} = $1, 
          winner_id = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND (${updateField} IS NULL OR ${updateField} = $1)
    `, [winnerId, targetMatch.id]);
    console.log(`[🏆 ADVANCE] Winner ${winnerId} advanced to ${nextRound} Match ${targetMatchIndex} (${targetSlot})`);
  }
  
  // Проверяем результат обновленного матча
  const afterUpdate = await pool.query(`
    SELECT id, ${updateField}, winner_id, status, round 
    FROM matches WHERE id = $1
  `, [targetMatch.id]);
  
  console.log(`[🏆 ADVANCE]   - After update, ${updateField} = ${afterUpdate.rows[0]?.[updateField]}`);
  console.log(`[🏆 ADVANCE]   - After update, winner_id = ${afterUpdate.rows[0]?.winner_id} (should be NULL)`);
  
  if (afterUpdate.rows[0]?.winner_id != null) {
    console.error(`[🏆 ADVANCE] ❌ ERROR: winner_id was NOT cleared! Value: ${afterUpdate.rows[0]?.winner_id}`);
  }
  
  // Проверяем ВСЕ матчи следующего раунда
  const allNextRoundMatches = await pool.query(`
    SELECT m.id, m.player1_id, m.player2_id, m.winner_id, m.status, m.round,
           p1.full_name as player1_name, p1.username as player1_username,
           p2.full_name as player2_name, p2.username as player2_username,
           w.full_name as winner_name, w.username as winner_username
    FROM matches m
    LEFT JOIN players p1 ON m.player1_id = p1.id
    LEFT JOIN players p2 ON m.player2_id = p2.id
    LEFT JOIN players w ON m.winner_id = w.id
    WHERE m.tournament_id = $1 AND m.round = $2
    ORDER BY m.id ASC
  `, [tournamentId, nextRound]);
  
  console.log(`[🏆 ADVANCE] 📊 All matches in ${nextRound} after advance:`);
  allNextRoundMatches.rows.forEach((match) => {
    const player1 = match.player1_name || match.player1_username || `Player ${match.player1_id}`;
    const player2 = match.player2_name || match.player2_username || `Player ${match.player2_id}`;
    const winner = match.winner_name || match.winner_username || (match.winner_id ? `Player ${match.winner_id}` : 'None');
    
    console.log(`[🏆 ADVANCE]   Match ${match.id}:`, {
      player1: `${player1} (ID: ${match.player1_id})`,
      player2: `${player2} (ID: ${match.player2_id})`,
      winner: `${winner} (ID: ${match.winner_id || 'NULL'})`,
      status: match.status,
      isUpdated: match.id === targetMatch.id ? '✅ UPDATED' : ''
    });
  });
}

// Update match
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      player1_id, player2_id, winner_id, round, group_name, status,
      start_time, end_time, table_number
    } = req.body;
    
    // Build dynamic UPDATE query based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 0;
    
    if (player1_id !== undefined) {
      paramCount++;
      updates.push(`player1_id = $${paramCount}`);
      values.push(player1_id);
    }
    if (player2_id !== undefined) {
      paramCount++;
      updates.push(`player2_id = $${paramCount}`);
      values.push(player2_id);
    }
    if (winner_id !== undefined) {
      paramCount++;
      updates.push(`winner_id = $${paramCount}`);
      values.push(winner_id);
    }
    if (round !== undefined) {
      paramCount++;
      updates.push(`round = $${paramCount}`);
      values.push(round);
    }
    if (group_name !== undefined) {
      paramCount++;
      updates.push(`group_name = $${paramCount}`);
      values.push(group_name);
    }
    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      values.push(status);
    }
    if (start_time !== undefined) {
      paramCount++;
      updates.push(`start_time = $${paramCount}`);
      values.push(start_time);
    }
    if (end_time !== undefined) {
      paramCount++;
      updates.push(`end_time = $${paramCount}`);
      values.push(end_time);
    }
    if (table_number !== undefined) {
      paramCount++;
      updates.push(`table_number = $${paramCount}`);
      values.push(table_number);
    }
    
    // Always update updated_at (no parameter needed)
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add id parameter
    paramCount++;
    values.push(id);
    
    // Сначала получаем текущее состояние матча для проверки
    const currentMatch = await pool.query('SELECT status, winner_id, round, tournament_id FROM matches WHERE id = $1', [id]);
    if (currentMatch.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    const oldWinnerId = currentMatch.rows[0].winner_id;
    const wasAlreadyCompleted = currentMatch.rows[0].status === 'completed' && oldWinnerId;
    const oldRound = currentMatch.rows[0].round;
    const tournamentId = currentMatch.rows[0].tournament_id;
    
    const query = `
      UPDATE matches 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    const updatedMatch = result.rows[0];
    
    // Если матч завершен и есть победитель
    if (status === 'completed' && winner_id && updatedMatch.round) {
      try {
        // Если победитель изменился, нужно обновить следующий раунд
        const winnerChanged = wasAlreadyCompleted && oldWinnerId && oldWinnerId !== winner_id;
        
        console.log(`[🏆 MATCH UPDATE] Match ${id} completion check:`);
        console.log(`[🏆 MATCH UPDATE]   - Round: ${updatedMatch.round}`);
        console.log(`[🏆 MATCH UPDATE]   - Was already completed: ${wasAlreadyCompleted}`);
        console.log(`[🏆 MATCH UPDATE]   - Old winner: ${oldWinnerId}`);
        console.log(`[🏆 MATCH UPDATE]   - New winner: ${winner_id}`);
        console.log(`[🏆 MATCH UPDATE]   - Winner changed: ${winnerChanged}`);
        
        // Рейтинг будет пересчитан при завершении турнира, а не после каждого матча
        // Это позволяет учитывать все матчи турнира при расчете рейтинга
        
        // Если это финальный матч, завершаем турнир
        // Используем completeTournamentForTournaments для правильного обновления рейтинга
        if (updatedMatch.round === 'Final' || updatedMatch.round === 'Finals') {
          const completeFunc = getCompleteTournamentFunction();
          if (completeFunc) {
            await completeFunc(updatedMatch.tournament_id, winner_id);
          } else {
            // Fallback к старой функции, если импорт не удался
            await completeTournament(updatedMatch.tournament_id, winner_id);
          }
        } else {
          // ВАЖНО: Если победитель изменился, используем updateNextRoundOnWinnerChange
          // Эта функция правильно очищает winner_id и обновляет следующий раунд
          if (winnerChanged && oldWinnerId) {
            console.log(`[🏆 MATCH UPDATE] ⚠️ Winner changed from ${oldWinnerId} to ${winner_id}, calling updateNextRoundOnWinnerChange`);
            await updateNextRoundOnWinnerChange(updatedMatch.tournament_id, updatedMatch.id, oldRound, oldWinnerId, winner_id);
          } else {
            // Для новых завершений просто продвигаем победителя
            console.log(`[🏆 MATCH UPDATE] New completion, advancing winner ${winner_id} to next round`);
            await advanceWinnerToNextRound(updatedMatch.tournament_id, updatedMatch.id, updatedMatch.round, winner_id, false);
          }
        }
      } catch (advanceError) {
        console.error('Error processing match completion:', advanceError);
        // Не прерываем запрос, просто логируем ошибку
      }
    } else if (wasAlreadyCompleted && status === 'completed' && !winner_id) {
      // Если матч был завершен, но теперь победитель удален (матч отменен)
      console.log(`[🏆 ADVANCE] Match ${id} winner removed, may need to clear next round`);
    }
    
    res.json(updatedMatch);
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// Update match scores
router.put('/:id/scores', async (req, res) => {
  try {
    const { id } = req.params;
    const { player1_scores, player2_scores } = req.body;
    
    console.log(`[📊 UPDATE SCORES] ========================================`);
    console.log(`[📊 UPDATE SCORES] Match ID: ${id}`);
    console.log(`[📊 UPDATE SCORES] Player1 scores:`, player1_scores);
    console.log(`[📊 UPDATE SCORES] Player2 scores:`, player2_scores);
    
    // Проверяем существование матча
    const matchCheck = await pool.query('SELECT id, tournament_id FROM matches WHERE id = $1', [id]);
    if (matchCheck.rows.length === 0) {
      console.error(`[📊 UPDATE SCORES] ❌ Match ${id} not found`);
      return res.status(404).json({ error: 'Match not found' });
    }
    console.log(`[📊 UPDATE SCORES] ✅ Match found: Tournament ${matchCheck.rows[0].tournament_id}`);
    
    // Проверяем существующие scores
    const existingScores = await pool.query('SELECT * FROM match_scores WHERE match_id = $1', [id]);
    console.log(`[📊 UPDATE SCORES] Existing scores records: ${existingScores.rows.length}`);
    
    // Update or insert score record (use ON CONFLICT to update existing)
    try {
      await pool.query(`
        INSERT INTO match_scores (match_id, player1_scores, player2_scores)
        VALUES ($1, $2, $3)
        ON CONFLICT (match_id) 
        DO UPDATE SET 
          player1_scores = $2,
          player2_scores = $3,
          created_at = CURRENT_TIMESTAMP
      `, [id, player1_scores, player2_scores]);
      console.log(`[📊 UPDATE SCORES] ✅ Scores updated successfully`);
    } catch (conflictError) {
      // Если ON CONFLICT не работает (нет уникального индекса), используем DELETE + INSERT
      if (conflictError.code === '42P10' || conflictError.message.includes('conflict')) {
        console.log(`[📊 UPDATE SCORES] ⚠️ ON CONFLICT not supported, using DELETE + INSERT`);
        await pool.query('DELETE FROM match_scores WHERE match_id = $1', [id]);
        await pool.query(`
          INSERT INTO match_scores (match_id, player1_scores, player2_scores)
          VALUES ($1, $2, $3)
        `, [id, player1_scores, player2_scores]);
        console.log(`[📊 UPDATE SCORES] ✅ Scores updated using DELETE + INSERT`);
      } else {
        throw conflictError;
      }
    }
    
    // Получаем текущее состояние матча ДО обновления
    const currentMatch = await pool.query('SELECT winner_id, round, tournament_id, status FROM matches WHERE id = $1', [id]);
    if (currentMatch.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    const oldWinnerId = currentMatch.rows[0].winner_id;
    const oldRound = currentMatch.rows[0].round;
    const tournamentId = currentMatch.rows[0].tournament_id;
    const wasAlreadyCompleted = currentMatch.rows[0].status === 'completed' && oldWinnerId;
    
    // Determine winner based on scores
    let winner_id = null;
    if (player1_scores && player2_scores) {
      const p1Sets = player1_scores.length;
      const p2Sets = player2_scores.length;
      
      console.log(`[📊 UPDATE SCORES] Calculating winner: P1 sets=${p1Sets}, P2 sets=${p2Sets}`);
      
      if (p1Sets > p2Sets) {
        const matchData = await pool.query('SELECT player1_id FROM matches WHERE id = $1', [id]);
        winner_id = matchData.rows[0]?.player1_id;
        console.log(`[📊 UPDATE SCORES] Winner: Player1 (ID: ${winner_id})`);
      } else if (p2Sets > p1Sets) {
        const matchData = await pool.query('SELECT player2_id FROM matches WHERE id = $1', [id]);
        winner_id = matchData.rows[0]?.player2_id;
        console.log(`[📊 UPDATE SCORES] Winner: Player2 (ID: ${winner_id})`);
      } else {
        console.log(`[📊 UPDATE SCORES] No winner determined (equal sets)`);
      }
    }
    
    // Update match with winner and status (only if winner determined)
    if (winner_id) {
      // Проверяем, изменился ли победитель
      const winnerChanged = wasAlreadyCompleted && oldWinnerId && oldWinnerId !== winner_id;
      
      console.log(`[📊 UPDATE SCORES] Match completion check:`);
      console.log(`[📊 UPDATE SCORES]   - Round: ${oldRound}`);
      console.log(`[📊 UPDATE SCORES]   - Was already completed: ${wasAlreadyCompleted}`);
      console.log(`[📊 UPDATE SCORES]   - Old winner: ${oldWinnerId}`);
      console.log(`[📊 UPDATE SCORES]   - New winner: ${winner_id}`);
      console.log(`[📊 UPDATE SCORES]   - Winner changed: ${winnerChanged}`);
      
      // Обновляем матч с winner и status
      await pool.query(`
        UPDATE matches 
        SET winner_id = $1, 
            status = 'completed'
        WHERE id = $2
      `, [winner_id, id]);
      console.log(`[📊 UPDATE SCORES] ✅ Match updated with winner ${winner_id}`);
      
      // Если победитель изменился, обновляем следующий раунд
      if (winnerChanged && oldWinnerId && oldRound) {
        try {
          console.log(`[📊 UPDATE SCORES] ⚠️ Winner changed from ${oldWinnerId} to ${winner_id}, calling updateNextRoundOnWinnerChange`);
          await updateNextRoundOnWinnerChange(tournamentId, id, oldRound, oldWinnerId, winner_id);
        } catch (updateError) {
          console.error(`[📊 UPDATE SCORES] ⚠️ Error updating next round:`, updateError.message);
          // Не прерываем запрос, просто логируем ошибку
        }
      } else if (!wasAlreadyCompleted && oldRound) {
        // Если матч был впервые завершен, продвигаем победителя
        try {
          console.log(`[📊 UPDATE SCORES] New completion, advancing winner ${winner_id} to next round`);
          await advanceWinnerToNextRound(tournamentId, id, oldRound, winner_id, false);
        } catch (advanceError) {
          console.error(`[📊 UPDATE SCORES] ⚠️ Error advancing winner:`, advanceError.message);
          // Не прерываем запрос, просто логируем ошибку
        }
      }
      
      // Рейтинг будет пересчитан при завершении турнира, а не после каждого матча
      // Это позволяет учитывать все матчи турнира при расчете рейтинга
      
      // Если это финальный матч, завершаем турнир
      // Используем completeTournamentForTournaments для правильного обновления рейтинга
      if (oldRound === 'Final' || oldRound === 'Finals') {
        try {
          const completeFunc = getCompleteTournamentFunction();
          if (completeFunc) {
            await completeFunc(tournamentId, winner_id);
          } else {
            // Fallback к старой функции, если импорт не удался
            await completeTournament(tournamentId, winner_id);
          }
        } catch (completeError) {
          console.error(`[📊 UPDATE SCORES] ⚠️ Error completing tournament:`, completeError.message);
        }
      }
    }
    
    console.log(`[📊 UPDATE SCORES] ========================================\n`);
    res.json({ message: 'Match scores updated successfully' });
  } catch (error) {
    console.error(`[📊 UPDATE SCORES] ❌ Error updating match scores:`, error);
    console.error(`[📊 UPDATE SCORES] Error stack:`, error.stack);
    console.error(`[📊 UPDATE SCORES] Error code:`, error.code);
    console.error(`[📊 UPDATE SCORES] Error detail:`, error.detail);
    console.error(`[📊 UPDATE SCORES] ========================================\n`);
    res.status(500).json({ 
      error: 'Failed to update match scores',
      message: error.message,
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Start match
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      UPDATE matches 
      SET status = 'in-progress', start_time = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'scheduled'
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Match not found or cannot be started' });
    }
    
    res.json({ message: 'Match started successfully' });
  } catch (error) {
    console.error('Error starting match:', error);
    res.status(500).json({ error: 'Failed to start match' });
  }
});

// Complete match
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { winner_id } = req.body;
    
    const result = await pool.query(`
      UPDATE matches 
      SET status = 'completed', winner_id = $1, end_time = CURRENT_TIMESTAMP
      WHERE id = $2 AND status = 'in-progress'
      RETURNING *
    `, [winner_id, id]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Match not found or cannot be completed' });
    }
    
    res.json({ message: 'Match completed successfully' });
  } catch (error) {
    console.error('Error completing match:', error);
    res.status(500).json({ error: 'Failed to complete match' });
  }
});

// Delete match
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM matches WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

// Export helper functions for use in other modules
module.exports = router;
module.exports.updateRatingsAfterMatch = updateRatingsAfterMatch;
