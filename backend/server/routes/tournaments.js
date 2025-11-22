const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const pool = require('../../config/database');

// Get all tournaments with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      format, 
      search,
      date_from,
      date_to,
      organizer_id,
      sort = 'date',
      order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    // Build WHERE conditions
    if (status) {
      paramCount++;
      whereConditions.push(`t.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (format) {
      paramCount++;
      whereConditions.push(`t.format = $${paramCount}`);
      queryParams.push(format);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(t.name ILIKE $${paramCount} OR t.location ILIKE $${paramCount} OR t.venue ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    if (date_from) {
      paramCount++;
      whereConditions.push(`t.date >= $${paramCount}`);
      queryParams.push(date_from);
    }

    if (date_to) {
      paramCount++;
      whereConditions.push(`t.date <= $${paramCount}`);
      queryParams.push(date_to);
    }

    if (organizer_id) {
      paramCount++;
      const orgId = parseInt(organizer_id);
      if (!isNaN(orgId)) {
        whereConditions.push(`t.organizer_id = $${paramCount}`);
        queryParams.push(orgId);
        console.log('Filtering by organizer_id:', orgId);
      }
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    console.log('WHERE clause:', whereClause);
    console.log('Query params:', queryParams);

    // Get tournaments
    const tournamentsQuery = `
      SELECT 
        t.*,
        p.username as organizer_username,
        p.full_name as organizer_name,
        COUNT(tp.player_id) as participant_count
      FROM tournaments t
      LEFT JOIN players p ON t.organizer_id = p.id
      LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
      ${whereClause}
      GROUP BY t.id, p.username, p.full_name
      ORDER BY t.${sort} ${order.toUpperCase()}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(parseInt(limit), offset);

    console.log('Final SQL query:', tournamentsQuery);
    console.log('Final query params:', queryParams);
    
    const tournamentsResult = await pool.query(tournamentsQuery, queryParams);
    console.log('Tournaments found:', tournamentsResult.rows.length);

    // Normalize participant_count to number
    const normalizedTournaments = tournamentsResult.rows.map(t => ({
      ...t,
      participant_count: parseInt(t.participant_count, 10) || 0,
      current_participants: parseInt(t.current_participants, 10) || 0
    }));

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT t.id)
      FROM tournaments t
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    res.json({
      tournaments: normalizedTournaments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

// Get tournament participants (MUST be before /:id route)
router.get('/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        p.id,
        p.username,
        p.full_name,
        p.country,
        p.avatar_url,
        p.rating,
        tp.registered_at
      FROM tournament_participants tp
      JOIN players p ON tp.player_id = p.id
      WHERE tp.tournament_id = $1
      ORDER BY p.rating DESC
    `;

    const result = await pool.query(query, [id]);

    res.json({
      participants: result.rows
    });

  } catch (error) {
    console.error('Error fetching tournament participants:', error);
    res.status(500).json({ error: 'Failed to fetch tournament participants' });
  }
});

// Get tournament matches
router.get('/:id/matches', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, round, group } = req.query;

    let whereConditions = ['m.tournament_id = $1'];
    let queryParams = [id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereConditions.push(`m.status = $${paramCount}`);
      queryParams.push(status);
    }

    if (round) {
      paramCount++;
      whereConditions.push(`m.round = $${paramCount}`);
      queryParams.push(round);
    }

    if (group) {
      paramCount++;
      whereConditions.push(`m.group_name = $${paramCount}`);
      queryParams.push(group);
    }

    const query = `
      SELECT 
        m.*,
        p1.username as player1_username,
        p1.full_name as player1_name,
        p1.rating as player1_rating,
        p2.username as player2_username,
        p2.full_name as player2_name,
        p2.rating as player2_rating,
        winner.username as winner_username,
        winner.full_name as winner_name,
        ms.player1_scores,
        ms.player2_scores
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      LEFT JOIN players winner ON m.winner_id = winner.id
      LEFT JOIN match_scores ms ON m.id = ms.match_id
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY t.date ASC, m.id ASC
      LIMIT 10000
    `;

    const result = await pool.query(query, queryParams);

    res.json({
      matches: result.rows
    });

  } catch (error) {
    console.error('Error fetching tournament matches:', error);
    res.status(500).json({ error: 'Failed to fetch tournament matches' });
  }
});

// Get tournament standings
router.get('/:id/standings', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        ts.*,
        p.username,
        p.full_name,
        p.country,
        p.avatar_url,
        p.rating
      FROM tournament_standings ts
      JOIN players p ON ts.player_id = p.id
      WHERE ts.tournament_id = $1
      ORDER BY ts.rank ASC
    `;

    const result = await pool.query(query, [id]);

    res.json({
      standings: result.rows
    });

  } catch (error) {
    console.error('Error fetching tournament standings:', error);
    res.status(500).json({ error: 'Failed to fetch tournament standings' });
  }
});

// Unregister player from tournament (MUST be before /:id route)
router.delete('/:id/register/:playerId', async (req, res) => {
  try {
    const { id, playerId } = req.params;

    // Check if tournament exists
    const tournamentQuery = `
      SELECT status
      FROM tournaments 
      WHERE id = $1
    `;
    const tournamentResult = await pool.query(tournamentQuery, [id]);

    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const tournament = tournamentResult.rows[0];

    // Check if participant exists
    const participantQuery = `
      SELECT id FROM tournament_participants
      WHERE tournament_id = $1 AND player_id = $2
    `;
    const participantResult = await pool.query(participantQuery, [id, playerId]);

    if (participantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found in this tournament' });
    }

    // Delete participant
    await pool.query(`
      DELETE FROM tournament_participants
      WHERE tournament_id = $1 AND player_id = $2
    `, [id, playerId]);

    // Update participant count
    await pool.query(`
      UPDATE tournaments 
      SET current_participants = GREATEST(0, current_participants - 1)
      WHERE id = $1
    `, [id]);

    res.status(200).json({
      message: 'Successfully unregistered from tournament'
    });

  } catch (error) {
    console.error('Error unregistering from tournament:', error);
    res.status(500).json({ error: 'Failed to unregister from tournament' });
  }
});

// Get single tournament with details (MUST be after all /:id/... routes)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get tournament details
    const tournamentQuery = `
      SELECT 
        t.*,
        p.username as organizer_username,
        p.full_name as organizer_name
      FROM tournaments t
      LEFT JOIN players p ON t.organizer_id = p.id
      WHERE t.id = $1
    `;

    const tournamentResult = await pool.query(tournamentQuery, [id]);

    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const tournament = tournamentResult.rows[0];

    // Get participants
    const participantsQuery = `
      SELECT 
        p.id,
        p.username,
        p.full_name,
        p.country,
        p.avatar_url,
        p.rating,
        tp.registered_at
      FROM tournament_participants tp
      JOIN players p ON tp.player_id = p.id
      WHERE tp.tournament_id = $1
      ORDER BY p.rating DESC
    `;

    const participantsResult = await pool.query(participantsQuery, [id]);

    // Get matches count first (защита от перегрузки)
    const matchCountResult = await pool.query(
      'SELECT COUNT(*) as count FROM matches WHERE tournament_id = $1',
      [id]
    );
    const matchCount = parseInt(matchCountResult.rows[0].count);
    
    let matchesResult;
    // Если матчей больше 1000, возвращаем только счетчик (предупреждение о проблеме)
    if (matchCount > 1000) {
      console.error(`[⚠️  WARNING] Tournament ${id} has ${matchCount} matches! Too many, not loading all.`);
      matchesResult = { rows: [] }; // Возвращаем пустой массив, чтобы не перегружать сервер
    } else {
      // Get matches (только если их немного)
    const matchesQuery = `
      SELECT 
        m.*,
        p1.username as player1_username,
        p1.full_name as player1_name,
        p2.username as player2_username,
        p2.full_name as player2_name,
        winner.username as winner_username,
        winner.full_name as winner_name,
        ms.player1_scores,
        ms.player2_scores
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      LEFT JOIN players winner ON m.winner_id = winner.id
      LEFT JOIN match_scores ms ON m.id = ms.match_id
      LEFT JOIN tournaments t ON m.tournament_id = t.id
      WHERE m.tournament_id = $1
      ORDER BY t.date ASC, m.id ASC
        LIMIT 1000
    `;

      matchesResult = await pool.query(matchesQuery, [id]);
    }

    // Get standings
    const standingsQuery = `
      SELECT 
        ts.*,
        p.username,
        p.full_name,
        p.country,
        p.avatar_url,
        p.rating
      FROM tournament_standings ts
      JOIN players p ON ts.player_id = p.id
      WHERE ts.tournament_id = $1
      ORDER BY ts.rank ASC
    `;

    const standingsResult = await pool.query(standingsQuery, [id]);

    // Add participant_count to tournament object for consistency
    tournament.participant_count = participantsResult.rows.length;

    res.json({
      tournament,
      participants: participantsResult.rows,
      matches: matchesResult.rows,
      standings: standingsResult.rows
    });

  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ error: 'Failed to fetch tournament' });
  }
});

// Create new tournament
router.post('/', async (req, res) => {
  try {
    const {
      name,
      date,
      time,
      location,
      venue,
      format,
      match_format,
      max_participants,
      description,
      organizer_id,
      image_url,
      num_groups,
      players_per_group_advance
    } = req.body;

    const query = `
      INSERT INTO tournaments (name, date, time, location, venue, format, match_format, max_participants, description, organizer_id, image_url, num_groups, players_per_group_advance)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await pool.query(query, [
      name, date, time, location, venue, format, match_format, max_participants, description, organizer_id, image_url || null, num_groups || null, players_per_group_advance || null
    ]);

    res.status(201).json({
      tournament: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

// Register player for tournament
router.post('/:id/register', async (req, res) => {
  try {
    const { id } = req.params;
    const { player_id } = req.body;

    // Check if tournament exists and has space
    const tournamentQuery = `
      SELECT current_participants, max_participants, status
      FROM tournaments 
      WHERE id = $1
    `;
    const tournamentResult = await pool.query(tournamentQuery, [id]);

    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const tournament = tournamentResult.rows[0];

    if (tournament.status !== 'upcoming') {
      return res.status(400).json({ error: 'Tournament registration is closed' });
    }

    if (tournament.current_participants >= tournament.max_participants) {
      return res.status(400).json({ error: 'Tournament is full' });
    }

    // Register player
    const registerQuery = `
      INSERT INTO tournament_participants (tournament_id, player_id)
      VALUES ($1, $2)
      ON CONFLICT (tournament_id, player_id) DO NOTHING
      RETURNING *
    `;

    const result = await pool.query(registerQuery, [id, player_id]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Player already registered for this tournament' });
    }

    // Update participant count
    await pool.query(`
      UPDATE tournaments 
      SET current_participants = current_participants + 1 
      WHERE id = $1
    `, [id]);

    res.status(201).json({
      message: 'Successfully registered for tournament',
      registration: result.rows[0]
    });

  } catch (error) {
    console.error('Error registering for tournament:', error);
    res.status(500).json({ error: 'Failed to register for tournament' });
  }
});

// Register guest player for tournament (non-system user)
router.post('/:id/register-guest', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      country, 
      skill_level, 
      additional_info,
      registered_by_organizer = false 
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !country) {
      return res.status(400).json({ error: 'Missing required fields: first_name, last_name, email, country' });
    }

    // Check if tournament exists and has space
    const tournamentQuery = `
      SELECT current_participants, max_participants, status
      FROM tournaments 
      WHERE id = $1
    `;
    const tournamentResult = await pool.query(tournamentQuery, [id]);

    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const tournament = tournamentResult.rows[0];

    if (tournament.status !== 'upcoming' && !registered_by_organizer) {
      return res.status(400).json({ error: 'Tournament registration is closed' });
    }

    if (tournament.current_participants >= tournament.max_participants) {
      return res.status(400).json({ error: 'Tournament is full' });
    }

    // Check if guest player already registered for this tournament
    const existingGuestQuery = `
      SELECT id FROM guest_tournament_players 
      WHERE tournament_id = $1 AND email = $2
    `;
    const existingGuest = await pool.query(existingGuestQuery, [id, email]);

    if (existingGuest.rows.length > 0) {
      return res.status(400).json({ error: 'This email is already registered for this tournament' });
    }

    // Create guest player record
    const createGuestQuery = `
      INSERT INTO guest_tournament_players 
        (tournament_id, first_name, last_name, email, phone, country, skill_level, additional_info, registered_by_organizer)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const guestResult = await pool.query(createGuestQuery, [
      id, first_name, last_name, email, phone || null, country, skill_level || null, additional_info || null, registered_by_organizer
    ]);

    const guestPlayer = guestResult.rows[0];

    // Add to tournament participants
    const addParticipantQuery = `
      INSERT INTO tournament_participants (tournament_id, guest_player_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const participantResult = await pool.query(addParticipantQuery, [id, guestPlayer.id]);

    // Update participant count
    await pool.query(`
      UPDATE tournaments 
      SET current_participants = current_participants + 1 
      WHERE id = $1
    `, [id]);

    // Send confirmation email
    try {
      const tournamentDetails = await pool.query(
        'SELECT name, date, time, location FROM tournaments WHERE id = $1',
        [id]
      );
      
      if (tournamentDetails.rows.length > 0) {
        const tournament = tournamentDetails.rows[0];
        const tournamentDate = new Date(tournament.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const tournamentTime = tournament.time 
          ? ` at ${tournament.time}` 
          : '';

        await emailService.sendTournamentRegistrationConfirmation({
          email: guestPlayer.email,
          playerName: `${guestPlayer.first_name} ${guestPlayer.last_name}`,
          tournamentName: tournament.name,
          tournamentDate: `${tournamentDate}${tournamentTime}`,
          tournamentLocation: tournament.location,
        });
        
        console.log(`[Tournament Registration] Confirmation email sent to ${guestPlayer.email}`);
      }
    } catch (emailError) {
      console.error('[Tournament Registration] Failed to send confirmation email:', emailError);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      message: 'Successfully registered as guest player for tournament',
      guest_player: guestPlayer,
      registration: participantResult.rows[0]
    });

  } catch (error) {
    console.error('Error registering guest player for tournament:', error);
    res.status(500).json({ error: 'Failed to register guest player for tournament' });
  }
});

// Get all participants for a tournament (both system and guest players)
router.get('/:id/all-participants', async (req, res) => {
  try {
    const { id } = req.params;

    const participantsQuery = `
      SELECT 
        tp.id,
        tp.tournament_id,
        tp.player_id,
        tp.guest_player_id,
        CASE 
          WHEN tp.player_id IS NOT NULL THEN 'system'
          ELSE 'guest'
        END as player_type,
        CASE 
          WHEN tp.player_id IS NOT NULL THEN p.full_name
          ELSE CONCAT(gtp.first_name, ' ', gtp.last_name)
        END as full_name,
        CASE 
          WHEN tp.player_id IS NOT NULL THEN p.username
          ELSE NULL
        END as username,
        CASE 
          WHEN tp.player_id IS NOT NULL THEN p.email
          ELSE gtp.email
        END as email,
        CASE 
          WHEN tp.player_id IS NOT NULL THEN p.country
          ELSE gtp.country
        END as country,
        CASE 
          WHEN tp.player_id IS NOT NULL THEN p.rating
          ELSE NULL
        END as rating,
        CASE 
          WHEN tp.player_id IS NOT NULL THEN p.avatar_url
          ELSE NULL
        END as avatar_url,
        gtp.skill_level as guest_skill_level,
        gtp.phone as guest_phone,
        tp.registered_at
      FROM tournament_participants tp
      LEFT JOIN players p ON tp.player_id = p.id
      LEFT JOIN guest_tournament_players gtp ON tp.guest_player_id = gtp.id
      WHERE tp.tournament_id = $1
      ORDER BY tp.registered_at ASC
    `;

    const result = await pool.query(participantsQuery, [id]);

    res.json({
      participants: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error fetching all participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// Helper function to update bracket when winner changes (duplicated from matches.js)
async function updateTournamentBracketOnWinnerChange(tournamentId, matchId, currentRound, oldWinnerId, newWinnerId) {
  console.log(`[🏆 TOURNAMENT UPDATE WINNER] Winner changed in match ${matchId} (${currentRound})`);
  console.log(`[🏆 TOURNAMENT UPDATE WINNER] Old winner: ${oldWinnerId}, New winner: ${newWinnerId}`);
  
  // Reset dependent matches first
  await resetTournamentDependentMatches(tournamentId, matchId, currentRound);
  
  // Then update the next round with new winner
  const roundProgression = {
    'Round of 32': 'Round of 16',
    'Round of 16': 'Quarterfinals',
    'Quarterfinals': 'Semifinals',
    'Semifinals': 'Final',
    'First Round': 'Semifinals'
  };
  
  const nextRound = roundProgression[currentRound];
  if (!nextRound) return;
  
  // Find match position
  const currentMatches = await pool.query(`
    SELECT id FROM matches 
    WHERE tournament_id = $1 AND round = $2
    ORDER BY id ASC
  `, [tournamentId, currentRound]);
  
  const matchIndex = currentMatches.rows.findIndex(m => m.id === matchId);
  if (matchIndex === -1) return;
  
  // Find target match in next round
  const nextMatches = await pool.query(`
    SELECT id, player1_id, player2_id, winner_id FROM matches 
    WHERE tournament_id = $1 AND round = $2
    ORDER BY id ASC
  `, [tournamentId, nextRound]);
  
  if (nextMatches.rows.length === 0) return;
  
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
  
  if (targetMatchIndex >= nextMatches.rows.length) return;
  
  const targetMatch = nextMatches.rows[targetMatchIndex];
  const updateField = targetSlot === 'player1' ? 'player1_id' : 'player2_id';
  const currentValue = targetMatch[updateField];
  
  // ALWAYS clear winner_id when updating player slot - игрок изменился, старый победитель недействителен
  console.log(`[🏆 TOURNAMENT UPDATE WINNER] Before update - Match ${targetMatch.id}:`);
  console.log(`[🏆 TOURNAMENT UPDATE WINNER]   - ${updateField}: ${currentValue}`);
  console.log(`[🏆 TOURNAMENT UPDATE WINNER]   - winner_id: ${targetMatch.winner_id}`);
  console.log(`[🏆 TOURNAMENT UPDATE WINNER]   - Old winner: ${oldWinnerId}, New winner: ${newWinnerId}`);
  
  await pool.query(`
    UPDATE matches 
    SET ${updateField} = $1, 
        winner_id = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [newWinnerId, targetMatch.id]);
  
  // Проверяем результат обновленного матча
  const afterUpdate = await pool.query(`
    SELECT id, ${updateField}, winner_id, status, round 
    FROM matches WHERE id = $1
  `, [targetMatch.id]);
  
  console.log(`[🏆 TOURNAMENT UPDATE WINNER] ✅ Updated ${nextRound} match ${targetMatchIndex} (${targetSlot}) with ${newWinnerId}`);
  console.log(`[🏆 TOURNAMENT UPDATE WINNER]   - After update, ${updateField} = ${afterUpdate.rows[0]?.[updateField]}`);
  console.log(`[🏆 TOURNAMENT UPDATE WINNER]   - After update, winner_id = ${afterUpdate.rows[0]?.winner_id} (should be NULL)`);
  
  if (afterUpdate.rows[0]?.winner_id != null) {
    console.error(`[🏆 TOURNAMENT UPDATE WINNER] ❌ ERROR: winner_id was NOT cleared! Value: ${afterUpdate.rows[0]?.winner_id}`);
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
  
  console.log(`[🏆 TOURNAMENT UPDATE WINNER] 📊 All matches in ${nextRound} after update:`);
  allNextRoundMatches.rows.forEach((match) => {
    const player1 = match.player1_name || match.player1_username || `Player ${match.player1_id}`;
    const player2 = match.player2_name || match.player2_username || `Player ${match.player2_id}`;
    const winner = match.winner_name || match.winner_username || (match.winner_id ? `Player ${match.winner_id}` : 'None');
    
    console.log(`[🏆 TOURNAMENT UPDATE WINNER]   Match ${match.id}:`, {
      player1: `${player1} (ID: ${match.player1_id})`,
      player2: `${player2} (ID: ${match.player2_id})`,
      winner: `${winner} (ID: ${match.winner_id || 'NULL'})`,
      status: match.status,
      isUpdated: match.id === targetMatch.id ? '✅ UPDATED' : ''
    });
  });
  
  // Проверяем также текущий раунд (откуда пришел победитель)
  const currentRoundMatches = await pool.query(`
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
  `, [tournamentId, currentRound]);
  
  console.log(`[🏆 TOURNAMENT UPDATE WINNER] 📊 All matches in ${currentRound} (source round):`);
  currentRoundMatches.rows.forEach((match) => {
    const player1 = match.player1_name || match.player1_username || `Player ${match.player1_id}`;
    const player2 = match.player2_name || match.player2_username || `Player ${match.player2_id}`;
    const winner = match.winner_name || match.winner_username || (match.winner_id ? `Player ${match.winner_id}` : 'None');
    
    console.log(`[🏆 TOURNAMENT UPDATE WINNER]   Match ${match.id}:`, {
      player1: `${player1} (ID: ${match.player1_id})`,
      player2: `${player2} (ID: ${match.player2_id})`,
      winner: `${winner} (ID: ${match.winner_id || 'NULL'})`,
      status: match.status,
      isSource: match.id === matchId ? '✅ SOURCE' : ''
    });
  });
}

// Helper function to reset dependent matches (duplicated from matches.js)
async function resetTournamentDependentMatches(tournamentId, matchId, currentRound) {
  console.log(`[🔄 TOURNAMENT CASCADE RESET] Starting for match ${matchId} in ${currentRound}`);
  
  const roundProgression = {
    'Round of 32': 'Round of 16',
    'Round of 16': 'Quarterfinals',
    'Quarterfinals': 'Semifinals',
    'Semifinals': 'Final',
    'First Round': 'Semifinals'
  };
  
  const nextRound = roundProgression[currentRound];
  if (!nextRound) return;
  
  // Find match position - use the matchId directly, don't search
  const currentMatches = await pool.query(`
    SELECT id FROM matches 
    WHERE tournament_id = $1 AND round = $2
    ORDER BY id ASC
  `, [tournamentId, currentRound]);
  
  const matchIndex = currentMatches.rows.findIndex(m => m.id === matchId);
  if (matchIndex === -1) {
    console.log(`[🔄 TOURNAMENT CASCADE RESET] ⚠️ Match ${matchId} not found in ${currentRound}, but continuing...`);
    // Try to find the match anyway by ID
    const matchCheck = await pool.query('SELECT round FROM matches WHERE id = $1', [matchId]);
    if (matchCheck.rows.length > 0) {
      console.log(`[🔄 TOURNAMENT CASCADE RESET] Match ${matchId} actual round: ${matchCheck.rows[0].round}`);
    }
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
  
  const nextMatches = await pool.query(`
    SELECT id, player1_id, player2_id, winner_id FROM matches 
    WHERE tournament_id = $1 AND round = $2
    ORDER BY id ASC
  `, [tournamentId, nextRound]);
  
  if (targetMatchIndex >= nextMatches.rows.length) return;
  
  const dependentMatch = nextMatches.rows[targetMatchIndex];
  const updateField = targetSlot === 'player1' ? 'player1_id' : 'player2_id';
  const otherField = targetSlot === 'player1' ? 'player2_id' : 'player1_id';
  
  // Delete scores
  await pool.query('DELETE FROM match_scores WHERE match_id = $1', [dependentMatch.id]);
  
  // Reset the slot and winner_id
  const otherSlotValue = dependentMatch[otherField];
  const newStatus = otherSlotValue ? 'scheduled' : 'scheduled';
  
  await pool.query(`
    UPDATE matches 
    SET ${updateField} = NULL,
        winner_id = NULL,
        status = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [dependentMatch.id, newStatus]);
  
  console.log(`[🔄 TOURNAMENT CASCADE RESET] ✅ Reset match ${dependentMatch.id} in ${nextRound} (${targetSlot})`);
  
  // Recursively reset further rounds
  if (nextRound !== 'Final') {
    await resetTournamentDependentMatches(tournamentId, dependentMatch.id, nextRound);
  }
}

// Helper function to advance winner (duplicated from matches.js)
async function advanceTournamentWinnerToNextRound(tournamentId, matchId, currentRound, winnerId) {
  console.log(`[🏆 TOURNAMENT ADVANCE] ========================================`);
  console.log(`[🏆 TOURNAMENT ADVANCE] 🚀 Advancing winner to next round...`);
  console.log(`[🏆 TOURNAMENT ADVANCE]   - Tournament ID: ${tournamentId}`);
  console.log(`[🏆 TOURNAMENT ADVANCE]   - Match ID: ${matchId}`);
  console.log(`[🏆 TOURNAMENT ADVANCE]   - Current Round: ${currentRound}`);
  console.log(`[🏆 TOURNAMENT ADVANCE]   - Winner ID: ${winnerId}`);
  
  const roundProgression = {
    'Round of 32': 'Round of 16',
    'Round of 16': 'Quarterfinals',
    'Quarterfinals': 'Semifinals',
    'Semifinals': 'Final',
    'First Round': 'Semifinals'
  };
  
  const nextRound = roundProgression[currentRound];
  if (!nextRound) {
    console.log(`[🏆 TOURNAMENT ADVANCE] ❌ No next round for ${currentRound}`);
    return;
  }
  
  console.log(`[🏆 TOURNAMENT ADVANCE]   - Next Round: ${nextRound}`);
  
  // Получаем информацию о текущем матче, чтобы проверить, не является ли он матчем с bye
  const currentMatchInfo = await pool.query(`
    SELECT id, player1_id, player2_id, round, status, winner_id FROM matches 
    WHERE id = $1
  `, [matchId]);
  
  if (currentMatchInfo.rows.length === 0) {
    console.log(`[🏆 TOURNAMENT ADVANCE] ❌ Match ${matchId} not found`);
    return;
  }
  
  const matchInfo = currentMatchInfo.rows[0];
  const isByeMatch = matchInfo.player2_id === null && matchInfo.player1_id !== null;
  
  console.log(`[🏆 TOURNAMENT ADVANCE]   - Match Info:`);
  console.log(`[🏆 TOURNAMENT ADVANCE]      - Player1 ID: ${matchInfo.player1_id}`);
  console.log(`[🏆 TOURNAMENT ADVANCE]      - Player2 ID: ${matchInfo.player2_id}`);
  console.log(`[🏆 TOURNAMENT ADVANCE]      - Status: ${matchInfo.status}`);
  console.log(`[🏆 TOURNAMENT ADVANCE]      - Winner ID: ${matchInfo.winner_id}`);
  console.log(`[🏆 TOURNAMENT ADVANCE]      - Is Bye Match: ${isByeMatch}`);
  
  // ВАЖНО: Матчи с bye (player2_id = NULL) должны продвигаться, но только когда они завершены
  // Это нормально, если матч с bye завершен (winner_id установлен)
  if (isByeMatch) {
    console.log(`[🏆 TOURNAMENT ADVANCE] ⚠️  This is a bye match (player2_id = NULL)`);
    console.log(`[🏆 TOURNAMENT ADVANCE]   - Bye matches should advance when completed`);
  }
  
  const currentMatches = await pool.query(`
    SELECT id FROM matches 
    WHERE tournament_id = $1 AND round = $2
    ORDER BY id ASC
  `, [tournamentId, currentRound]);
  
  const matchIndex = currentMatches.rows.findIndex(m => m.id === matchId);
  if (matchIndex === -1) {
    console.log(`[🏆 TOURNAMENT ADVANCE] ❌ Match ${matchId} not found in ${currentRound}`);
    return;
  }
  
  console.log(`[🏆 TOURNAMENT ADVANCE]   - Match Index: ${matchIndex} (out of ${currentMatches.rows.length} matches)`);
  
  const nextMatches = await pool.query(`
    SELECT id, player1_id, player2_id FROM matches 
    WHERE tournament_id = $1 AND round = $2
    ORDER BY id ASC
  `, [tournamentId, nextRound]);
  
  if (nextMatches.rows.length === 0) {
    console.log(`[🏆 TOURNAMENT ADVANCE] ❌ No matches found in ${nextRound}`);
    return;
  }
  
  console.log(`[🏆 TOURNAMENT ADVANCE]   - Next Round Matches: ${nextMatches.rows.length}`);
  
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
    console.log(`[🏆 TOURNAMENT ADVANCE] ❌ Unknown round: ${currentRound}`);
    return;
  }
  
  console.log(`[🏆 TOURNAMENT ADVANCE]   - Target Match Index: ${targetMatchIndex}`);
  console.log(`[🏆 TOURNAMENT ADVANCE]   - Target Slot: ${targetSlot}`);
  
  if (targetMatchIndex >= nextMatches.rows.length) {
    console.log(`[🏆 TOURNAMENT ADVANCE] ❌ Target match index ${targetMatchIndex} >= ${nextMatches.rows.length}`);
    return;
  }
  
  const targetMatch = nextMatches.rows[targetMatchIndex];
  const updateField = targetSlot === 'player1' ? 'player1_id' : 'player2_id';
  const currentValue = targetMatch[updateField];
  const shouldClearWinner = currentValue != winnerId;
  
  console.log(`[🏆 TOURNAMENT ADVANCE]   - Target Match ID: ${targetMatch.id}`);
  console.log(`[🏆 TOURNAMENT ADVANCE]   - Update Field: ${updateField}`);
  console.log(`[🏆 TOURNAMENT ADVANCE]   - Current Value: ${currentValue}`);
  console.log(`[🏆 TOURNAMENT ADVANCE]   - Should Clear Winner: ${shouldClearWinner}`);
  
  await pool.query(`
    UPDATE matches 
    SET ${updateField} = $1, 
        winner_id = CASE WHEN $3 THEN NULL ELSE winner_id END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND (${updateField} IS NULL OR ${updateField} = $1)
  `, [winnerId, targetMatch.id, shouldClearWinner]);
  
  console.log(`[🏆 TOURNAMENT ADVANCE] ✅ Advanced ${winnerId} to ${nextRound} match ${targetMatchIndex} (${targetSlot})`);
  console.log(`[🏆 TOURNAMENT ADVANCE] ========================================`);
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
async function completeTournamentForTournaments(tournamentId, winnerId) {
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
    
    // Получаем информацию о победителе (если winnerId предоставлен)
    let winner = null;
    if (winnerId) {
      const winnerInfo = await pool.query(`
        SELECT id, full_name, username FROM players WHERE id = $1
      `, [winnerId]);
      
      winner = winnerInfo.rows[0];
      if (!winner) {
        console.error(`[🏆 TOURNAMENT COMPLETE] Winner ${winnerId} not found`);
        // Continue anyway for round-robin tournaments
      }
    }
    
    // Обновляем статус турнира на completed (если еще не обновлен)
    await pool.query(`
      UPDATE tournaments 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status != 'completed'
    `, [tournamentId]);
    
    console.log(`[🏆 TOURNAMENT COMPLETE] ========================================`);
    console.log(`[🏆 TOURNAMENT COMPLETE] Tournament ${tournamentId} completed!`);
    if (winner) {
      console.log(`[🏆 TOURNAMENT COMPLETE] Winner: ${winner.full_name || winner.username} (ID: ${winnerId})`);
    } else {
      console.log(`[🏆 TOURNAMENT COMPLETE] Winner: To be determined from standings`);
    }
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
    } else if (tournamentFormat === 'round-robin') {
      // Создаем standings для round-robin турнира
      try {
        console.log(`[🏆 TOURNAMENT COMPLETE] Creating standings for round-robin tournament...`);
        
        // Получаем всех участников турнира
        const participantsResult = await pool.query(`
          SELECT tp.player_id, p.username, p.full_name
          FROM tournament_participants tp
          JOIN players p ON tp.player_id = p.id
          WHERE tp.tournament_id = $1
          ORDER BY tp.player_id
        `, [tournamentId]);
        
        const participants = participantsResult.rows;
        console.log(`[🏆 TOURNAMENT COMPLETE] Found ${participants.length} participants`);
        
        if (participants.length === 0) {
          console.log(`[🏆 TOURNAMENT COMPLETE] No participants found, skipping standings`);
          return;
        }
        
        // Получаем все матчи турнира
        const allMatches = await pool.query(`
          SELECT m.id, m.player1_id, m.player2_id, m.winner_id, ms.player1_scores, ms.player2_scores
          FROM matches m
          LEFT JOIN match_scores ms ON m.id = ms.match_id
          WHERE m.tournament_id = $1
            AND m.status = 'completed'
            AND (m.round = 'Round Robin' OR m.round IS NULL)
        `, [tournamentId]);
        
        console.log(`[🏆 TOURNAMENT COMPLETE] Found ${allMatches.rows.length} completed matches`);
        
        // Создаем объект для хранения статистики каждого игрока
        const playerStats = new Map(); // player_id -> {wins, losses, pointDifference}
        
        // Инициализируем статистику для всех участников
        participants.forEach(p => {
          playerStats.set(p.player_id, { wins: 0, losses: 0, pointDifference: 0 });
        });
        
        // Обрабатываем каждый матч
        for (const match of allMatches.rows) {
          if (!match.player1_id || !match.player2_id || !match.winner_id) continue;
          
          const loser = match.player1_id === match.winner_id ? match.player2_id : match.player1_id;
          
          // Обновляем статистику победителя
          if (playerStats.has(match.winner_id)) {
            const stats = playerStats.get(match.winner_id);
            stats.wins++;
            
            // Подсчитываем разницу очков, если есть счета
            if (match.player1_scores && match.player2_scores && 
                Array.isArray(match.player1_scores) && Array.isArray(match.player2_scores)) {
              let p1Points = 0, p2Points = 0;
              for (let i = 0; i < Math.max(match.player1_scores.length, match.player2_scores.length); i++) {
                p1Points += (match.player1_scores[i] || 0);
                p2Points += (match.player2_scores[i] || 0);
              }
              
              if (match.winner_id === match.player1_id) {
                stats.pointDifference += (p1Points - p2Points);
              } else {
                stats.pointDifference += (p2Points - p1Points);
              }
            }
          }
          
          // Обновляем статистику проигравшего
          if (playerStats.has(loser)) {
            const stats = playerStats.get(loser);
            stats.losses++;
            
            // Подсчитываем разницу очков, если есть счета
            if (match.player1_scores && match.player2_scores && 
                Array.isArray(match.player1_scores) && Array.isArray(match.player2_scores)) {
              let p1Points = 0, p2Points = 0;
              for (let i = 0; i < Math.max(match.player1_scores.length, match.player2_scores.length); i++) {
                p1Points += (match.player1_scores[i] || 0);
                p2Points += (match.player2_scores[i] || 0);
              }
              
              if (loser === match.player1_id) {
                stats.pointDifference += (p1Points - p2Points);
              } else {
                stats.pointDifference += (p2Points - p1Points);
              }
            }
          }
        }
        
        // Создаем массив standings и сортируем
        const standingsArray = Array.from(playerStats.entries()).map(([playerId, stats]) => {
          const participant = participants.find(p => p.player_id === playerId);
          return {
            playerId,
            wins: stats.wins,
            losses: stats.losses,
            points: stats.wins * 3, // 3 очка за победу
            pointDifference: stats.pointDifference
          };
        });
        
        // Сортируем: сначала по points (wins * 3), потом по pointDifference, потом по wins
        standingsArray.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
          return b.wins - a.wins;
        });
        
        // Назначаем ранги
        standingsArray.forEach((standing, index) => {
          standing.rank = index + 1;
        });
        
        // Удаляем существующие standings для этого турнира
        await pool.query('DELETE FROM tournament_standings WHERE tournament_id = $1', [tournamentId]);
        
        // Вставляем новые standings
        for (const standing of standingsArray) {
          await pool.query(`
            INSERT INTO tournament_standings (tournament_id, player_id, rank, wins, losses, points)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (tournament_id, player_id) 
            DO UPDATE SET rank = $3, wins = $4, losses = $5, points = $6, updated_at = CURRENT_TIMESTAMP
          `, [tournamentId, standing.playerId, standing.rank, standing.wins, standing.losses, standing.points]);
        }
        
        console.log(`[🏆 TOURNAMENT COMPLETE] ✅ Created ${standingsArray.length} standings for round-robin tournament`);
      } catch (standingsError) {
        console.error(`[🏆 TOURNAMENT COMPLETE] ⚠️ Error creating standings for round-robin:`, standingsError);
        // Не прерываем выполнение, просто логируем ошибку
      }
    } else if (tournamentFormat === 'group-stage') {
      // Создаем standings для group-stage турнира
      try {
        console.log(`[🏆 TOURNAMENT COMPLETE] Creating standings for group-stage tournament...`);
        
        // Получаем настройки турнира
        const tournamentSettings = await pool.query(`
          SELECT num_groups, players_per_group_advance
          FROM tournaments
          WHERE id = $1
        `, [tournamentId]);
        
        const numGroups = tournamentSettings.rows[0]?.num_groups;
        const playersPerGroupAdvance = tournamentSettings.rows[0]?.players_per_group_advance || 2;
        
        if (!numGroups) {
          console.log(`[🏆 TOURNAMENT COMPLETE] No group settings found, skipping standings`);
          return;
        }
        
        // Получаем всех участников турнира
        const participantsResult = await pool.query(`
          SELECT tp.player_id, p.username, p.full_name
          FROM tournament_participants tp
          JOIN players p ON tp.player_id = p.id
          WHERE tp.tournament_id = $1
          ORDER BY tp.player_id
        `, [tournamentId]);
        
        const participants = participantsResult.rows;
        console.log(`[🏆 TOURNAMENT COMPLETE] Found ${participants.length} participants`);
        
        if (participants.length === 0) {
          console.log(`[🏆 TOURNAMENT COMPLETE] No participants found, skipping standings`);
          return;
        }
        
        // Получаем все матчи турнира
        const allMatches = await pool.query(`
          SELECT m.id, m.player1_id, m.player2_id, m.winner_id, m.round, m.group_name, ms.player1_scores, ms.player2_scores
          FROM matches m
          LEFT JOIN match_scores ms ON m.id = ms.match_id
          WHERE m.tournament_id = $1
            AND m.status = 'completed'
        `, [tournamentId]);
        
        console.log(`[🏆 TOURNAMENT COMPLETE] Found ${allMatches.rows.length} completed matches`);
        
        // Разделяем матчи на групповые и плей-офф
        const groupMatches = allMatches.rows.filter(m => m.group_name || (m.round === 'Group Stage'));
        const playoffMatches = allMatches.rows.filter(m => !m.group_name && m.round && m.round !== 'Group Stage');
        
        // Определяем игроков, которые прошли в плей-офф
        const playoffPlayers = new Set();
        playoffMatches.forEach(match => {
          if (match.player1_id) playoffPlayers.add(match.player1_id);
          if (match.player2_id && match.player2_id !== null) playoffPlayers.add(match.player2_id);
        });
        
        // Создаем standings для плей-офф (аналогично single-elimination)
        const playoffStandings = new Map(); // player_id -> {rank, wins, losses}
        
        // Определяем ранг игроков в плей-офф на основе результатов матчей
        const roundsOrder = ['Final', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32'];
        
        // Победитель финала - 1 место
        const finalMatch = playoffMatches.find(m => (m.round === 'Final' || m.round === 'Finals') && m.winner_id);
        if (finalMatch) {
          playoffStandings.set(finalMatch.winner_id, { rank: 1, wins: 0, losses: 0 });
          
          const finalLoser = finalMatch.player1_id === finalMatch.winner_id ? finalMatch.player2_id : finalMatch.player1_id;
          if (finalLoser) {
            playoffStandings.set(finalLoser, { rank: 2, wins: 0, losses: 0 });
          }
        }
        
        // Определяем раунд выбытия для остальных игроков плей-офф
        for (const round of roundsOrder) {
          const roundMatches = playoffMatches.filter(m => m.round === round);
          for (const match of roundMatches) {
            if (match.winner_id && match.player1_id && match.player2_id) {
              const loser = match.player1_id === match.winner_id ? match.player2_id : match.player1_id;
              if (loser && !playoffStandings.has(loser)) {
                let rank = 999; // По умолчанию для тех, кто не прошел
                if (round === 'Semifinals') rank = 3;
                else if (round === 'Quarterfinals') rank = 5;
                else if (round === 'Round of 16') rank = 9;
                else if (round === 'Round of 32') rank = 17;
                playoffStandings.set(loser, { rank, wins: 0, losses: 0 });
              }
            }
          }
        }
        
        // Подсчитываем победы и поражения для игроков плей-офф
        for (const match of playoffMatches) {
          if (match.winner_id && match.player1_id && match.player2_id) {
            const loser = match.player1_id === match.winner_id ? match.player2_id : match.player1_id;
            
            if (playoffStandings.has(match.winner_id)) {
              const stats = playoffStandings.get(match.winner_id);
              stats.wins++;
            }
            
            if (playoffStandings.has(loser)) {
              const stats = playoffStandings.get(loser);
              stats.losses++;
            }
          }
        }
        
        // Для игроков, которые не прошли в плей-офф, используем ранг 999 (Group Stage)
        const groupStageStandings = new Map();
        participants.forEach(p => {
          if (!playoffPlayers.has(p.player_id)) {
            groupStageStandings.set(p.player_id, { rank: 999, wins: 0, losses: 0 });
          }
        });
        
        // Подсчитываем победы и поражения для игроков группового этапа
        for (const match of groupMatches) {
          if (match.winner_id && match.player1_id && match.player2_id) {
            const loser = match.player1_id === match.winner_id ? match.player2_id : match.player1_id;
            
            if (groupStageStandings.has(match.winner_id)) {
              const stats = groupStageStandings.get(match.winner_id);
              stats.wins++;
            }
            
            if (groupStageStandings.has(loser)) {
              const stats = groupStageStandings.get(loser);
              stats.losses++;
            }
          }
        }
        
        // Удаляем существующие standings для этого турнира
        await pool.query('DELETE FROM tournament_standings WHERE tournament_id = $1', [tournamentId]);
        
        // Вставляем standings для игроков плей-офф
        for (const [playerId, stats] of playoffStandings.entries()) {
          await pool.query(`
            INSERT INTO tournament_standings (tournament_id, player_id, rank, wins, losses, points)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (tournament_id, player_id) 
            DO UPDATE SET rank = $3, wins = $4, losses = $5, points = $6, updated_at = CURRENT_TIMESTAMP
          `, [tournamentId, playerId, stats.rank, stats.wins, stats.losses, stats.wins * 3]);
        }
        
        // Вставляем standings для игроков группового этапа
        for (const [playerId, stats] of groupStageStandings.entries()) {
          await pool.query(`
            INSERT INTO tournament_standings (tournament_id, player_id, rank, wins, losses, points)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (tournament_id, player_id) 
            DO UPDATE SET rank = $3, wins = $4, losses = $5, points = $6, updated_at = CURRENT_TIMESTAMP
          `, [tournamentId, playerId, stats.rank, stats.wins, stats.losses, stats.wins * 3]);
        }
        
        console.log(`[🏆 TOURNAMENT COMPLETE] ✅ Created ${playoffStandings.size + groupStageStandings.size} standings for group-stage tournament`);
      } catch (standingsError) {
        console.error(`[🏆 TOURNAMENT COMPLETE] ⚠️ Error creating standings for group-stage:`, standingsError);
        // Не прерываем выполнение, просто логируем ошибку
      }
    }
    
    // Пересчитываем рейтинг для всех матчей турнира по порядку
    // Рейтинг обновляется последовательно после каждого матча, начиная с первого
    try {
      console.log(`[🏆 TOURNAMENT COMPLETE] Calculating rating changes for all matches in tournament...`);
      
      const { updateRatingsAfterMatch } = require('./matches');
      
      // Получаем все завершенные матчи турнира в хронологическом порядке
      const allMatchesResult = await pool.query(`
        SELECT m.id, m.player1_id, m.player2_id, m.winner_id, m.status
        FROM matches m
        WHERE m.tournament_id = $1
          AND m.status = 'completed'
          AND m.winner_id IS NOT NULL
        ORDER BY COALESCE(m.end_time, m.start_time, (SELECT t.date FROM tournaments t WHERE t.id = m.tournament_id)) ASC
      `, [tournamentId]);
      
      if (allMatchesResult.rows.length === 0) {
        console.log(`[🏆 TOURNAMENT COMPLETE] No completed matches found, skipping rating calculation`);
      } else {
        console.log(`[🏆 TOURNAMENT COMPLETE] Found ${allMatchesResult.rows.length} completed matches`);
        
        // Удаляем старые записи рейтинга для матчей этого турнира
        // Это нужно, чтобы пересчитать рейтинг заново с правильным порядком
        await pool.query(`
          DELETE FROM player_rating_history prh
          WHERE prh.match_id IN (
            SELECT m.id FROM matches m WHERE m.tournament_id = $1
          )
        `, [tournamentId]);
        console.log(`[🏆 TOURNAMENT COMPLETE] Cleared old rating history for tournament matches`);
        
        // Обрабатываем каждый матч по порядку
        // Рейтинг будет обновляться последовательно после каждого матча
        let processedCount = 0;
        for (const match of allMatchesResult.rows) {
          try {
            console.log(`[🏆 TOURNAMENT COMPLETE]   Processing match ${match.id}...`);
            await updateRatingsAfterMatch(match.id);
            processedCount++;
          } catch (ratingError) {
            console.error(`[🏆 TOURNAMENT COMPLETE]   ⚠️ Error updating rating for match ${match.id}:`, ratingError.message);
            // Продолжаем обработку следующих матчей
          }
        }
        
        console.log(`[🏆 TOURNAMENT COMPLETE] ✅ Updated rating history for ${processedCount}/${allMatchesResult.rows.length} matches`);
      }
    } catch (ratingCheckError) {
      console.error(`[🏆 TOURNAMENT COMPLETE] ⚠️ Error calculating ratings:`, ratingCheckError);
      // Не прерываем выполнение, просто логируем ошибку
    }
    
    console.log(`[🏆 TOURNAMENT COMPLETE] ========================================`);
  } catch (error) {
    console.error(`[🏆 TOURNAMENT COMPLETE] Error completing tournament:`, error);
    throw error;
  }
}

// Update match result
router.put('/:id/matches/:matchId', async (req, res) => {
  try {
    const { id, matchId } = req.params;
    const { winner_id, player1_scores, player2_scores, status = 'completed' } = req.body;

    // Get current match state before update
    const currentMatch = await pool.query('SELECT status, winner_id, round, tournament_id FROM matches WHERE id = $1', [matchId]);
    if (currentMatch.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    const oldWinnerId = currentMatch.rows[0].winner_id;
    const wasAlreadyCompleted = currentMatch.rows[0].status === 'completed' && oldWinnerId;
    const oldRound = currentMatch.rows[0].round;
    const tournamentId = currentMatch.rows[0].tournament_id;

    // Update match with winner and status
    const matchQuery = `
      UPDATE matches 
      SET winner_id = $1, 
          status = $2
      WHERE id = $3 AND tournament_id = $4
      RETURNING *
    `;

    const matchResult = await pool.query(matchQuery, [
      winner_id, 
      status, 
      matchId, 
      id
    ]);

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const updatedMatch = matchResult.rows[0];

    // Update or create match scores
    if (player1_scores && player2_scores) {
      const scoresQuery = `
        INSERT INTO match_scores (match_id, player1_scores, player2_scores)
        VALUES ($1, $2, $3)
        ON CONFLICT (match_id) 
        DO UPDATE SET 
          player1_scores = $2,
          player2_scores = $3
      `;

      await pool.query(scoresQuery, [matchId, player1_scores, player2_scores]);
    }

    // Update bracket progression if match is completed and has a winner
    // IMPORTANT: Use the same logic as /api/matches/:id route
    if (status === 'completed' && winner_id && updatedMatch.round) {
      try {
        const winnerChanged = wasAlreadyCompleted && oldWinnerId && oldWinnerId !== winner_id;
        
        // Если это финальный матч, завершаем турнир
        if (oldRound === 'Final' || oldRound === 'Finals') {
          try {
            await completeTournamentForTournaments(tournamentId, winner_id);
          } catch (completeError) {
            console.error(`[🏆 TOURNAMENT MATCH UPDATE] ⚠️ Error completing tournament:`, completeError.message);
          }
        } else {
          if (winnerChanged && oldRound) {
            // Winner changed - need to update next round properly
            // Call the same logic as matches route
            console.log(`[🏆 TOURNAMENT MATCH UPDATE] Winner changed from ${oldWinnerId} to ${winner_id}, updating bracket...`);
            
            // Import and use the same helper functions logic
            // Since we can't import directly, we'll duplicate the critical parts
            await updateTournamentBracketOnWinnerChange(tournamentId, matchId, oldRound, oldWinnerId, winner_id);
          } else if (!wasAlreadyCompleted && oldRound) {
            // New completion - advance winner to next round
            await advanceTournamentWinnerToNextRound(tournamentId, matchId, oldRound, winner_id);
          }
        }
      } catch (bracketError) {
        console.error('Error updating bracket progression:', bracketError);
        // Don't fail the request, just log the error
      }
    }

    res.json({
      match: matchResult.rows[0],
      message: 'Match result updated successfully'
    });

  } catch (error) {
    console.error('Error updating match result:', error);
    res.status(500).json({ error: 'Failed to update match result' });
  }
});

// Update tournament
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      date,
      time,
      location,
      venue,
      format,
      match_format,
      max_participants,
      description,
      status,
      image_url,
      num_groups,
      players_per_group_advance
    } = req.body;

    // Build dynamic UPDATE query
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      values.push(name);
    }
    if (date !== undefined) {
      paramCount++;
      updates.push(`date = $${paramCount}`);
      values.push(date);
    }
    if (time !== undefined) {
      paramCount++;
      updates.push(`time = $${paramCount}`);
      values.push(time);
    }
    if (location !== undefined) {
      paramCount++;
      updates.push(`location = $${paramCount}`);
      values.push(location);
    }
    if (venue !== undefined) {
      paramCount++;
      updates.push(`venue = $${paramCount}`);
      values.push(venue);
    }
    if (format !== undefined) {
      paramCount++;
      updates.push(`format = $${paramCount}`);
      values.push(format);
    }
    if (match_format !== undefined) {
      paramCount++;
      updates.push(`match_format = $${paramCount}`);
      values.push(match_format);
    }
    if (max_participants !== undefined) {
      paramCount++;
      updates.push(`max_participants = $${paramCount}`);
      values.push(max_participants);
    }
    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      values.push(description);
    }
    if (status !== undefined) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      values.push(status);
    }
    if (image_url !== undefined) {
      paramCount++;
      updates.push(`image_url = $${paramCount}`);
      values.push(image_url);
    }
    if (num_groups !== undefined) {
      paramCount++;
      updates.push(`num_groups = $${paramCount}`);
      values.push(num_groups);
    }
    if (players_per_group_advance !== undefined) {
      paramCount++;
      updates.push(`players_per_group_advance = $${paramCount}`);
      values.push(players_per_group_advance);
    }

    // Always update updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    paramCount++;
    values.push(id);

    const query = `
      UPDATE tournaments 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    // Сначала получаем текущий статус турнира ДО обновления (с блокировкой для предотвращения race condition)
    let oldStatus = null;
    let oldFormat = null;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
    if (status !== undefined) {
        const oldTournament = await client.query(
          'SELECT status, format, name, current_participants, max_participants FROM tournaments WHERE id = $1 FOR UPDATE',
        [id]
      );
      if (oldTournament.rows.length > 0) {
        oldStatus = oldTournament.rows[0].status;
          oldFormat = oldTournament.rows[0].format;
          const tournamentName = oldTournament.rows[0].name;
          const participantCount = oldTournament.rows[0].current_participants;
          const maxParticipants = oldTournament.rows[0].max_participants;
          
          console.log(`\n[🔄 STATUS TRANSITION] ========================================`);
          console.log(`[🔄 STATUS TRANSITION] Tournament ID: ${id}`);
          console.log(`[🔄 STATUS TRANSITION] Tournament Name: "${tournamentName}"`);
          console.log(`[🔄 STATUS TRANSITION] Format: ${oldFormat}`);
          console.log(`[🔄 STATUS TRANSITION] Participants: ${participantCount}/${maxParticipants}`);
          console.log(`[🔄 STATUS TRANSITION] Status Change: ${oldStatus} → ${status}`);
          
          // Детальное логирование переходов
          if (oldStatus === status) {
            console.log(`[🔄 STATUS TRANSITION] ⚠️  Status unchanged (${status}), no transition needed`);
          } else {
            console.log(`[🔄 STATUS TRANSITION] ✅ Status transition requested: ${oldStatus} → ${status}`);
            
            // Специальные логи для критических переходов
            if (oldStatus === 'upcoming' && status === 'ongoing') {
              console.log(`[🔄 STATUS TRANSITION] 🎯 CRITICAL: Tournament starting! Matches will be generated.`);
            } else if (oldStatus === 'scheduled' && status === 'ongoing') {
              console.log(`[🔄 STATUS TRANSITION] 🎯 CRITICAL: Tournament starting from scheduled! Matches will be generated.`);
            } else if (oldStatus === 'ongoing' && status === 'completed') {
              console.log(`[🔄 STATUS TRANSITION] 🏁 Tournament completing! No new matches will be created.`);
            } else if (oldStatus === 'ongoing' && status !== 'completed') {
              console.log(`[🔄 STATUS TRANSITION] ⚠️  Changing status of active tournament from 'ongoing' to '${status}'`);
            }
          }
          console.log(`[🔄 STATUS TRANSITION] ========================================\n`);
      }
    }

      // Выполняем UPDATE внутри той же транзакции
      const result = await client.query(query, values);

    if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
      return res.status(404).json({ error: 'Tournament not found' });
    }

      // Автоматическая генерация матчей при переводе турнира из "upcoming" или "scheduled" в "ongoing" (идущий)
      // Matches are automatically generated when tournament status changes from "upcoming" or "scheduled" to "ongoing"
      // КРИТИЧЕСКАЯ ПРОВЕРКА: Генерируем матчи ТОЛЬКО если статус действительно меняется с upcoming/scheduled на ongoing
      // И ТОЛЬКО ОДИН РАЗ - проверяем текущий статус после UPDATE
      const currentStatus = result.rows[0].status;
      
      console.log(`\n[🔵 MATCH GENERATION] ==========================================`);
      console.log(`[🔵 MATCH GENERATION] Status Check Details:`);
      console.log(`[🔵 MATCH GENERATION]   - Old Status: ${oldStatus || 'N/A'}`);
      console.log(`[🔵 MATCH GENERATION]   - Requested Status: ${status || 'N/A'}`);
      console.log(`[🔵 MATCH GENERATION]   - Current Status (after UPDATE): ${currentStatus || 'N/A'}`);
      
      // КРИТИЧЕСКАЯ ПРОВЕРКА: если статус УЖЕ ongoing, НЕ генерируем матчи (даже если oldStatus === 'upcoming' или 'scheduled' - это может быть ошибка чтения)
      if (oldStatus === 'ongoing') {
        console.log(`[🔵 MATCH GENERATION] ⏭️  SKIPPED: Tournament ${id} is already ongoing`);
        console.log(`[🔵 MATCH GENERATION]   Reason: oldStatus=${oldStatus}, currentStatus=${currentStatus}`);
        console.log(`[🔵 MATCH GENERATION] ⚠️  WARNING: If matches are missing, tournament was likely:`);
        console.log(`[🔵 MATCH GENERATION]     - Created directly with 'ongoing' status, OR`);
        console.log(`[🔵 MATCH GENERATION]     - Updated via direct SQL/API call bypassing proper transition`);
        console.log(`[🔵 MATCH GENERATION]   Solution: Change status to 'upcoming', then back to 'ongoing'`);
        console.log(`[🔵 MATCH GENERATION] ==========================================\n`);
      } else if (status === 'ongoing' && (oldStatus === 'upcoming' || oldStatus === 'scheduled') && currentStatus === 'ongoing') {
        // ПРОВЕРКА: Проверяем количество матчей ПЕРЕД генерацией
        const preCheckMatches = await client.query(
        'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
        [id]
      );
        const preCheckCount = parseInt(preCheckMatches.rows[0].count);
        
        // КРИТИЧЕСКАЯ ЗАЩИТА: Если матчей больше 0, НИКОГДА не генерируем!
        if (preCheckCount > 0) {
          console.error(`[🔵 MATCH GENERATION] ❌❌❌ CRITICAL BLOCK: Tournament ${id} has ${preCheckCount} matches! BLOCKING ALL GENERATION!`);
          await client.query('COMMIT');
          client.release();
          matchGenerationInProgress.delete(id);
          return;
        }
        
        const tournamentFormat = result.rows[0].format || oldFormat;
        const tournamentName = result.rows[0].name;
        const participantCount = result.rows[0].current_participants;
        
        console.log(`[🔵 MATCH GENERATION] ✅ STATUS CHANGE DETECTED!`);
        console.log(`[🔵 MATCH GENERATION]   Transition: ${oldStatus} → ${status} (verified: ${currentStatus})`);
        console.log(`[🔵 MATCH GENERATION] Tournament Details:`);
        console.log(`[🔵 MATCH GENERATION]   - Name: "${tournamentName}"`);
        console.log(`[🔵 MATCH GENERATION]   - ID: ${id}`);
        console.log(`[🔵 MATCH GENERATION]   - Format: ${tournamentFormat}`);
        console.log(`[🔵 MATCH GENERATION]   - Participants: ${participantCount}`);
        console.log(`[🔵 MATCH GENERATION] Match Check:`);
        console.log(`[🔵 MATCH GENERATION]   - Existing matches (pre-check): ${preCheckCount}`);
        
        // Проверяем, есть ли уже матчи С БЛОКИРОВКОЙ внутри той же транзакции
        const lockedCheck = await client.query(
          'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
          [id]
        );
        
        const existingCount = parseInt(lockedCheck.rows[0].count);
        console.log(`[🔵 MATCH GENERATION]   - Existing matches (locked check): ${existingCount}`);
        
        // ЕЩЕ ОДНА ПРОВЕРКА: если матчей > 0, блокируем
        if (existingCount > 0) {
          console.error(`[🔵 MATCH GENERATION] ❌❌❌ CRITICAL BLOCK!`);
          console.error(`[🔵 MATCH GENERATION]   Reason: Found ${existingCount} matches during locked check`);
          console.error(`[🔵 MATCH GENERATION]   Action: BLOCKING match generation to prevent duplicates`);
          await client.query('COMMIT');
          client.release();
          console.log(`[🔵 MATCH GENERATION] ==========================================\n`);
          return;
        }
        
        if (existingCount === 0) {
          console.log(`[🔵 MATCH GENERATION] ✅ VERIFIED: No matches exist, proceeding with generation...`);
          console.log(`[🔵 MATCH GENERATION]   - Format-specific generator will be called: ${tournamentFormat}`);
          
          // Освобождаем клиент перед вызовом функций генерации (они создадут свой клиент)
          await client.query('COMMIT');
          client.release();
          
          // Используем advisory lock для предотвращения параллельной генерации
          try {
            await withAdvisoryLock(id, async (lockClient) => {
              // Двойная проверка внутри блокировки
              const doubleLockCheck = await lockClient.query(
                'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
                [id]
              );
              const doubleCount = parseInt(doubleLockCheck.rows[0].count);
              
                console.log(`[🔵 MATCH GENERATION] 🔒 Advisory lock acquired`);
                console.log(`[🔵 MATCH GENERATION]   - Lock status: ACTIVE`);
                console.log(`[🔵 MATCH GENERATION]   - Double-check matches: ${doubleCount}`);
              
              // КРИТИЧЕСКИ ВАЖНО: Если есть старые матчи, удаляем их перед созданием новых
              if (doubleCount > 0) {
                console.log(`[🔵 MATCH GENERATION] ⚠️  Found ${doubleCount} existing matches`);
                console.log(`[🔵 MATCH GENERATION] 🗑️  Deleting old matches before creating new ones...`);
                
                // Удаляем старые матчи и их результаты
                const deletedScores = await lockClient.query(
                  'DELETE FROM match_scores WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = $1)',
                  [id]
                );
                console.log(`[🔵 MATCH GENERATION]   ✅ Deleted ${deletedScores.rowCount} match scores`);
                
                const deletedMatches = await lockClient.query(
                  'DELETE FROM matches WHERE tournament_id = $1',
                  [id]
                );
                console.log(`[🔵 MATCH GENERATION]   ✅ Deleted ${deletedMatches.rowCount} matches`);
                
                // Удаляем старые standings
                const deletedStandings = await lockClient.query(
                  'DELETE FROM tournament_standings WHERE tournament_id = $1',
                  [id]
                );
                console.log(`[🔵 MATCH GENERATION]   ✅ Deleted ${deletedStandings.rowCount} tournament standings`);
                
                console.log(`[🔵 MATCH GENERATION] ✅ All old matches deleted successfully!`);
              }
                
                // КРИТИЧЕСКАЯ ПРОВЕРКА: Еще раз проверяем количество МАКСИМАЛЬНО СТРОГО
                const tripleCheck = await lockClient.query(
                  'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
                  [id]
                );
                const tripleCount = parseInt(tripleCheck.rows[0].count);
                
                if (tripleCount > 0) {
                  console.error(`[🔵 MATCH GENERATION] ❌❌❌ TRIPLE CHECK FAILED!`);
                  console.error(`[🔵 MATCH GENERATION]   - Triple-check matches: ${tripleCount}`);
                  console.error(`[🔵 MATCH GENERATION]   - Action: BLOCKING generation to prevent duplicates`);
                throw new Error(`Cannot create matches: ${tripleCount} matches still exist after deletion`);
                }
                
                console.log(`[🔵 MATCH GENERATION]   - Triple-check matches: ${tripleCount} ✅`);
                console.log(`[🔵 MATCH GENERATION] 🚀 Starting match generation...`);
                console.log(`[🔵 MATCH GENERATION]   - Generator type: ${tournamentFormat}`);
                
                // Создаем матчи в зависимости от формата турнира
                const generationStartTime = Date.now();
                try {
                  if (tournamentFormat === 'single-elimination') {
                    await createSingleEliminationMatches(id);
                  } else if (tournamentFormat === 'round-robin') {
                    await createRoundRobinMatches(id);
                  } else if (tournamentFormat === 'group-stage') {
                    await createGroupStageMatches(id);
                  } else {
                    console.error(`[🔵 MATCH GENERATION] ❌ Unknown tournament format: ${tournamentFormat}`);
                  }
                  const generationDuration = Date.now() - generationStartTime;
                  console.log(`[🔵 MATCH GENERATION]   - Generation completed in ${generationDuration}ms`);
                } catch (genError) {
                  console.error(`[🔵 MATCH GENERATION] ❌ Generation error:`, genError);
                  throw genError;
              }
            });
            
            // Проверяем результат
            const finalMatches = await pool.query(
              'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
              [id]
            );
            const finalCount = parseInt(finalMatches.rows[0].count);
            console.log(`[🔵 MATCH GENERATION] ✅ GENERATION COMPLETE!`);
            console.log(`[🔵 MATCH GENERATION]   - Total matches created: ${finalCount}`);
            
            if (finalCount === 0) {
              console.warn(`[🔵 MATCH GENERATION] ⚠️  WARNING: Generation completed but 0 matches found!`);
              console.warn(`[🔵 MATCH GENERATION]   - Possible reasons:`);
              console.warn(`[🔵 MATCH GENERATION]     * Insufficient participants`);
              console.warn(`[🔵 MATCH GENERATION]     * Error in generation function`);
              console.warn(`[🔵 MATCH GENERATION]     * Transaction rollback occurred`);
            }
          } catch (matchGenError) {
            console.error(`[🔵 MATCH GENERATION] ❌ ERROR during match generation!`);
            console.error(`[🔵 MATCH GENERATION]   - Error type: ${matchGenError.constructor.name}`);
            console.error(`[🔵 MATCH GENERATION]   - Error message: ${matchGenError.message}`);
            console.error(`[🔵 MATCH GENERATION]   - Stack:`, matchGenError.stack);
            // Не прерываем обновление турнира, просто логируем ошибку
          }
        } else {
          await client.query('COMMIT');
          client.release();
          console.log(`[🔵 MATCH GENERATION] ⏭️  Skipping: Tournament already has ${existingCount} matches`);
        }
        
        console.log(`[🔵 MATCH GENERATION] ==========================================\n`);
      } else if (status === 'ongoing') {
        // Если статус уже ongoing или меняется не с upcoming, НЕ генерируем матчи
        await client.query('COMMIT');
        client.release();
        console.log(`[🔵 MATCH GENERATION] ⏭️  SKIPPED: Invalid status transition`);
        console.log(`[🔵 MATCH GENERATION]   - Old status: ${oldStatus}`);
        console.log(`[🔵 MATCH GENERATION]   - New status: ${status}`);
        console.log(`[🔵 MATCH GENERATION]   - Current status: ${currentStatus}`);
        console.log(`[🔵 MATCH GENERATION]   - Reason: Can only generate matches when transitioning from 'upcoming'/'scheduled' to 'ongoing'`);
        console.log(`[🔵 MATCH GENERATION] ==========================================\n`);
      } else {
        // Если не меняем статус на ongoing, просто коммитим обновление
        await client.query('COMMIT');
        client.release();
        console.log(`[🔵 MATCH GENERATION] ⏭️  SKIPPED: Status change to '${status}' does not trigger match generation`);
        console.log(`[🔵 MATCH GENERATION]   - Old status: ${oldStatus}`);
        console.log(`[🔵 MATCH GENERATION]   - New status: ${status}`);
        console.log(`[🔵 MATCH GENERATION] ==========================================\n`);
    }

    res.json({
      tournament: result.rows[0],
      message: 'Tournament updated successfully'
    });

  } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        // Игнорируем ошибку отката
      }
      try {
        client.release();
      } catch (releaseError) {
        // Игнорируем ошибку освобождения
      }
      console.error('❌ Error updating tournament:', error);
      res.status(500).json({ error: 'Failed to update tournament' });
    }
  } catch (outerError) {
    console.error('❌ Outer error updating tournament:', outerError);
    res.status(500).json({ error: 'Failed to update tournament' });
  }
});

// Глобальная карта для отслеживания активных генераций матчей (защита от параллельных вызовов)
const matchGenerationInProgress = new Map();

// Функция для использования advisory lock PostgreSQL (защита на уровне БД)
async function withAdvisoryLock(tournamentId, fn) {
  const lockKey = tournamentId; // Используем ID турнира как ключ блокировки
  const client = await pool.connect();
  try {
    // Пытаемся получить advisory lock (неблокирующий)
    const lockResult = await client.query('SELECT pg_try_advisory_xact_lock($1)', [lockKey]);
    if (!lockResult.rows[0].pg_try_advisory_xact_lock) {
      console.log(`[🔒 ADVISORY LOCK] Tournament ${tournamentId} is locked, skipping`);
      return; // Другой процесс уже обрабатывает этот турнир
    }
    
    // Выполняем функцию внутри транзакции с блокировкой
    await client.query('BEGIN');
    await fn(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Helper function to create single elimination matches
// Создает только матчи первого раунда (Semifinals для 4 игроков, Quarterfinals для 8 и т.д.)
async function createSingleEliminationMatches(tournamentId) {
  // Защита от параллельных вызовов
  if (matchGenerationInProgress.has(tournamentId)) {
    console.log(`[🔴 SINGLE-ELIMINATION] Generation already in progress for tournament ${tournamentId}, skipping`);
    return;
  }
  
  matchGenerationInProgress.set(tournamentId, true);
  const startTime = Date.now();
  console.log(`\n[🔴 SINGLE-ELIMINATION] ========================================`);
  console.log(`[🔴 SINGLE-ELIMINATION] Starting match generation`);
  console.log(`[🔴 SINGLE-ELIMINATION] Tournament ID: ${tournamentId}`);
  console.log(`[🔴 SINGLE-ELIMINATION] Format: Single Elimination`);
  
  // Используем advisory lock сразу для полной блокировки
  const lockClient = await pool.connect();
  try {
    // Пытаемся получить advisory lock
    const lockResult = await lockClient.query('SELECT pg_try_advisory_xact_lock($1)', [tournamentId]);
    if (!lockResult.rows[0].pg_try_advisory_xact_lock) {
      console.log(`[🔴 SINGLE-ELIMINATION] 🔒 Tournament ${tournamentId} is locked by another process, skipping`);
      matchGenerationInProgress.delete(tournamentId);
      return;
    }
    
    // ВАЖНО: Мы не проверяем наличие существующих матчей здесь,
    // так как они уже удалены в функции withAdvisoryLock перед вызовом createSingleEliminationMatches
    // Если матчи не были удалены, это ошибка, и мы должны создать новые матчи
    
    // Проверяем наличие существующих матчей для логирования
    const existingMatchesCheck = await lockClient.query(
      'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
    [tournamentId]
  );
  
    const existingCount = parseInt(existingMatchesCheck.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`[🔴 SINGLE-ELIMINATION] ⚠️  WARNING: Tournament ${tournamentId} has ${existingCount} existing matches`);
      console.log(`[🔴 SINGLE-ELIMINATION]   - These should have been deleted before calling this function`);
      console.log(`[🔴 SINGLE-ELIMINATION]   - Continuing anyway (matches will be created)`);
    } else {
      console.log(`[🔴 SINGLE-ELIMINATION] ✅ No existing matches found (${existingCount})`);
    }
    
    lockClient.release(); // Освобождаем клиент перед созданием матчей
  
  // Get participants
  const participants = await pool.query(`
    SELECT tp.player_id, p.username, p.full_name, p.rating
    FROM tournament_participants tp
    JOIN players p ON tp.player_id = p.id
    WHERE tp.tournament_id = $1
    ORDER BY p.rating DESC
  `, [tournamentId]);
  
  const players = participants.rows;
  console.log(`[🔴 SINGLE-ELIMINATION] Participants loaded: ${players.length}`);
  
  if (players.length < 2) {
    console.error(`[🔴 SINGLE-ELIMINATION] ❌ ERROR: Not enough players!`);
    console.error(`[🔴 SINGLE-ELIMINATION]   - Required: 2+`);
    console.error(`[🔴 SINGLE-ELIMINATION]   - Found: ${players.length}`);
    console.error(`[🔴 SINGLE-ELIMINATION]   - Action: Aborting match generation`);
    console.log(`[🔴 SINGLE-ELIMINATION] ========================================\n`);
    matchGenerationInProgress.delete(tournamentId);
    return;
  }
  
  console.log(`[🔴 SINGLE-ELIMINATION] ✅ Sufficient participants (${players.length})`);
  
  // Определяем структуру турнира с учетом byes
  // Для количества игроков меньше степени двойки создаем сетку как для ближайшей большей степени
  let rounds = [];
  let playersWithBye = 0; // Количество игроков с bye (проходом)
  let bracketSize = 0; // Размер сетки (4, 8, 16, 32)
  
  if (players.length === 4) {
    rounds = [
      { name: 'Semifinals', count: 2 },
      { name: 'Final', count: 1 }
    ];
    bracketSize = 4;
    playersWithBye = 0;
  } else if (players.length <= 8) {
    // Для 5-8 игроков создаем сетку как для 8 (Quarterfinals)
    rounds = [
      { name: 'Quarterfinals', count: 4 },
      { name: 'Semifinals', count: 2 },
      { name: 'Final', count: 1 }
    ];
    bracketSize = 8;
    playersWithBye = 8 - players.length; // Игроки с высоким рейтингом получают bye
  } else if (players.length <= 16) {
    // Для 9-16 игроков создаем сетку как для 16
    rounds = [
      { name: 'Round of 16', count: 8 },
      { name: 'Quarterfinals', count: 4 },
      { name: 'Semifinals', count: 2 },
      { name: 'Final', count: 1 }
    ];
    bracketSize = 16;
    playersWithBye = 16 - players.length;
  } else if (players.length <= 32) {
    // Для 17-32 игроков создаем сетку как для 32
    rounds = [
      { name: 'Round of 32', count: 16 },
      { name: 'Round of 16', count: 8 },
      { name: 'Quarterfinals', count: 4 },
      { name: 'Semifinals', count: 2 },
      { name: 'Final', count: 1 }
    ];
    bracketSize = 32;
    playersWithBye = 32 - players.length;
  } else {
    // Для других количеств создаем только первый раунд без byes
    const firstRoundCount = Math.floor(players.length / 2);
    rounds = [{ name: 'First Round', count: firstRoundCount }];
    bracketSize = players.length;
    playersWithBye = 0;
  }
  
  console.log(`[🔴 SINGLE-ELIMINATION] Bracket Structure:`);
  console.log(`[🔴 SINGLE-ELIMINATION]   - Total players: ${players.length}`);
  console.log(`[🔴 SINGLE-ELIMINATION]   - Bracket size: ${bracketSize}`);
  console.log(`[🔴 SINGLE-ELIMINATION]   - Players with bye: ${playersWithBye}`);
  console.log(`[🔴 SINGLE-ELIMINATION]   - Rounds: ${rounds.map(r => r.name).join(' → ')}`);
  
  // Используем транзакцию для атомарности и защиту от дубликатов
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Повторная проверка внутри транзакции с блокировкой (защита от race condition)
    const doubleCheck = await client.query(`
      SELECT COUNT(*) FROM matches WHERE tournament_id = $1
    `, [tournamentId]);
    
    const existingCountInTx = parseInt(doubleCheck.rows[0].count);
    
    // КРИТИЧЕСКАЯ ЗАЩИТА: если матчей больше 0, удаляем их перед созданием новых
    if (existingCountInTx > 0) {
      console.log(`[🔴 SINGLE-ELIMINATION] ⚠️  Found ${existingCountInTx} existing matches`);
      console.log(`[🔴 SINGLE-ELIMINATION] 🗑️  Deleting old matches before creating new ones...`);
      
      // Удаляем старые матчи и их результаты
      const deletedScores = await client.query(
        'DELETE FROM match_scores WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = $1)',
        [tournamentId]
      );
      console.log(`[🔴 SINGLE-ELIMINATION]   ✅ Deleted ${deletedScores.rowCount} match scores`);
      
      const deletedMatches = await client.query(
        'DELETE FROM matches WHERE tournament_id = $1',
        [tournamentId]
      );
      console.log(`[🔴 SINGLE-ELIMINATION]   ✅ Deleted ${deletedMatches.rowCount} matches`);
      
      // Удаляем старые standings
      const deletedStandings = await client.query(
        'DELETE FROM tournament_standings WHERE tournament_id = $1',
        [tournamentId]
      );
      console.log(`[🔴 SINGLE-ELIMINATION]   ✅ Deleted ${deletedStandings.rowCount} tournament standings`);
      
      console.log(`[🔴 SINGLE-ELIMINATION] ✅ All old matches deleted successfully!`);
      
      // Проверяем, что матчи действительно удалены
      const verifyDeletion = await client.query(
        'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
        [tournamentId]
      );
      const remainingCount = parseInt(verifyDeletion.rows[0].count);
      if (remainingCount > 0) {
        console.error(`[🔴 SINGLE-ELIMINATION] ❌ ERROR: ${remainingCount} matches still exist after deletion!`);
      await client.query('ROLLBACK');
      client.release();
      matchGenerationInProgress.delete(tournamentId);
        throw new Error(`Cannot delete existing matches: ${remainingCount} matches still exist`);
      }
      console.log(`[🔴 SINGLE-ELIMINATION] ✅ Verified: All matches deleted (${remainingCount} remaining)`);
    }
    
    let totalCreated = 0;
    
    // Создаем матчи для первого раунда
    const firstRound = rounds[0];
    const playersInFirstRound = players.length - playersWithBye; // Игроки, которые играют в первом раунде
    const matchesWithPlayers = Math.floor(playersInFirstRound / 2); // Количество матчей с игроками
    const matchesWithBye = playersWithBye; // Количество матчей с bye (по одному игроку с bye на матч)
    
    console.log(`[🔴 SINGLE-ELIMINATION] ========================================`);
    console.log(`[🔴 SINGLE-ELIMINATION] 🚀 Creating ${firstRound.name} matches...`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Bracket size: ${bracketSize}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Total players: ${players.length}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Players with bye: ${playersWithBye}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Players in first round: ${playersInFirstRound}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Total matches needed: ${firstRound.count}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Matches with players (2 players each): ${matchesWithPlayers}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Matches with bye (1 player each): ${matchesWithBye}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Expected total: ${matchesWithPlayers + matchesWithBye} matches`);
    
    // Определяем игроков с bye (первые playersWithBye игроков с высоким рейтингом получают bye)
    const playersWithByeList = players.slice(0, playersWithBye);
    const playersInFirstRoundList = players.slice(playersWithBye);
    
    console.log(`[🔴 SINGLE-ELIMINATION] 📋 Player Distribution:`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Players with bye (${playersWithByeList.length}):`, 
      playersWithByeList.map((p, i) => `${i + 1}. ${p.full_name} (rating: ${p.rating})`).join(', ') || 'None');
    console.log(`[🔴 SINGLE-ELIMINATION]   - Players in ${firstRound.name} (${playersInFirstRoundList.length}):`, 
      playersInFirstRoundList.map((p, i) => `${i + 1}. ${p.full_name} (rating: ${p.rating})`).join(', '));
    
    // ВАЖНО: Проверяем что количество матчей правильное
    const expectedTotalMatches = matchesWithPlayers + matchesWithBye;
    if (expectedTotalMatches !== firstRound.count) {
      console.error(`[🔴 SINGLE-ELIMINATION] ❌ ERROR: Match count mismatch!`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - Expected total: ${expectedTotalMatches} (${matchesWithPlayers} with players + ${matchesWithBye} with bye)`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - First round count: ${firstRound.count}`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - Action: Using expected total (${expectedTotalMatches}) instead of firstRound.count`);
    }
    
    // Создаем матчи первого раунда
    // Все игроки должны быть в четвертьфиналах, но у некоторых нет соперников (bye)
    // Игроки с bye имеют player1_id, но player2_id = NULL
    // ВАЖНО: В каждом четвертьфинале должен быть минимум один игрок (нет пустых матчей NULL vs NULL)
    
    // Создаем список всех матчей для создания
    const allMatches = [];
    
    console.log(`[🔴 SINGLE-ELIMINATION] 🎯 Building match list...`);
    
    // Добавляем игроков с bye (они в четвертьфиналах, но без соперника)
    // Каждый игрок с bye создает отдельный матч
    for (let i = 0; i < playersWithByeList.length; i++) {
      allMatches.push({
        player1: playersWithByeList[i],
        player2: null, // Нет соперника (bye)
        isBye: true,
        matchNumber: i + 1
      });
      console.log(`[🔴 SINGLE-ELIMINATION]   - Added bye match ${i + 1}: ${playersWithByeList[i].full_name} vs BYE`);
    }
    
    // Добавляем игроков без bye (они играют друг с другом)
    // Для 6 игроков: 4 игрока без bye, они создадут 2 матча
    let playerMatchIndex = 0;
    for (let i = 0; i < playersInFirstRoundList.length; i += 2) {
      if (i + 1 < playersInFirstRoundList.length) {
        allMatches.push({
          player1: playersInFirstRoundList[i],
          player2: playersInFirstRoundList[i + 1],
          isBye: false,
          matchNumber: matchesWithBye + playerMatchIndex + 1
        });
        console.log(`[🔴 SINGLE-ELIMINATION]   - Added player match ${playerMatchIndex + 1}: ${playersInFirstRoundList[i].full_name} vs ${playersInFirstRoundList[i + 1].full_name}`);
        playerMatchIndex++;
      }
    }
    
    console.log(`[🔴 SINGLE-ELIMINATION] ✅ Match list built: ${allMatches.length} matches total`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Bye matches: ${allMatches.filter(m => m.isBye).length}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Player matches: ${allMatches.filter(m => !m.isBye).length}`);
    
    // Перемешиваем порядок матчей случайным образом
    console.log(`[🔴 SINGLE-ELIMINATION] 🔀 Shuffling match order...`);
    for (let i = allMatches.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allMatches[i], allMatches[j]] = [allMatches[j], allMatches[i]];
    }
    console.log(`[🔴 SINGLE-ELIMINATION] ✅ Match order shuffled`);
    
    // Создаем матчи в перемешанном порядке
    console.log(`[🔴 SINGLE-ELIMINATION] 🏓 Creating matches in database...`);
    let createdByeMatches = 0;
    let createdPlayerMatches = 0;
    
    console.log(`[🔴 SINGLE-ELIMINATION] 🔍 DEBUG: allMatches.length = ${allMatches.length}`);
    console.log(`[🔴 SINGLE-ELIMINATION] 🔍 DEBUG: allMatches =`, JSON.stringify(allMatches.map(m => ({
      player1: m.player1?.full_name || 'NULL',
      player2: m.player2?.full_name || 'NULL',
      isBye: m.isBye
    })), null, 2));
    
    for (let i = 0; i < allMatches.length; i++) {
      const match = allMatches[i];
      console.log(`[🔴 SINGLE-ELIMINATION] 🔍 Processing match ${i + 1}/${allMatches.length}:`, {
        isBye: match.isBye,
        player1: match.player1?.full_name || 'NULL',
        player2: match.player2?.full_name || 'NULL'
      });
      
      if (match.isBye) {
        // Матч с bye: один игрок, без соперника
        // АВТОМАТИЧЕСКИ завершаем матч с bye сразу при создании
        // Устанавливаем winner_id = player1_id и status = 'completed'
        // Это позволит игроку автоматически продвинуться в следующий раунд
        const result = await client.query(`
          INSERT INTO matches (tournament_id, player1_id, player2_id, round, status, winner_id)
          VALUES ($1, $2, NULL, $3, 'completed', $2)
          RETURNING id
        `, [tournamentId, match.player1.player_id, firstRound.name]);
        
        const matchId = result.rows[0].id;
        totalCreated++;
        createdByeMatches++;
        console.log(`[🔴 SINGLE-ELIMINATION]   ✅ Created match ${totalCreated} (ID: ${matchId}, bye): ${match.player1.full_name} vs BYE`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Tournament ID: ${tournamentId}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Match ID: ${matchId}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Player1 ID: ${match.player1.player_id}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Player2 ID: NULL (bye)`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Winner ID: ${match.player1.player_id} (automatic)`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Status: completed (automatic)`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Round: ${firstRound.name}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - ⚠️  Bye match automatically completed - player will advance to next round`);
      } else {
        // Обычный матч: два игрока
        const result = await client.query(`
        INSERT INTO matches (tournament_id, player1_id, player2_id, round, status)
        VALUES ($1, $2, $3, $4, 'scheduled')
          RETURNING id
        `, [tournamentId, match.player1.player_id, match.player2.player_id, firstRound.name]);
        
        const matchId = result.rows[0].id;
        totalCreated++;
        createdPlayerMatches++;
        console.log(`[🔴 SINGLE-ELIMINATION]   ✅ Created match ${totalCreated} (ID: ${matchId}, players): ${match.player1.full_name} vs ${match.player2.full_name}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Tournament ID: ${tournamentId}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Match ID: ${matchId}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Player1 ID: ${match.player1.player_id}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Player2 ID: ${match.player2.player_id}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Status: scheduled`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Round: ${firstRound.name}`);
      }
    }
    
    console.log(`[🔴 SINGLE-ELIMINATION] 🔍 DEBUG: After creating matches:`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - totalCreated: ${totalCreated}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - createdByeMatches: ${createdByeMatches}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - createdPlayerMatches: ${createdPlayerMatches}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - allMatches.length: ${allMatches.length}`);
    
    console.log(`[🔴 SINGLE-ELIMINATION] 📊 Match Creation Summary:`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Total created: ${totalCreated}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Bye matches: ${createdByeMatches}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Player matches: ${createdPlayerMatches}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Expected: ${allMatches.length}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - First round count: ${firstRound.count}`);
    
    // КРИТИЧЕСКАЯ ПРОВЕРКА: Должно быть создано ровно allMatches.length матчей
    if (totalCreated !== allMatches.length) {
      console.error(`[🔴 SINGLE-ELIMINATION] ❌ ERROR: Created ${totalCreated} matches, but expected ${allMatches.length}!`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - Matches with bye: ${matchesWithBye}`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - Matches with players: ${matchesWithPlayers}`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - Total expected: ${allMatches.length}`);
      throw new Error(`Mismatch: created ${totalCreated} matches, expected ${allMatches.length}`);
    }
    
    // Дополнительная проверка: должно быть создано ровно firstRound.count матчей
    if (totalCreated !== firstRound.count) {
      console.error(`[🔴 SINGLE-ELIMINATION] ❌ ERROR: Created ${totalCreated} matches, but firstRound.count is ${firstRound.count}!`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - This should not happen for bracket size ${bracketSize}`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - Expected: ${firstRound.count} matches (${firstRound.name})`);
      throw new Error(`Mismatch: created ${totalCreated} matches, but firstRound.count is ${firstRound.count}`);
    }
    
    console.log(`[🔴 SINGLE-ELIMINATION] ✅ All ${firstRound.count} matches created successfully!`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - All matches have at least one player (no empty matches)`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Players with bye remain in ${firstRound.name} only (not advanced to next round)`);
    
    // Создаем матчи для следующих раундов с пустыми слотами
    // КРИТИЧЕСКИ ВАЖНО: Игроки с bye НЕ продвигаются в полуфиналы при создании матчей!
    // Они остаются ТОЛЬКО в четвертьфиналах, где видны с BYE вместо соперника
    // Они попадут в полуфиналы автоматически только когда:
    // 1. Их матчи в четвертьфиналах будут завершены (winner_id установлен, status = 'completed')
    // 2. Функция advanceTournamentWinnerToNextRound продвинет их в полуфиналы
    // 3. Это произойдет когда пользователь завершит матч с bye (или система автоматически обработает его)
    
    console.log(`[🔴 SINGLE-ELIMINATION] ========================================`);
    console.log(`[🔴 SINGLE-ELIMINATION] 🚀 Creating matches for subsequent rounds...`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Players with bye (${playersWithByeList.length}) will NOT be advanced to next round`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - They remain in ${firstRound.name} only`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - They are visible in ${firstRound.name} with BYE instead of opponent`);
    
    for (let roundIndex = 1; roundIndex < rounds.length; roundIndex++) {
      const round = rounds[roundIndex];
      console.log(`[🔴 SINGLE-ELIMINATION]   - Creating ${round.count} matches for ${round.name}...`);
      
      for (let i = 0; i < round.count; i++) {
        await client.query(`
          INSERT INTO matches (tournament_id, player1_id, player2_id, round, status)
          VALUES ($1, NULL, NULL, $2, 'scheduled')
        `, [tournamentId, round.name]);
        
        totalCreated++;
      }
      
      console.log(`[🔴 SINGLE-ELIMINATION]   ✅ Created ${round.count} matches for ${round.name} (all empty - TBD vs TBD)`);
    }
    
    const quarterfinalMatchesCount = allMatches.length;
    const subsequentMatchesCount = totalCreated - allMatches.length;
    
    console.log(`[🔴 SINGLE-ELIMINATION] ========================================`);
    console.log(`[🔴 SINGLE-ELIMINATION] ✅ Match creation complete!`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - ${firstRound.name}: ${quarterfinalMatchesCount} matches`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - All subsequent rounds: ${subsequentMatchesCount} matches`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Total matches created: ${totalCreated}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Players with bye remain in ${firstRound.name} only`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - They will NOT advance to next round automatically`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - They will advance only when their matches are completed`);
    console.log(`[🔴 SINGLE-ELIMINATION] ========================================`);
    
    // Финальная проверка количества перед коммитом
    const finalCheck = await client.query(
      'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
      [tournamentId]
    );
    const finalCount = parseInt(finalCheck.rows[0].count);
    
    console.log(`[🔴 SINGLE-ELIMINATION] ✅ Successfully created ${totalCreated} matches (final count: ${finalCount})`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - First round (${firstRound.name}): ${firstRound.count} matches`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Subsequent rounds: ${totalCreated - firstRound.count} matches`);
    
    await client.query('COMMIT');
    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
      }
      console.error(`[🔴 SINGLE-ELIMINATION] ❌ Error creating matches:`, error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
      matchGenerationInProgress.delete(tournamentId);
    }
  } catch (outerError) {
    console.error(`[🔴 SINGLE-ELIMINATION] ❌ Outer error:`, outerError);
    matchGenerationInProgress.delete(tournamentId);
    throw outerError;
  }
}

// Helper function to create single elimination matches using provided client (for use inside withAdvisoryLock)
async function createSingleEliminationMatchesWithClient(tournamentId, client) {
  console.log(`\n[🔴 SINGLE-ELIMINATION] ========================================`);
  console.log(`[🔴 SINGLE-ELIMINATION] Starting match generation with provided client`);
  console.log(`[🔴 SINGLE-ELIMINATION] Tournament ID: ${tournamentId}`);
  
  try {
    // Get participants
    const participants = await client.query(`
      SELECT tp.player_id, p.username, p.full_name, p.rating
      FROM tournament_participants tp
      JOIN players p ON tp.player_id = p.id
      WHERE tp.tournament_id = $1
      ORDER BY p.rating DESC
    `, [tournamentId]);
    
    const players = participants.rows;
    console.log(`[🔴 SINGLE-ELIMINATION] Participants loaded: ${players.length}`);
    
    if (players.length < 2) {
      console.error(`[🔴 SINGLE-ELIMINATION] ❌ ERROR: Not enough players!`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - Required: 2+`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - Found: ${players.length}`);
      return;
    }
    
    // Определяем структуру турнира и создаем все раунды
    // Для количества игроков меньше степени двойки создаем сетку как для ближайшей большей степени
    let rounds = [];
    let playersWithBye = 0; // Количество игроков с bye (проходом)
    let actualFirstRoundPlayers = players.length; // Количество игроков в первом раунде
    
    if (players.length === 3) {
      // Для 3 участников: 1 bye + 2 игрока = 2 матча Semifinals
      rounds = [
        { name: 'Semifinals', count: 2 },
        { name: 'Final', count: 1 }
      ];
      actualFirstRoundPlayers = 4; // Создаем сетку для 4 игроков (2 матча)
      playersWithBye = 4 - players.length; // 1 игрок с bye
    } else if (players.length === 4) {
      rounds = [
        { name: 'Semifinals', count: 2 },
        { name: 'Final', count: 1 }
      ];
      actualFirstRoundPlayers = 4;
    } else if (players.length <= 8) {
      // Для 5-8 игроков создаем сетку как для 8 (Quarterfinals)
      rounds = [
        { name: 'Quarterfinals', count: 4 },
        { name: 'Semifinals', count: 2 },
        { name: 'Final', count: 1 }
      ];
      actualFirstRoundPlayers = 8; // Создаем сетку для 8 игроков
      playersWithBye = 8 - players.length; // Игроки с высоким рейтингом получают bye
    } else if (players.length <= 16) {
      // Для 9-16 игроков создаем сетку как для 16
      rounds = [
        { name: 'Round of 16', count: 8 },
        { name: 'Quarterfinals', count: 4 },
        { name: 'Semifinals', count: 2 },
        { name: 'Final', count: 1 }
      ];
      actualFirstRoundPlayers = 16;
      playersWithBye = 16 - players.length;
    } else if (players.length <= 32) {
      // Для 17-32 игроков создаем сетку как для 32
      rounds = [
        { name: 'Round of 32', count: 16 },
        { name: 'Round of 16', count: 8 },
        { name: 'Quarterfinals', count: 4 },
        { name: 'Semifinals', count: 2 },
        { name: 'Final', count: 1 }
      ];
      actualFirstRoundPlayers = 32;
      playersWithBye = 32 - players.length;
    } else {
      // Для других количеств создаем только первый раунд
      const firstRoundCount = Math.floor(players.length / 2);
      rounds = [{ name: 'First Round', count: firstRoundCount }];
      actualFirstRoundPlayers = players.length;
    }
    
    let totalCreated = 0;
    
    // Создаем матчи для первого раунда
    const firstRound = rounds[0];
    const playersInFirstRound = players.length - playersWithBye; // Игроки, которые играют в первом раунде
    const matchesWithPlayers = Math.floor(playersInFirstRound / 2); // Количество матчей с игроками
    const matchesWithBye = playersWithBye; // Количество матчей с bye (по одному игроку с bye на матч)
    
    console.log(`[🔴 SINGLE-ELIMINATION] ========================================`);
    console.log(`[🔴 SINGLE-ELIMINATION] 🚀 Creating ${firstRound.name} matches...`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Bracket size: ${actualFirstRoundPlayers}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Total players: ${players.length}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Players with bye: ${playersWithBye}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Players in first round: ${playersInFirstRound}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Total matches needed: ${firstRound.count}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Matches with players (2 players each): ${matchesWithPlayers}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Matches with bye (1 player each): ${matchesWithBye}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Expected total: ${matchesWithPlayers + matchesWithBye} matches`);
    
    // Определяем игроков с bye (первые playersWithBye игроков с высоким рейтингом получают bye)
    const playersWithByeList = players.slice(0, playersWithBye);
    const playersInFirstRoundList = players.slice(playersWithBye);
    
    console.log(`[🔴 SINGLE-ELIMINATION] 📋 Player Distribution:`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Players with bye (${playersWithByeList.length}):`, 
      playersWithByeList.map((p, i) => `${i + 1}. ${p.full_name} (rating: ${p.rating})`).join(', ') || 'None');
    console.log(`[🔴 SINGLE-ELIMINATION]   - Players in ${firstRound.name} (${playersInFirstRoundList.length}):`, 
      playersInFirstRoundList.map((p, i) => `${i + 1}. ${p.full_name} (rating: ${p.rating})`).join(', '));
    
    // ВАЖНО: Проверяем что количество матчей правильное
    const expectedTotalMatches = matchesWithPlayers + matchesWithBye;
    if (expectedTotalMatches !== firstRound.count) {
      console.error(`[🔴 SINGLE-ELIMINATION] ❌ ERROR: Match count mismatch!`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - Expected total: ${expectedTotalMatches} (${matchesWithPlayers} with players + ${matchesWithBye} with bye)`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - First round count: ${firstRound.count}`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - Action: Using expected total (${expectedTotalMatches}) instead of firstRound.count`);
    }
    
    // Создаем матчи первого раунда
    // Все игроки должны быть в четвертьфиналах, но у некоторых нет соперников (bye)
    // Игроки с bye имеют player1_id, но player2_id = NULL
    // ВАЖНО: В каждом четвертьфинале должен быть минимум один игрок (нет пустых матчей NULL vs NULL)
    
    // Создаем список всех матчей для создания
    const allMatches = [];
    
    console.log(`[🔴 SINGLE-ELIMINATION] 🎯 Building match list...`);
    
    // Добавляем игроков с bye (они в четвертьфиналах, но без соперника)
    // Каждый игрок с bye создает отдельный матч
    for (let i = 0; i < playersWithByeList.length; i++) {
      allMatches.push({
        player1: playersWithByeList[i],
        player2: null, // Нет соперника (bye)
        isBye: true,
        matchNumber: i + 1
      });
      console.log(`[🔴 SINGLE-ELIMINATION]   - Added bye match ${i + 1}: ${playersWithByeList[i].full_name} vs BYE`);
    }
    
    // Добавляем игроков без bye (они играют друг с другом)
    // Для 6 игроков: 4 игрока без bye, они создадут 2 матча
    let playerMatchIndex = 0;
    for (let i = 0; i < playersInFirstRoundList.length; i += 2) {
      if (i + 1 < playersInFirstRoundList.length) {
        allMatches.push({
          player1: playersInFirstRoundList[i],
          player2: playersInFirstRoundList[i + 1],
          isBye: false,
          matchNumber: matchesWithBye + playerMatchIndex + 1
        });
        console.log(`[🔴 SINGLE-ELIMINATION]   - Added player match ${playerMatchIndex + 1}: ${playersInFirstRoundList[i].full_name} vs ${playersInFirstRoundList[i + 1].full_name}`);
        playerMatchIndex++;
      }
    }
    
    console.log(`[🔴 SINGLE-ELIMINATION] ✅ Match list built: ${allMatches.length} matches total`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Bye matches: ${allMatches.filter(m => m.isBye).length}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Player matches: ${allMatches.filter(m => !m.isBye).length}`);
    
    // Перемешиваем порядок матчей случайным образом
    console.log(`[🔴 SINGLE-ELIMINATION] 🔀 Shuffling match order...`);
    for (let i = allMatches.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allMatches[i], allMatches[j]] = [allMatches[j], allMatches[i]];
    }
    console.log(`[🔴 SINGLE-ELIMINATION] ✅ Match order shuffled`);
    
    // Создаем матчи в перемешанном порядке
    console.log(`[🔴 SINGLE-ELIMINATION] 🏓 Creating matches in database...`);
    let createdByeMatches = 0;
    let createdPlayerMatches = 0;
    
    console.log(`[🔴 SINGLE-ELIMINATION] 🔍 DEBUG: allMatches.length = ${allMatches.length}`);
    console.log(`[🔴 SINGLE-ELIMINATION] 🔍 DEBUG: allMatches =`, JSON.stringify(allMatches.map(m => ({
      player1: m.player1?.full_name || 'NULL',
      player2: m.player2?.full_name || 'NULL',
      isBye: m.isBye
    })), null, 2));
    
    for (let i = 0; i < allMatches.length; i++) {
      const match = allMatches[i];
      console.log(`[🔴 SINGLE-ELIMINATION] 🔍 Processing match ${i + 1}/${allMatches.length}:`, {
        isBye: match.isBye,
        player1: match.player1?.full_name || 'NULL',
        player2: match.player2?.full_name || 'NULL'
      });
      
      if (match.isBye) {
        // Матч с bye: один игрок, без соперника
        // Автоматически завершаем bye-матч сразу после создания
        // Получаем формат матча турнира
        const tournamentInfo = await client.query(
          'SELECT match_format FROM tournaments WHERE id = $1',
          [tournamentId]
        );
        const matchFormat = tournamentInfo.rows[0]?.match_format || 'best-of-5';
        
        // Определяем количество сетов для победы
        const maxSets = matchFormat === 'best-of-1' ? 1 : matchFormat === 'best-of-3' ? 3 : 5;
        const setsToWin = Math.ceil(maxSets / 2);
        
        // Создаем матч с автоматическим завершением
        const result = await client.query(`
          INSERT INTO matches (tournament_id, player1_id, player2_id, round, status, winner_id)
          VALUES ($1, $2, NULL, $3, 'completed', $2)
          RETURNING id
        `, [tournamentId, match.player1.player_id, firstRound.name]);
        
        const matchId = result.rows[0].id;
        totalCreated++;
        createdByeMatches++;
        
        // Создаем счет для bye-матча (игрок выигрывает все необходимые сеты 11-0)
        const player1Scores = Array(setsToWin).fill(11);
        const player2Scores = Array(setsToWin).fill(0);
        
        await client.query(`
          INSERT INTO match_scores (match_id, player1_scores, player2_scores)
          VALUES ($1, $2, $3)
        `, [matchId, player1Scores, player2Scores]);
        
        console.log(`[🔴 SINGLE-ELIMINATION]   ✅ Created and completed match ${totalCreated} (ID: ${matchId}, bye): ${match.player1.full_name} vs BYE`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Tournament ID: ${tournamentId}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Match ID: ${matchId}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Player1 ID: ${match.player1.player_id}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Player2 ID: NULL (bye)`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Status: completed (auto-completed)`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Winner ID: ${match.player1.player_id}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Round: ${firstRound.name}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Score: ${player1Scores.map((s, i) => `${s}-${player2Scores[i]}`).join(', ')}`);
          } else {
        // Обычный матч: два игрока
        const result = await client.query(`
            INSERT INTO matches (tournament_id, player1_id, player2_id, round, status)
            VALUES ($1, $2, $3, $4, 'scheduled')
          RETURNING id
        `, [tournamentId, match.player1.player_id, match.player2.player_id, firstRound.name]);
        
        const matchId = result.rows[0].id;
          totalCreated++;
        createdPlayerMatches++;
        console.log(`[🔴 SINGLE-ELIMINATION]   ✅ Created match ${totalCreated} (ID: ${matchId}, players): ${match.player1.full_name} vs ${match.player2.full_name}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Tournament ID: ${tournamentId}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Match ID: ${matchId}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Player1 ID: ${match.player1.player_id}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Player2 ID: ${match.player2.player_id}`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Status: scheduled`);
        console.log(`[🔴 SINGLE-ELIMINATION]      - Round: ${firstRound.name}`);
      }
    }
    
    console.log(`[🔴 SINGLE-ELIMINATION] 🔍 DEBUG: After creating matches:`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - totalCreated: ${totalCreated}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - createdByeMatches: ${createdByeMatches}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - createdPlayerMatches: ${createdPlayerMatches}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - allMatches.length: ${allMatches.length}`);
    
    console.log(`[🔴 SINGLE-ELIMINATION] 📊 Match Creation Summary:`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Total created: ${totalCreated}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Bye matches: ${createdByeMatches}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Player matches: ${createdPlayerMatches}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Expected: ${allMatches.length}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - First round count: ${firstRound.count}`);
    
    // КРИТИЧЕСКАЯ ПРОВЕРКА: Должно быть создано ровно allMatches.length матчей
    if (totalCreated !== allMatches.length) {
      console.error(`[🔴 SINGLE-ELIMINATION] ❌ ERROR: Created ${totalCreated} matches, but expected ${allMatches.length}!`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - Matches with bye: ${matchesWithBye}`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - Matches with players: ${matchesWithPlayers}`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - Total expected: ${allMatches.length}`);
      throw new Error(`Mismatch: created ${totalCreated} matches, expected ${allMatches.length}`);
    }
    
    // Дополнительная проверка: должно быть создано ровно firstRound.count матчей
    if (totalCreated !== firstRound.count) {
      console.error(`[🔴 SINGLE-ELIMINATION] ❌ ERROR: Created ${totalCreated} matches, but firstRound.count is ${firstRound.count}!`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - This should not happen for bracket size ${actualFirstRoundPlayers}`);
      console.error(`[🔴 SINGLE-ELIMINATION]   - Expected: ${firstRound.count} matches (${firstRound.name})`);
      throw new Error(`Mismatch: created ${totalCreated} matches, but firstRound.count is ${firstRound.count}`);
    }
    
    console.log(`[🔴 SINGLE-ELIMINATION] ✅ All ${firstRound.count} matches created successfully!`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - All matches have at least one player (no empty matches)`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Bye matches (${createdByeMatches}) are automatically completed`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Players with bye will be automatically advanced to next round`);
    
    // Сначала создаем матчи для следующих раундов с пустыми слотами
    console.log(`[🔴 SINGLE-ELIMINATION] ========================================`);
    console.log(`[🔴 SINGLE-ELIMINATION] 🚀 Creating matches for subsequent rounds...`);
    
    for (let roundIndex = 1; roundIndex < rounds.length; roundIndex++) {
      const round = rounds[roundIndex];
      console.log(`[🔴 SINGLE-ELIMINATION]   - Creating ${round.count} matches for ${round.name}...`);
      
      for (let i = 0; i < round.count; i++) {
          await client.query(`
            INSERT INTO matches (tournament_id, player1_id, player2_id, round, status)
            VALUES ($1, NULL, NULL, $2, 'scheduled')
          `, [tournamentId, round.name]);
        
          totalCreated++;
      }
      
      console.log(`[🔴 SINGLE-ELIMINATION]   ✅ Created ${round.count} matches for ${round.name} (all empty - TBD vs TBD)`);
    }
    
    // Теперь автоматически продвигаем игроков с bye в следующий раунд
    // (матчи уже завершены при создании, так что они должны быть найдены)
    console.log(`[🔴 SINGLE-ELIMINATION] ========================================`);
    console.log(`[🔴 SINGLE-ELIMINATION] 🚀 Automatically advancing players with bye to next round...`);
    
    // Получаем все завершенные матчи с bye для продвижения
    // Теперь они уже должны быть завершены (status = 'completed', winner_id установлен)
    const byeMatches = await client.query(`
      SELECT id, player1_id, round, winner_id, status
      FROM matches 
            WHERE tournament_id = $1 
              AND round = $2
              AND player2_id IS NULL
        AND player1_id IS NOT NULL
        AND status = 'completed'
        AND winner_id IS NOT NULL
            ORDER BY id
    `, [tournamentId, firstRound.name]);
    
    console.log(`[🔴 SINGLE-ELIMINATION]   - Found ${byeMatches.rows.length} completed bye matches to advance`);
    
    // Определяем следующий раунд
    const roundProgression = {
      'Round of 32': 'Round of 16',
      'Round of 16': 'Quarterfinals',
      'Quarterfinals': 'Semifinals',
      'Semifinals': 'Final',
      'First Round': 'Semifinals'
    };
    
    const nextRound = roundProgression[firstRound.name];
    
    if (nextRound && byeMatches.rows.length > 0) {
      // Получаем все матчи текущего раунда для определения позиции
      const currentMatches = await client.query(`
        SELECT id FROM matches 
        WHERE tournament_id = $1 AND round = $2
        ORDER BY id ASC
      `, [tournamentId, firstRound.name]);
      
      // Получаем матчи следующего раунда
      const nextMatches = await client.query(`
        SELECT id, player1_id, player2_id FROM matches 
        WHERE tournament_id = $1 AND round = $2
        ORDER BY id ASC
      `, [tournamentId, nextRound]);
      
      console.log(`[🔴 SINGLE-ELIMINATION]   - Next round: ${nextRound}`);
      console.log(`[🔴 SINGLE-ELIMINATION]   - Next round matches: ${nextMatches.rows.length}`);
      
      // Продвигаем каждого игрока с bye в следующий раунд
      for (const byeMatch of byeMatches.rows) {
        const winnerId = byeMatch.winner_id;
        const matchId = byeMatch.id;
        
        // Определяем индекс матча в текущем раунде
        const matchIndex = currentMatches.rows.findIndex(m => m.id === matchId);
        if (matchIndex === -1) {
          console.log(`[🔴 SINGLE-ELIMINATION]   - ❌ Match ${matchId} not found in ${firstRound.name}`);
          continue;
        }
        
        // Определяем целевую позицию в следующем раунде
        let targetMatchIndex, targetSlot;
        if (firstRound.name === 'Quarterfinals') {
          targetMatchIndex = Math.floor(matchIndex / 2);
          targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
        } else if (firstRound.name === 'Semifinals') {
          targetMatchIndex = 0;
          targetSlot = matchIndex === 0 ? 'player1' : 'player2';
        } else if (firstRound.name === 'Round of 16') {
          targetMatchIndex = Math.floor(matchIndex / 2);
          targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
        } else if (firstRound.name === 'Round of 32') {
          targetMatchIndex = Math.floor(matchIndex / 2);
          targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
        } else if (firstRound.name === 'First Round') {
          targetMatchIndex = 0;
          targetSlot = matchIndex === 0 ? 'player1' : 'player2';
        } else {
          console.log(`[🔴 SINGLE-ELIMINATION]   - ❌ Unknown round: ${firstRound.name}`);
          continue;
        }
        
        if (targetMatchIndex >= nextMatches.rows.length) {
          console.log(`[🔴 SINGLE-ELIMINATION]   - ❌ Target match index ${targetMatchIndex} >= ${nextMatches.rows.length}`);
          continue;
        }
        
        const targetMatch = nextMatches.rows[targetMatchIndex];
        const updateField = targetSlot === 'player1' ? 'player1_id' : 'player2_id';
        
        // Получаем имя игрока для логов
        const playerInfo = await client.query('SELECT full_name FROM players WHERE id = $1', [winnerId]);
        const playerName = playerInfo.rows[0]?.full_name || `Player ${winnerId}`;
        
        // Обновляем матч следующего раунда
        await client.query(`
          UPDATE matches 
          SET ${updateField} = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [winnerId, targetMatch.id]);
        
        console.log(`[🔴 SINGLE-ELIMINATION]   - ✅ Advanced ${playerName} (ID: ${winnerId}) to ${nextRound} match ${targetMatchIndex} (${targetSlot})`);
      }
      
      console.log(`[🔴 SINGLE-ELIMINATION]   - ✅ All ${byeMatches.rows.length} bye matches advanced to ${nextRound}`);
    } else {
      console.log(`[🔴 SINGLE-ELIMINATION]   - ⚠️  No next round or no bye matches to advance`);
    }
    
    const quarterfinalMatchesCount = allMatches.length;
    const subsequentMatchesCount = totalCreated - allMatches.length;
    
    console.log(`[🔴 SINGLE-ELIMINATION] ========================================`);
    console.log(`[🔴 SINGLE-ELIMINATION] ✅ Match creation complete!`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - ${firstRound.name}: ${quarterfinalMatchesCount} matches`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - All subsequent rounds: ${subsequentMatchesCount} matches`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Total matches created: ${totalCreated}`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Players with bye (${createdByeMatches}) automatically advanced to next round`);
    console.log(`[🔴 SINGLE-ELIMINATION] ========================================`);
    
    // Финальная проверка количества перед завершением функции
    const finalCheck = await client.query(
      'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
      [tournamentId]
    );
    const finalCount = parseInt(finalCheck.rows[0].count);
    
    console.log(`[🔴 SINGLE-ELIMINATION] ✅ Successfully created ${totalCreated} matches (final count: ${finalCount})`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - First round (${firstRound.name}): ${quarterfinalMatchesCount} matches`);
    console.log(`[🔴 SINGLE-ELIMINATION]   - Subsequent rounds: ${subsequentMatchesCount} matches`);
    console.log(`[🔴 SINGLE-ELIMINATION] ========================================\n`);
  } catch (error) {
    console.error(`[🔴 SINGLE-ELIMINATION] ❌ Error:`, error);
    console.error(`[🔴 SINGLE-ELIMINATION] ❌ Error stack:`, error.stack);
    throw error;
  }
}

// Helper function to create round-robin matches using provided client
async function createRoundRobinMatchesWithClient(tournamentId, client) {
  console.log(`\n[🟢 ROUND-ROBIN] ========================================`);
  console.log(`[🟢 ROUND-ROBIN] Starting match generation with provided client`);
  console.log(`[🟢 ROUND-ROBIN] Tournament ID: ${tournamentId}`);
  
  try {
    // Get participants using the provided client
    const participants = await client.query(`
      SELECT tp.player_id, p.username, p.full_name, p.rating
      FROM tournament_participants tp
      JOIN players p ON tp.player_id = p.id
      WHERE tp.tournament_id = $1
      ORDER BY p.rating DESC
    `, [tournamentId]);
    
    const players = participants.rows;
    console.log(`[🟢 ROUND-ROBIN] Found ${players.length} participants`);
    
    if (players.length < 2) {
      console.log(`[🟢 ROUND-ROBIN] Not enough players (${players.length}) to create matches`);
      throw new Error(`Not enough players: ${players.length}`);
    }
    
    // Для round-robin: n*(n-1)/2 матчей для n игроков
    const expectedMatches = (players.length * (players.length - 1)) / 2;
    console.log(`[🟢 ROUND-ROBIN] Expected matches: ${expectedMatches} (formula: ${players.length} * ${players.length - 1} / 2)`);
    
    let createdCount = 0;
    const maxMatches = expectedMatches;
    
    console.log(`[🟢 ROUND-ROBIN] Creating matches (max: ${maxMatches})...`);
    
    // Create all possible match combinations
    for (let i = 0; i < players.length && createdCount < maxMatches; i++) {
      for (let j = i + 1; j < players.length && createdCount < maxMatches; j++) {
        const existingMatch = await client.query(`
          SELECT id FROM matches 
          WHERE tournament_id = $1 
            AND ((player1_id = $2 AND player2_id = $3) OR (player1_id = $3 AND player2_id = $2))
            AND round = $4
        `, [tournamentId, players[i].player_id, players[j].player_id, 'Round Robin']);
        
        if (existingMatch.rows.length === 0) {
          await client.query(`
            INSERT INTO matches (tournament_id, player1_id, player2_id, round, status)
            VALUES ($1, $2, $3, $4, 'scheduled')
          `, [tournamentId, players[i].player_id, players[j].player_id, 'Round Robin']);
          createdCount++;
          
          if (createdCount > expectedMatches) {
            console.error(`[🟢 ROUND-ROBIN] ERROR: Created more matches than expected!`);
            throw new Error(`Attempted to create too many matches: ${createdCount} > ${expectedMatches}`);
          }
        }
      }
    }
    
    // Финальная проверка
    const finalCheck = await client.query(
      'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
      [tournamentId]
    );
    const finalCount = parseInt(finalCheck.rows[0].count);
    
    console.log(`[🟢 ROUND-ROBIN] ✅ Successfully created ${createdCount} matches (final count: ${finalCount}, expected: ${expectedMatches})`);
    console.log(`[🟢 ROUND-ROBIN] ========================================\n`);
  } catch (error) {
    console.error(`[🟢 ROUND-ROBIN] ❌ Error:`, error);
    console.error(`[🟢 ROUND-ROBIN] ❌ Error stack:`, error.stack);
    throw error;
  }
}

// Helper function to create group-stage matches using provided client
async function createGroupStageMatchesWithClient(tournamentId, client) {
  console.log(`\n[🟡 GROUP-STAGE] ========================================`);
  console.log(`[🟡 GROUP-STAGE] Starting match generation with provided client`);
  console.log(`[🟡 GROUP-STAGE] Tournament ID: ${tournamentId}`);
  
  try {
    // Get tournament settings
    const tournamentResult = await client.query(`
      SELECT num_groups, players_per_group_advance, max_participants
      FROM tournaments
      WHERE id = $1
    `, [tournamentId]);
    
    if (tournamentResult.rows.length === 0) {
      console.log(`[🟡 GROUP-STAGE] Tournament ${tournamentId} not found`);
      throw new Error(`Tournament ${tournamentId} not found`);
    }
    
    const tournament = tournamentResult.rows[0];
    const numGroups = tournament.num_groups;
    const playersPerGroupAdvance = tournament.players_per_group_advance;
    
    if (!numGroups || numGroups < 2) {
      console.log(`[🟡 GROUP-STAGE] Invalid num_groups (${numGroups}) for tournament ${tournamentId}`);
      throw new Error(`Invalid num_groups: ${numGroups}`);
    }
    
    // Get participants
    const participants = await client.query(`
      SELECT tp.player_id, p.username, p.full_name, p.rating
      FROM tournament_participants tp
      JOIN players p ON tp.player_id = p.id
      WHERE tp.tournament_id = $1
      ORDER BY p.rating DESC
    `, [tournamentId]);
    
    const players = participants.rows;
    console.log(`[🟡 GROUP-STAGE] Found ${players.length} participants`);
    console.log(`[🟡 GROUP-STAGE] Tournament settings: ${numGroups} groups, ${playersPerGroupAdvance} players advancing per group`);
    
    if (players.length < 2) {
      console.log(`[🟡 GROUP-STAGE] Not enough players (${players.length}) to create matches`);
      throw new Error(`Not enough players: ${players.length}`);
    }
    
    // Divide players into groups (snake draft style)
    const groups = [];
    const baseGroupSize = Math.floor(players.length / numGroups);
    const remainder = players.length % numGroups;
    
    let playerIndex = 0;
    for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
      const currentGroupSize = baseGroupSize + (groupIndex < remainder ? 1 : 0);
      const group = players.slice(playerIndex, playerIndex + currentGroupSize);
      groups.push(group);
      playerIndex += currentGroupSize;
    }
    
    console.log(`[🟡 GROUP-STAGE] Divided into ${groups.length} groups`);
    
    // Calculate expected matches: n*(n-1)/2 for each group
    let expectedMatches = 0;
    groups.forEach((group, idx) => {
      const groupMatches = (group.length * (group.length - 1)) / 2;
      expectedMatches += groupMatches;
      console.log(`[🟡 GROUP-STAGE] Group ${String.fromCharCode(65 + idx)}: ${group.length} players → ${groupMatches} matches`);
    });
    console.log(`[🟡 GROUP-STAGE] Expected total matches: ${expectedMatches}`);
    
    let createdCount = 0;
    console.log(`[🟡 GROUP-STAGE] Creating matches (max: ${expectedMatches})...`);
    
    for (let groupIndex = 0; groupIndex < groups.length && createdCount < expectedMatches; groupIndex++) {
      const group = groups[groupIndex];
      const groupName = `Group ${String.fromCharCode(65 + groupIndex)}`;
      
      for (let i = 0; i < group.length && createdCount < expectedMatches; i++) {
        for (let j = i + 1; j < group.length && createdCount < expectedMatches; j++) {
          const player1 = group[i];
          const player2 = group[j];
          
          await client.query(`
            INSERT INTO matches (tournament_id, player1_id, player2_id, round, group_name, status)
            VALUES ($1, $2, $3, $4, $5, 'scheduled')
          `, [tournamentId, player1.player_id, player2.player_id, 'Group Stage', groupName]);
          createdCount++;
          
          if (createdCount > expectedMatches) {
            console.error(`[🟡 GROUP-STAGE] ERROR: Created more matches than expected! Expected: ${expectedMatches}, Created: ${createdCount}`);
            throw new Error(`Attempted to create too many matches: ${createdCount} > ${expectedMatches}`);
          }
        }
      }
    }
    
    // Final check
    const finalCheck = await client.query(
      'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
      [tournamentId]
    );
    const finalCount = parseInt(finalCheck.rows[0].count);
    
    if (finalCount > expectedMatches) {
      throw new Error(`Too many matches created: ${finalCount} > ${expectedMatches}`);
    }
    
    console.log(`[🟡 GROUP-STAGE] ✅ Successfully created ${createdCount} matches (expected: ${expectedMatches})`);
    console.log(`[🟡 GROUP-STAGE] ========================================\n`);
  } catch (error) {
    console.error(`[🟡 GROUP-STAGE] ❌ Error creating matches:`, error);
    throw error;
  }
}

// Helper function to create round-robin matches
async function createRoundRobinMatches(tournamentId) {
  // Защита от параллельных вызовов
  if (matchGenerationInProgress.has(tournamentId)) {
    console.log(`[🟢 ROUND-ROBIN] Generation already in progress for tournament ${tournamentId}, skipping`);
    return;
  }
  
  matchGenerationInProgress.set(tournamentId, true);
  console.log(`[🟢 ROUND-ROBIN] Starting for tournament ${tournamentId}`);
  
  // Используем advisory lock сразу для полной блокировки
  const lockClient = await pool.connect();
  try {
    // Пытаемся получить advisory lock
    const lockResult = await lockClient.query('SELECT pg_try_advisory_xact_lock($1)', [tournamentId]);
    if (!lockResult.rows[0].pg_try_advisory_xact_lock) {
      console.log(`[🟢 ROUND-ROBIN] 🔒 Tournament ${tournamentId} is locked by another process, skipping`);
      matchGenerationInProgress.delete(tournamentId);
      return;
    }
    
    await lockClient.query('BEGIN');
    
    // КРИТИЧЕСКАЯ ПРОВЕРКА: Проверяем, есть ли уже матчи для этого турнира
    // Не используем FOR UPDATE с COUNT(*), так как это недопустимо в PostgreSQL
    const existingMatchesCheck = await lockClient.query(
      'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
      [tournamentId]
    );
    
    const existingCount = parseInt(existingMatchesCheck.rows[0].count);
    
    // КРИТИЧЕСКАЯ ЗАЩИТА: если матчей больше 0, БЛОКИРУЕМ ВСЕ!
    if (existingCount > 0) {
      console.log(`[🟢 ROUND-ROBIN] Tournament ${tournamentId} already has ${existingCount} matches, skipping`);
      await lockClient.query('ROLLBACK');
      lockClient.release();
      matchGenerationInProgress.delete(tournamentId);
      return;
    }
    
    await lockClient.query('ROLLBACK'); // Откатываем транзакцию проверки
    lockClient.release(); // Освобождаем клиент перед созданием матчей
    
  // Get participants
  const participants = await pool.query(`
    SELECT tp.player_id, p.username, p.full_name, p.rating
    FROM tournament_participants tp
    JOIN players p ON tp.player_id = p.id
    WHERE tp.tournament_id = $1
    ORDER BY p.rating DESC
  `, [tournamentId]);
  
  const players = participants.rows;
    console.log(`[🟢 ROUND-ROBIN] Found ${players.length} participants`);
    
    if (players.length < 2) {
      console.log(`[🟢 ROUND-ROBIN] Not enough players (${players.length}) to create matches`);
      matchGenerationInProgress.delete(tournamentId);
      return;
    }
    
    // Для round-robin: n*(n-1)/2 матчей для n игроков
    const expectedMatches = (players.length * (players.length - 1)) / 2;
    console.log(`[🟢 ROUND-ROBIN] Expected matches: ${expectedMatches} (formula: ${players.length} * ${players.length - 1} / 2)`);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Повторная проверка внутри транзакции с блокировкой
      const doubleCheck = await client.query(`
        SELECT COUNT(*) FROM matches WHERE tournament_id = $1
      `, [tournamentId]);
      
      const existingCountInTx = parseInt(doubleCheck.rows[0].count);
      if (existingCountInTx > 0) {
        await client.query('ROLLBACK');
        client.release();
        console.log(`[🟢 ROUND-ROBIN] Matches already exist (double-check: ${existingCountInTx}), aborting`);
        matchGenerationInProgress.delete(tournamentId);
        return;
      }
      
      let createdCount = 0;
      const maxMatches = expectedMatches; // Защита от переполнения
      
      console.log(`[🟢 ROUND-ROBIN] Creating matches (max: ${maxMatches})...`);
      
      // Create all possible match combinations с проверкой дубликатов
      for (let i = 0; i < players.length && createdCount < maxMatches; i++) {
        for (let j = i + 1; j < players.length && createdCount < maxMatches; j++) {
          const existingMatch = await client.query(`
            SELECT id FROM matches 
            WHERE tournament_id = $1 
              AND ((player1_id = $2 AND player2_id = $3) OR (player1_id = $3 AND player2_id = $2))
              AND round = $4
          `, [tournamentId, players[i].player_id, players[j].player_id, 'Round Robin']);
          
          if (existingMatch.rows.length === 0) {
            await client.query(`
        INSERT INTO matches (tournament_id, player1_id, player2_id, round, status)
        VALUES ($1, $2, $3, $4, 'scheduled')
      `, [tournamentId, players[i].player_id, players[j].player_id, 'Round Robin']);
            createdCount++;
            
            // Защита от превышения лимита
            if (createdCount > expectedMatches) {
              console.error(`[🟢 ROUND-ROBIN] ERROR: Created more matches than expected! Expected: ${expectedMatches}, Created: ${createdCount}`);
              await client.query('ROLLBACK');
              throw new Error(`Attempted to create too many matches: ${createdCount} > ${expectedMatches}`);
            }
          }
        }
      }
      
      // Финальная проверка
      const finalCheck = await client.query(
        'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
        [tournamentId]
      );
      const finalCount = parseInt(finalCheck.rows[0].count);
      
      if (finalCount > expectedMatches) {
        await client.query('ROLLBACK');
        throw new Error(`Too many matches created: ${finalCount} > ${expectedMatches}`);
      }
      
      await client.query('COMMIT');
      console.log(`[🟢 ROUND-ROBIN] ✅ Successfully created ${createdCount} matches (expected: ${expectedMatches})`);
    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
      }
      console.error(`[🟢 ROUND-ROBIN] ❌ Error creating matches:`, error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
      matchGenerationInProgress.delete(tournamentId);
    }
  } catch (outerError) {
    console.error(`[🟢 ROUND-ROBIN] ❌ Outer error:`, outerError);
    matchGenerationInProgress.delete(tournamentId);
    throw outerError;
  }
}

// Helper function to create group stage matches
async function createGroupStageMatches(tournamentId) {
  // Защита от параллельных вызовов
  if (matchGenerationInProgress.has(tournamentId)) {
    console.log(`[🟡 GROUP-STAGE] Generation already in progress for tournament ${tournamentId}, skipping`);
    return;
  }
  
  matchGenerationInProgress.set(tournamentId, true);
  console.log(`[🟡 GROUP-STAGE] Starting for tournament ${tournamentId}`);
  
  // Используем advisory lock сразу для полной блокировки
  const lockClient = await pool.connect();
  try {
    // Пытаемся получить advisory lock
    const lockResult = await lockClient.query('SELECT pg_try_advisory_xact_lock($1)', [tournamentId]);
    if (!lockResult.rows[0].pg_try_advisory_xact_lock) {
      console.log(`[🟡 GROUP-STAGE] 🔒 Tournament ${tournamentId} is locked by another process, skipping`);
      matchGenerationInProgress.delete(tournamentId);
      return;
    }
    
    await lockClient.query('BEGIN');
    
    // КРИТИЧЕСКАЯ ПРОВЕРКА: Проверяем, есть ли уже матчи для этого турнира
    // Не используем FOR UPDATE с COUNT(*), так как это недопустимо в PostgreSQL
    const existingMatchesCheck = await lockClient.query(
      'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
      [tournamentId]
    );
    
    const existingCount = parseInt(existingMatchesCheck.rows[0].count);
    
    // КРИТИЧЕСКАЯ ЗАЩИТА: если матчей больше 0, БЛОКИРУЕМ ВСЕ!
    if (existingCount > 0) {
      console.log(`[🟡 GROUP-STAGE] Tournament ${tournamentId} already has ${existingCount} matches, skipping`);
      await lockClient.query('ROLLBACK');
      lockClient.release();
      matchGenerationInProgress.delete(tournamentId);
      return;
    }
    
    await lockClient.query('ROLLBACK'); // Откатываем транзакцию проверки
    lockClient.release(); // Освобождаем клиент перед созданием матчей
    
  // Get tournament settings
  const tournamentResult = await pool.query(`
    SELECT num_groups, players_per_group_advance, max_participants
    FROM tournaments
    WHERE id = $1
  `, [tournamentId]);
  
  if (tournamentResult.rows.length === 0) {
    console.log(`[🟡 GROUP-STAGE] Tournament ${tournamentId} not found`);
    matchGenerationInProgress.delete(tournamentId);
    return;
  }
  
  const tournament = tournamentResult.rows[0];
  const numGroups = tournament.num_groups;
  const playersPerGroupAdvance = tournament.players_per_group_advance;
  
  if (!numGroups || numGroups < 2) {
    console.log(`[🟡 GROUP-STAGE] Invalid num_groups (${numGroups}) for tournament ${tournamentId}`);
    matchGenerationInProgress.delete(tournamentId);
    return;
  }
  
  // Get participants
  const participants = await pool.query(`
    SELECT tp.player_id, p.username, p.full_name, p.rating
    FROM tournament_participants tp
    JOIN players p ON tp.player_id = p.id
    WHERE tp.tournament_id = $1
    ORDER BY p.rating DESC
  `, [tournamentId]);
  
  const players = participants.rows;
    console.log(`[🟡 GROUP-STAGE] Found ${players.length} participants`);
    console.log(`[🟡 GROUP-STAGE] Tournament settings: ${numGroups} groups, ${playersPerGroupAdvance} players advancing per group`);
    
    if (players.length < 2) {
      console.log(`[🟡 GROUP-STAGE] Not enough players (${players.length}) to create matches`);
      matchGenerationInProgress.delete(tournamentId);
      return;
    }
  
  // Divide players into specified number of groups
  // Distribute players evenly: most groups get floor(players.length / numGroups) players,
  // remaining players go to the last groups
  const groups = [];
  const baseGroupSize = Math.floor(players.length / numGroups);
  const remainder = players.length % numGroups;
  
  let playerIndex = 0;
  for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
    // First (remainder) groups get one extra player if there's a remainder
    const currentGroupSize = baseGroupSize + (groupIndex < remainder ? 1 : 0);
    const group = players.slice(playerIndex, playerIndex + currentGroupSize);
    groups.push(group);
    playerIndex += currentGroupSize;
  }
  
    console.log(`[🟡 GROUP-STAGE] Divided into ${groups.length} groups`);
    
    // Расчет ожидаемого количества матчей: для каждой группы n*(n-1)/2
    let expectedMatches = 0;
    groups.forEach((group, idx) => {
      const groupMatches = (group.length * (group.length - 1)) / 2;
      expectedMatches += groupMatches;
      console.log(`[🟡 GROUP-STAGE] Group ${String.fromCharCode(65 + idx)}: ${group.length} players → ${groupMatches} matches`);
    });
    console.log(`[🟡 GROUP-STAGE] Expected total matches: ${expectedMatches}`);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Повторная проверка внутри транзакции с блокировкой
      const doubleCheck = await client.query(`
        SELECT COUNT(*) FROM matches WHERE tournament_id = $1
      `, [tournamentId]);
      
      const existingCountInTx = parseInt(doubleCheck.rows[0].count);
      if (existingCountInTx > 0) {
        await client.query('ROLLBACK');
        client.release();
        console.log(`[🟡 GROUP-STAGE] Matches already exist (double-check: ${existingCountInTx}), aborting`);
        matchGenerationInProgress.delete(tournamentId);
        return;
      }
      
      let createdCount = 0;
      console.log(`[🟡 GROUP-STAGE] Creating matches (max: ${expectedMatches})...`);
      
      for (let groupIndex = 0; groupIndex < groups.length && createdCount < expectedMatches; groupIndex++) {
    const group = groups[groupIndex];
    const groupName = `Group ${String.fromCharCode(65 + groupIndex)}`;
    
        for (let i = 0; i < group.length && createdCount < expectedMatches; i++) {
          for (let j = i + 1; j < group.length && createdCount < expectedMatches; j++) {
            const existingMatch = await client.query(`
              SELECT id FROM matches 
              WHERE tournament_id = $1 
                AND player1_id = $2 
                AND player2_id = $3 
                AND round = $4
                AND group_name = $5
            `, [tournamentId, group[i].player_id, group[j].player_id, 'Group Stage', groupName]);
            
            if (existingMatch.rows.length === 0) {
              await client.query(`
          INSERT INTO matches (tournament_id, player1_id, player2_id, round, group_name, status)
          VALUES ($1, $2, $3, $4, $5, 'scheduled')
        `, [tournamentId, group[i].player_id, group[j].player_id, 'Group Stage', groupName]);
              createdCount++;
              
              if (createdCount > expectedMatches) {
                console.error(`[🟡 GROUP-STAGE] ERROR: Created more matches than expected! Expected: ${expectedMatches}, Created: ${createdCount}`);
                await client.query('ROLLBACK');
                throw new Error(`Attempted to create too many matches: ${createdCount} > ${expectedMatches}`);
              }
            }
          }
        }
      }
      
      // Финальная проверка
      const finalCheck = await client.query(
        'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
        [tournamentId]
      );
      const finalCount = parseInt(finalCheck.rows[0].count);
      
      if (finalCount > expectedMatches) {
        await client.query('ROLLBACK');
        throw new Error(`Too many matches created: ${finalCount} > ${expectedMatches}`);
      }
      
      await client.query('COMMIT');
      console.log(`[🟡 GROUP-STAGE] ✅ Successfully created ${createdCount} matches (expected: ${expectedMatches})`);
    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
      }
      console.error(`[🟡 GROUP-STAGE] ❌ Error creating matches:`, error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
      matchGenerationInProgress.delete(tournamentId);
    }
  } catch (outerError) {
    console.error(`[🟡 GROUP-STAGE] ❌ Outer error:`, outerError);
    matchGenerationInProgress.delete(tournamentId);
    throw outerError;
  }
}

// Start tournament
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[🔵 START TOURNAMENT] ==========================================`);
    console.log(`[🔵 START TOURNAMENT] Starting tournament ${id}...`);
    
    // Получаем турнир с блокировкой для предотвращения race condition
    const client = await pool.connect();
    let tournament = null;
    try {
      await client.query('BEGIN');
      
      // Получаем турнир с блокировкой и проверяем статус
      const tournamentCheck = await client.query(
        'SELECT * FROM tournaments WHERE id = $1 FOR UPDATE',
        [id]
      );
      
      if (tournamentCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(404).json({ error: 'Tournament not found' });
      }
      
      const oldTournament = tournamentCheck.rows[0];
      console.log(`[🔵 START TOURNAMENT] Tournament: "${oldTournament.name}" (ID: ${id})`);
      console.log(`[🔵 START TOURNAMENT] Current status: ${oldTournament.status}`);
      console.log(`[🔵 START TOURNAMENT] Format: ${oldTournament.format}`);
      console.log(`[🔵 START TOURNAMENT] Participants: ${oldTournament.current_participants}`);
      
      // Проверяем матчи ДО проверки статуса (FOR UPDATE не нужен здесь, так как мы уже в транзакции с блокировкой турнира)
      const existingMatches = await client.query(
        'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
        [id]
      );
      
      const matchCount = parseInt(existingMatches.rows[0].count);
      console.log(`[🔵 START TOURNAMENT] Existing matches: ${matchCount}`);
      
      // КРИТИЧЕСКАЯ ЗАЩИТА: Если матчей больше 0, НИКОГДА не генерируем!
      if (matchCount > 0) {
        console.error(`[🔵 START TOURNAMENT] ❌❌❌ CRITICAL: Tournament has ${matchCount} matches! BLOCKING ALL GENERATION!`);
        await client.query('COMMIT');
        client.release();
        return res.json({
          tournament: oldTournament,
          message: 'Tournament already has matches'
        });
      }
      
      // Если матчей нет, разрешаем создание независимо от статуса
      // Это позволяет восстановить матчи для турниров, которые были переведены в ongoing без генерации матчей
      let statusChanged = false;
      if (oldTournament.status !== 'upcoming' && oldTournament.status !== 'ongoing') {
        await client.query('COMMIT');
        client.release();
        return res.status(400).json({ error: `Tournament cannot be started. Current status: ${oldTournament.status}. Only tournaments with status 'upcoming' or 'ongoing' can be started.` });
      }
      
      // Если нужно создать матчи, проверяем количество участников ДО обновления статуса
      if (matchCount === 0) {
        const participantsCheck = await client.query(
          'SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = $1',
          [id]
        );
        const participantCount = parseInt(participantsCheck.rows[0].count);
        
        if (participantCount < 2) {
          await client.query('ROLLBACK');
          client.release();
          return res.status(400).json({ 
            error: 'Cannot start tournament',
            message: `Tournament needs at least 2 participants to start. Current participants: ${participantCount}`
          });
        }
        console.log(`[🔵 START TOURNAMENT] Participants check passed: ${participantCount} participants`);
      }
      
      // Обновляем статус на ongoing только если он был upcoming
      if (oldTournament.status === 'upcoming') {
        const updateResult = await client.query(`
          UPDATE tournaments 
          SET status = 'ongoing', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `, [id]);
        
        tournament = updateResult.rows[0];
        statusChanged = true;
        console.log(`[🔵 START TOURNAMENT] Status updated to: ongoing`);
      } else {
        // Статус уже ongoing, используем текущий турнир
        tournament = oldTournament;
        console.log(`[🔵 START TOURNAMENT] Status already ongoing, creating missing matches`);
      }
      
      // Коммитим транзакцию обновления статуса
      await client.query('COMMIT');
      client.release();
      
      // Генерируем матчи используя advisory lock (как в PUT /:id)
      if (matchCount === 0) {
        console.log(`[🔵 START TOURNAMENT] No matches found, generating matches...`);
        
        try {
          await withAdvisoryLock(id, async (lockClient) => {
            // Двойная проверка внутри блокировки
            const doubleLockCheck = await lockClient.query(
              'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
              [id]
            );
            const doubleCount = parseInt(doubleLockCheck.rows[0].count);
            
            if (doubleCount === 0) {
              console.log(`[🔵 START TOURNAMENT] 🔒 Advisory lock acquired, generating matches...`);
              
              // КРИТИЧЕСКАЯ ПРОВЕРКА: Еще раз проверяем количество МАКСИМАЛЬНО СТРОГО
              const tripleCheck = await lockClient.query(
                'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
                [id]
              );
              const tripleCount = parseInt(tripleCheck.rows[0].count);
              
              if (tripleCount > 0) {
                console.error(`[🔵 START TOURNAMENT] ❌❌❌ TRIPLE CHECK FAILED: ${tripleCount} matches exist! BLOCKING!`);
                return;
              }
              
              // Создаем матчи в зависимости от формата турнира
              // Используем lockClient для создания матчей внутри той же транзакции
              if (tournament.format === 'single-elimination') {
                await createSingleEliminationMatchesWithClient(id, lockClient);
              } else if (tournament.format === 'round-robin') {
                await createRoundRobinMatchesWithClient(id, lockClient);
              } else if (tournament.format === 'group-stage') {
                await createGroupStageMatchesWithClient(id, lockClient);
              } else {
                console.error(`[🔵 START TOURNAMENT] ❌ Unknown tournament format: ${tournament.format}`);
                throw new Error(`Unknown tournament format: ${tournament.format}`);
              }
            } else {
              console.log(`[🔵 START TOURNAMENT] ⏭️  Double-check: Found ${doubleCount} matches, skipping generation`);
            }
          });
          
          // Проверяем результат
          const finalMatches = await pool.query(
            'SELECT COUNT(*) FROM matches WHERE tournament_id = $1',
            [id]
          );
          const finalCount = parseInt(finalMatches.rows[0].count);
          console.log(`[🔵 START TOURNAMENT] ✅ Match generation completed: ${finalCount} matches created`);
          
          // Update match start_time to current timestamp when tournament starts
          // This ensures accurate streak calculation even if tournament is started later than scheduled
          if (finalCount > 0) {
            console.log(`[🔵 START TOURNAMENT] 🕐 Updating match timestamps to current time...`);
            const updateResult = await pool.query(
              `UPDATE matches 
               SET start_time = CURRENT_TIMESTAMP 
               WHERE tournament_id = $1 AND start_time IS NOT NULL
               RETURNING id`,
              [id]
            );
            console.log(`[🔵 START TOURNAMENT] ✅ Updated ${updateResult.rowCount} match timestamps`);
          }
          
          // КРИТИЧЕСКАЯ ПРОВЕРКА: Если матчи не были созданы, это ошибка
          if (finalCount === 0) {
            // Получаем количество участников для сообщения об ошибке
            const participantsCheck = await pool.query(
              'SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = $1',
              [id]
            );
            const participantCount = parseInt(participantsCheck.rows[0].count);
            
            console.error(`[🔵 START TOURNAMENT] ❌❌❌ CRITICAL: Match generation completed but 0 matches were created!`);
            console.error(`[🔵 START TOURNAMENT]   - Tournament ID: ${id}`);
            console.error(`[🔵 START TOURNAMENT]   - Format: ${tournament.format}`);
            console.error(`[🔵 START TOURNAMENT]   - Participants: ${participantCount}`);
            throw new Error(`Failed to create matches. Tournament has ${participantCount} participants but no matches were generated.`);
          }
        } catch (matchGenError) {
          console.error(`[🔵 START TOURNAMENT] ❌ Error during match generation:`, matchGenError);
          console.error(`[🔵 START TOURNAMENT] ❌ Error stack:`, matchGenError.stack);
          // Прерываем старт турнира из-за ошибки генерации матчей
          throw matchGenError;
        }
      }
      
      console.log(`[🔵 START TOURNAMENT] ==========================================\n`);
      
      // Получаем обновленный турнир для ответа
      if (!tournament) {
        const finalTournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [id]);
        tournament = finalTournament.rows[0];
      }
      
      res.json({
        tournament: tournament,
        message: 'Tournament started successfully'
      });
      
    } catch (error) {
      if (client && !client.closed) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error(`[🔵 START TOURNAMENT] ❌ Rollback error:`, rollbackError);
        }
        try {
          client.release();
        } catch (releaseError) {
          console.error(`[🔵 START TOURNAMENT] ❌ Release error:`, releaseError);
        }
      }
      console.error(`[🔵 START TOURNAMENT] ❌ Error:`, error);
      throw error;
    }

  } catch (error) {
    console.error('Error starting tournament:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to start tournament',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Create playoff matches for group stage tournament
router.post('/:id/create-playoff-matches', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[🟢 PLAYOFF] ==========================================`);
    console.log(`[🟢 PLAYOFF] Creating playoff matches for tournament ${id}...`);
    
    // Get tournament info
    const tournamentResult = await pool.query(`
      SELECT id, format, num_groups, players_per_group_advance, match_format
      FROM tournaments
      WHERE id = $1
    `, [id]);
    
    if (tournamentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    const tournament = tournamentResult.rows[0];
    
    if (tournament.format !== 'group-stage') {
      return res.status(400).json({ error: 'Tournament is not a group stage tournament' });
    }
    
    // Check if playoff matches already exist
    const existingPlayoffMatches = await pool.query(`
      SELECT COUNT(*) FROM matches
      WHERE tournament_id = $1 AND round != 'Group Stage'
    `, [id]);
    
    if (parseInt(existingPlayoffMatches.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Playoff matches already exist' });
    }
    
    // Check if all group stage matches are completed
    const groupStageMatches = await pool.query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM matches
      WHERE tournament_id = $1 AND round = 'Group Stage'
    `, [id]);
    
    const { total, completed } = groupStageMatches.rows[0];
    
    if (parseInt(total) === 0) {
      return res.status(400).json({ error: 'No group stage matches found' });
    }
    
    if (parseInt(completed) !== parseInt(total)) {
      return res.status(400).json({ 
        error: `Not all group stage matches are completed (${completed}/${total})` 
      });
    }
    
    // Get all group stage matches with scores
    const matches = await pool.query(`
      SELECT m.id, m.player1_id, m.player2_id, m.group_name,
             ms.player1_scores, ms.player2_scores,
             p1.full_name as player1_name, p1.username as player1_username,
             p2.full_name as player2_name, p2.username as player2_username
      FROM matches m
      LEFT JOIN match_scores ms ON m.id = ms.match_id
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      WHERE m.tournament_id = $1 AND m.round = 'Group Stage'
      ORDER BY m.group_name, m.id
    `, [id]);
    
    // Calculate standings for each group
    const groupStandings = {};
    
    // Process matches to calculate standings
    matches.rows.forEach(match => {
      const groupName = match.group_name;
      if (!groupStandings[groupName]) {
        groupStandings[groupName] = [];
      }
      
      const p1Id = match.player1_id;
      const p2Id = match.player2_id;
      const p1Name = match.player1_name || match.player1_username;
      const p2Name = match.player2_name || match.player2_username;
      
      // Initialize players if not exists
      if (!groupStandings[groupName].find(s => s.playerId === p1Id)) {
        groupStandings[groupName].push({
          playerId: p1Id,
          playerName: p1Name,
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          points: 0,
          pointDifference: 0
        });
      }
      
      if (p2Id && !groupStandings[groupName].find(s => s.playerId === p2Id)) {
        groupStandings[groupName].push({
          playerId: p2Id,
          playerName: p2Name,
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          points: 0,
          pointDifference: 0
        });
      }
      
      if (!match.player1_scores || !match.player2_scores) return;
      
      const p1Scores = match.player1_scores;
      const p2Scores = match.player2_scores;
      
      // Calculate wins
      let p1Wins = 0;
      let p2Wins = 0;
      for (let i = 0; i < Math.min(p1Scores.length, p2Scores.length); i++) {
        if (p1Scores[i] > p2Scores[i]) p1Wins++;
        else if (p2Scores[i] > p1Scores[i]) p2Wins++;
      }
      
      // Update standings
      const p1Standing = groupStandings[groupName].find(s => s.playerId === p1Id);
      const p2Standing = p2Id ? groupStandings[groupName].find(s => s.playerId === p2Id) : null;
      
      if (p1Standing) {
        p1Standing.pointsFor += p1Scores.reduce((a, b) => a + b, 0);
        p1Standing.pointsAgainst += p2Scores.reduce((a, b) => a + b, 0);
        if (p1Wins > p2Wins) p1Standing.wins++;
        else if (p2Wins > p1Wins) p1Standing.losses++;
      }
      
      if (p2Standing) {
        p2Standing.pointsFor += p2Scores.reduce((a, b) => a + b, 0);
        p2Standing.pointsAgainst += p1Scores.reduce((a, b) => a + b, 0);
        if (p2Wins > p1Wins) p2Standing.wins++;
        else if (p1Wins > p2Wins) p2Standing.losses++;
      }
    });
    
    // Calculate points and point difference for each player
    Object.keys(groupStandings).forEach(groupName => {
      groupStandings[groupName].forEach(standing => {
        standing.points = standing.wins * 3;
        standing.pointDifference = standing.pointsFor - standing.pointsAgainst;
      });
      
      // Sort by points, then by point difference
      groupStandings[groupName].sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        return b.pointDifference - a.pointDifference;
      });
    });
    
    // Collect advancing players from all groups
    const playersPerGroupAdvance = tournament.players_per_group_advance || 2;
    const advancingPlayers = [];
    
    Object.keys(groupStandings).sort().forEach(groupName => {
      const topPlayers = groupStandings[groupName].slice(0, playersPerGroupAdvance);
      topPlayers.forEach((player, index) => {
        advancingPlayers.push({
          playerId: player.playerId,
          playerName: player.playerName,
          group: groupName,
          position: index + 1,
          points: player.points,
          pointDifference: player.pointDifference
        });
      });
    });
    
    // Sort all advancing players by points, then by point difference (best first)
    advancingPlayers.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return b.pointDifference - a.pointDifference;
    });
    
    console.log(`[🟢 PLAYOFF] Advancing players (${advancingPlayers.length}):`);
    advancingPlayers.forEach((p, i) => {
      console.log(`[🟢 PLAYOFF]   ${i + 1}. ${p.playerName} (${p.group}, ${p.points} pts, ${p.pointDifference} diff)`);
    });
    
    // Calculate bracket size (nearest power of 2, minimum 2)
    const totalPlayoffPlayers = advancingPlayers.length;
    let bracketSize = 2;
    if (totalPlayoffPlayers > 2) bracketSize = 4;
    if (totalPlayoffPlayers > 4) bracketSize = 8;
    if (totalPlayoffPlayers > 8) bracketSize = 16;
    if (totalPlayoffPlayers > 16) bracketSize = 32;
    
    const playersWithBye = bracketSize - totalPlayoffPlayers;
    const firstRoundMatches = Math.floor(bracketSize / 2);
    
    console.log(`[🟢 PLAYOFF] Bracket size: ${bracketSize}, Players with bye: ${playersWithBye}, First round matches: ${firstRoundMatches}`);
    
    // Determine rounds based on bracket size
    let rounds = [];
    if (bracketSize === 2) {
      // Only Final for 2 players
      rounds = [
        { name: 'Final', count: 1 }
      ];
    } else if (bracketSize === 4) {
      rounds = [
        { name: 'Semifinals', count: 2 },
        { name: 'Final', count: 1 }
      ];
    } else if (bracketSize === 8) {
      rounds = [
        { name: 'Quarterfinals', count: 4 },
        { name: 'Semifinals', count: 2 },
        { name: 'Final', count: 1 }
      ];
    } else if (bracketSize === 16) {
      rounds = [
        { name: 'Round of 16', count: 8 },
        { name: 'Quarterfinals', count: 4 },
        { name: 'Semifinals', count: 2 },
        { name: 'Final', count: 1 }
      ];
    } else if (bracketSize === 32) {
      rounds = [
        { name: 'Round of 32', count: 16 },
        { name: 'Round of 16', count: 8 },
        { name: 'Quarterfinals', count: 4 },
        { name: 'Semifinals', count: 2 },
        { name: 'Final', count: 1 }
      ];
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const firstRound = rounds[0];
      let totalCreated = 0;
      
      // For Final with exactly 2 players, both should play directly (no BYE, no earlier rounds)
      if (bracketSize === 2 && advancingPlayers.length === 2) {
        // Create Final match directly with both players
        await client.query(`
          INSERT INTO matches (tournament_id, player1_id, player2_id, round, status)
          VALUES ($1, $2, $3, 'Final', 'scheduled')
        `, [id, advancingPlayers[0].playerId, advancingPlayers[1].playerId]);
        
        totalCreated++;
        console.log(`[🟢 PLAYOFF] Created Final: ${advancingPlayers[0].playerName} vs ${advancingPlayers[1].playerName}`);
      } else {
        // Create first round matches
        let playerIndex = 0;
        for (let i = 0; i < firstRoundMatches; i++) {
          let player1Id = null;
          let player2Id = null;
          
          // First playersWithBye players get bye
          if (i < playersWithBye && playerIndex < advancingPlayers.length) {
            player1Id = advancingPlayers[playerIndex].playerId;
            player2Id = null; // BYE
            playerIndex++;
          } else {
            // Regular match
            if (playerIndex < advancingPlayers.length) {
              player1Id = advancingPlayers[playerIndex].playerId;
              playerIndex++;
            }
            
            if (playerIndex < advancingPlayers.length) {
              player2Id = advancingPlayers[playerIndex].playerId;
              playerIndex++;
            }
          }
          
          // Create match
          if (player1Id && !player2Id) {
            // Bye match - auto-complete
            const matchFormat = tournament.match_format || 'best-of-5';
            const maxSets = matchFormat === 'best-of-1' ? 1 : matchFormat === 'best-of-3' ? 3 : 5;
            const setsToWin = Math.ceil(maxSets / 2);
            
            const result = await client.query(`
              INSERT INTO matches (tournament_id, player1_id, player2_id, round, status, winner_id)
              VALUES ($1, $2, NULL, $3, 'completed', $2)
              RETURNING id
            `, [id, player1Id, firstRound.name]);
            
            const matchId = result.rows[0].id;
            const player1Scores = Array(setsToWin).fill(11);
            const player2Scores = Array(setsToWin).fill(0);
            
            await client.query(`
              INSERT INTO match_scores (match_id, player1_scores, player2_scores)
              VALUES ($1, $2, $3)
            `, [matchId, player1Scores, player2Scores]);
            
            totalCreated++;
            console.log(`[🟢 PLAYOFF] Created bye match: ${advancingPlayers.find(p => p.playerId === player1Id)?.playerName} vs BYE`);
          } else if (player1Id && player2Id) {
            // Regular match
            await client.query(`
              INSERT INTO matches (tournament_id, player1_id, player2_id, round, status)
              VALUES ($1, $2, $3, $4, 'scheduled')
            `, [id, player1Id, player2Id, firstRound.name]);
            
            totalCreated++;
            console.log(`[🟢 PLAYOFF] Created match: ${advancingPlayers.find(p => p.playerId === player1Id)?.playerName} vs ${advancingPlayers.find(p => p.playerId === player2Id)?.playerName}`);
          }
        }
      }
      
      // Create subsequent rounds
      for (let roundIndex = 1; roundIndex < rounds.length; roundIndex++) {
        const round = rounds[roundIndex];
        for (let i = 0; i < round.count; i++) {
          await client.query(`
            INSERT INTO matches (tournament_id, player1_id, player2_id, round, status)
            VALUES ($1, NULL, NULL, $2, 'scheduled')
          `, [id, round.name]);
          totalCreated++;
        }
        console.log(`[🟢 PLAYOFF] Created ${round.count} matches for ${round.name}`);
      }
      
      // Automatically advance players with BYE to next round
      console.log(`[🟢 PLAYOFF] ========================================`);
      console.log(`[🟢 PLAYOFF] 🚀 Automatically advancing players with bye to next round...`);
      
      // Get all completed BYE matches from first round
      const byeMatches = await client.query(`
        SELECT id, player1_id, round, winner_id, status
        FROM matches 
        WHERE tournament_id = $1 
          AND round = $2
          AND player2_id IS NULL
          AND player1_id IS NOT NULL
          AND status = 'completed'
          AND winner_id IS NOT NULL
        ORDER BY id
      `, [id, firstRound.name]);
      
      console.log(`[🟢 PLAYOFF]   - Found ${byeMatches.rows.length} completed bye matches to advance`);
      
      // Determine next round
      const roundProgression = {
        'Round of 32': 'Round of 16',
        'Round of 16': 'Quarterfinals',
        'Quarterfinals': 'Semifinals',
        'Semifinals': 'Final',
        'First Round': 'Semifinals'
      };
      
      const nextRound = roundProgression[firstRound.name];
      
      if (nextRound && byeMatches.rows.length > 0) {
        // Get all matches in current round to determine position
        const currentMatches = await client.query(`
          SELECT id FROM matches 
          WHERE tournament_id = $1 AND round = $2
          ORDER BY id ASC
        `, [id, firstRound.name]);
        
        // Get matches in next round
        const nextMatches = await client.query(`
          SELECT id, player1_id, player2_id FROM matches 
          WHERE tournament_id = $1 AND round = $2
          ORDER BY id ASC
        `, [id, nextRound]);
        
        console.log(`[🟢 PLAYOFF]   - Next round: ${nextRound}`);
        console.log(`[🟢 PLAYOFF]   - Next round matches: ${nextMatches.rows.length}`);
        
        // Advance each player with BYE to next round
        for (const byeMatch of byeMatches.rows) {
          const winnerId = byeMatch.winner_id;
          const matchId = byeMatch.id;
          
          // Determine match index in current round
          const matchIndex = currentMatches.rows.findIndex(m => m.id === matchId);
          if (matchIndex === -1) {
            console.log(`[🟢 PLAYOFF]   - ❌ Match ${matchId} not found in ${firstRound.name}`);
            continue;
          }
          
          // Determine target position in next round
          let targetMatchIndex, targetSlot;
          if (firstRound.name === 'Quarterfinals') {
            targetMatchIndex = Math.floor(matchIndex / 2);
            targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
          } else if (firstRound.name === 'Semifinals') {
            targetMatchIndex = 0;
            targetSlot = matchIndex === 0 ? 'player1' : 'player2';
          } else if (firstRound.name === 'Round of 16') {
            targetMatchIndex = Math.floor(matchIndex / 2);
            targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
          } else if (firstRound.name === 'Round of 32') {
            targetMatchIndex = Math.floor(matchIndex / 2);
            targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
          } else if (firstRound.name === 'First Round') {
            targetMatchIndex = 0;
            targetSlot = matchIndex === 0 ? 'player1' : 'player2';
          } else {
            console.log(`[🟢 PLAYOFF]   - ❌ Unknown round: ${firstRound.name}`);
            continue;
          }
          
          if (targetMatchIndex >= nextMatches.rows.length) {
            console.log(`[🟢 PLAYOFF]   - ❌ Target match index ${targetMatchIndex} >= ${nextMatches.rows.length}`);
            continue;
          }
          
          const targetMatch = nextMatches.rows[targetMatchIndex];
          const updateField = targetSlot === 'player1' ? 'player1_id' : 'player2_id';
          
          // Get player name for logging
          const playerInfo = await client.query('SELECT full_name FROM players WHERE id = $1', [winnerId]);
          const playerName = playerInfo.rows[0]?.full_name || `Player ${winnerId}`;
          
          // Update next round match
          await client.query(`
            UPDATE matches 
            SET ${updateField} = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [winnerId, targetMatch.id]);
          
          console.log(`[🟢 PLAYOFF]   - ✅ Advanced ${playerName} (ID: ${winnerId}) to ${nextRound} match ${targetMatchIndex} (${targetSlot})`);
        }
        
        console.log(`[🟢 PLAYOFF]   - ✅ All ${byeMatches.rows.length} bye matches advanced to ${nextRound}`);
      } else {
        console.log(`[🟢 PLAYOFF]   - ⚠️  No next round or no bye matches to advance`);
      }
      
      await client.query('COMMIT');
      console.log(`[🟢 PLAYOFF] ✅ Successfully created ${totalCreated} playoff matches`);
      
      res.json({
        message: 'Playoff matches created successfully',
        matchesCreated: totalCreated,
        advancingPlayers: advancingPlayers.length
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('[🟢 PLAYOFF] ❌ Error creating playoff matches:', error);
    res.status(500).json({ error: 'Failed to create playoff matches: ' + error.message });
  }
});

// Update existing playoff matches - advance players with BYE
router.post('/:id/update-playoff-matches', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[🟢 PLAYOFF UPDATE] ==========================================`);
    console.log(`[🟢 PLAYOFF UPDATE] Updating playoff matches for tournament ${id}...`);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Find first playoff round (could be Quarterfinals, Semifinals, etc.)
      const playoffRounds = ['Quarterfinals', 'Semifinals', 'Round of 16', 'Round of 32', 'First Round'];
      let firstRound = null;
      
      for (const roundName of playoffRounds) {
        const roundMatches = await client.query(`
          SELECT COUNT(*) FROM matches
          WHERE tournament_id = $1 AND round = $2
        `, [id, roundName]);
        
        if (parseInt(roundMatches.rows[0].count) > 0) {
          firstRound = roundName;
          break;
        }
      }
      
      if (!firstRound) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ error: 'No playoff matches found' });
      }
      
      console.log(`[🟢 PLAYOFF UPDATE] First playoff round: ${firstRound}`);
      
      // Get all completed BYE matches from first round
      const byeMatches = await client.query(`
        SELECT id, player1_id, round, winner_id, status
        FROM matches 
        WHERE tournament_id = $1 
          AND round = $2
          AND player2_id IS NULL
          AND player1_id IS NOT NULL
          AND status = 'completed'
          AND winner_id IS NOT NULL
        ORDER BY id
      `, [id, firstRound]);
      
      console.log(`[🟢 PLAYOFF UPDATE] Found ${byeMatches.rows.length} completed bye matches`);
      
      if (byeMatches.rows.length === 0) {
        await client.query('COMMIT');
        client.release();
        return res.json({
          message: 'No BYE matches to advance',
          advanced: 0
        });
      }
      
      // Determine next round
      const roundProgression = {
        'Round of 32': 'Round of 16',
        'Round of 16': 'Quarterfinals',
        'Quarterfinals': 'Semifinals',
        'Semifinals': 'Final',
        'First Round': 'Semifinals'
      };
      
      const nextRound = roundProgression[firstRound];
      
      if (!nextRound) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ error: `No next round for ${firstRound}` });
      }
      
      // Get all matches in current round to determine position
      const currentMatches = await client.query(`
        SELECT id FROM matches 
        WHERE tournament_id = $1 AND round = $2
        ORDER BY id ASC
      `, [id, firstRound]);
      
      // Get matches in next round
      const nextMatches = await client.query(`
        SELECT id, player1_id, player2_id FROM matches 
        WHERE tournament_id = $1 AND round = $2
        ORDER BY id ASC
      `, [id, nextRound]);
      
      console.log(`[🟢 PLAYOFF UPDATE] Next round: ${nextRound}`);
      console.log(`[🟢 PLAYOFF UPDATE] Next round matches: ${nextMatches.rows.length}`);
      
      let advancedCount = 0;
      
      // Advance each player with BYE to next round
      for (const byeMatch of byeMatches.rows) {
        const winnerId = byeMatch.winner_id;
        const matchId = byeMatch.id;
        
        // Determine match index in current round
        const matchIndex = currentMatches.rows.findIndex(m => m.id === matchId);
        if (matchIndex === -1) {
          console.log(`[🟢 PLAYOFF UPDATE]   - ❌ Match ${matchId} not found in ${firstRound}`);
          continue;
        }
        
        // Determine target position in next round
        let targetMatchIndex, targetSlot;
        if (firstRound === 'Quarterfinals') {
          targetMatchIndex = Math.floor(matchIndex / 2);
          targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
        } else if (firstRound === 'Semifinals') {
          targetMatchIndex = 0;
          targetSlot = matchIndex === 0 ? 'player1' : 'player2';
        } else if (firstRound === 'Round of 16') {
          targetMatchIndex = Math.floor(matchIndex / 2);
          targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
        } else if (firstRound === 'Round of 32') {
          targetMatchIndex = Math.floor(matchIndex / 2);
          targetSlot = matchIndex % 2 === 0 ? 'player1' : 'player2';
        } else if (firstRound === 'First Round') {
          targetMatchIndex = 0;
          targetSlot = matchIndex === 0 ? 'player1' : 'player2';
        } else {
          console.log(`[🟢 PLAYOFF UPDATE]   - ❌ Unknown round: ${firstRound}`);
          continue;
        }
        
        if (targetMatchIndex >= nextMatches.rows.length) {
          console.log(`[🟢 PLAYOFF UPDATE]   - ❌ Target match index ${targetMatchIndex} >= ${nextMatches.rows.length}`);
          continue;
        }
        
        const targetMatch = nextMatches.rows[targetMatchIndex];
        const updateField = targetSlot === 'player1' ? 'player1_id' : 'player2_id';
        
        // Check if slot is already filled
        const currentValue = targetMatch[updateField];
        if (currentValue && currentValue !== winnerId) {
          console.log(`[🟢 PLAYOFF UPDATE]   - ⚠️ Slot ${targetSlot} in match ${targetMatch.id} already has player ${currentValue}, skipping`);
          continue;
        }
        
        // Get player name for logging
        const playerInfo = await client.query('SELECT full_name FROM players WHERE id = $1', [winnerId]);
        const playerName = playerInfo.rows[0]?.full_name || `Player ${winnerId}`;
        
        // Update next round match
        await client.query(`
          UPDATE matches 
          SET ${updateField} = $1, 
              winner_id = NULL,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [winnerId, targetMatch.id]);
        
        advancedCount++;
        console.log(`[🟢 PLAYOFF UPDATE]   - ✅ Advanced ${playerName} (ID: ${winnerId}) to ${nextRound} match ${targetMatchIndex} (${targetSlot})`);
      }
      
      await client.query('COMMIT');
      console.log(`[🟢 PLAYOFF UPDATE] ✅ Successfully advanced ${advancedCount} players`);
      
      res.json({
        message: 'Playoff matches updated successfully',
        advanced: advancedCount
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('[🟢 PLAYOFF UPDATE] ❌ Error updating playoff matches:', error);
    res.status(500).json({ error: 'Failed to update playoff matches: ' + error.message });
  }
});

// Create playoff matches automatically after group stage completion
router.post('/:id/create-playoff-matches', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[🟢 CREATE PLAYOFF] ==========================================`);
    console.log(`[🟢 CREATE PLAYOFF] Creating playoff matches for tournament ${id}...`);
    
    // Get tournament info
    const tournamentInfo = await pool.query(`
      SELECT id, format, num_groups, players_per_group_advance
      FROM tournaments
      WHERE id = $1
    `, [id]);
    
    if (tournamentInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    const tournament = tournamentInfo.rows[0];
    
    if (tournament.format !== 'group-stage') {
      return res.status(400).json({ error: 'Tournament is not a group-stage tournament' });
    }
    
    // Check if playoff matches already exist
    const existingPlayoffMatches = await pool.query(`
      SELECT COUNT(*) FROM matches
      WHERE tournament_id = $1
        AND round != 'Group Stage'
        AND (round IS NULL OR round != 'Group Stage')
        AND (group_name IS NULL OR group_name = '')
    `, [id]);
    
    if (parseInt(existingPlayoffMatches.rows[0].count) > 0) {
      return res.json({
        message: 'Playoff matches already exist',
        matches: parseInt(existingPlayoffMatches.rows[0].count)
      });
    }
    
    // Get all group stage matches
    const groupMatches = await pool.query(`
      SELECT m.id, m.player1_id, m.player2_id, m.winner_id, m.group_name,
             p1.full_name as player1_name, p1.username as player1_username,
             p2.full_name as player2_name, p2.username as player2_username,
             w.full_name as winner_name, w.username as winner_username,
             ms.player1_scores, ms.player2_scores
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      LEFT JOIN players w ON m.winner_id = w.id
      LEFT JOIN match_scores ms ON m.id = ms.match_id
      WHERE m.tournament_id = $1
        AND m.round = 'Group Stage'
        AND m.group_name IS NOT NULL
        AND m.status = 'completed'
    `, [id]);
    
    if (groupMatches.rows.length === 0) {
      return res.status(400).json({ error: 'No completed group stage matches found' });
    }
    
    // Calculate standings for each group
    const groupStandings = new Map(); // group_name -> [{player_id, wins, losses, points, pointDifference}]
    
    groupMatches.rows.forEach(match => {
      const groupName = match.group_name;
      if (!groupStandings.has(groupName)) {
        groupStandings.set(groupName, new Map());
      }
      
      const groupPlayers = groupStandings.get(groupName);
      const player1Id = match.player1_id;
      const player2Id = match.player2_id;
      const winnerId = match.winner_id;
      
      // Initialize players if not exists
      if (!groupPlayers.has(player1Id)) {
        groupPlayers.set(player1Id, {
          player_id: player1Id,
          player_name: match.player1_name || match.player1_username,
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0
        });
      }
      if (!groupPlayers.has(player2Id)) {
        groupPlayers.set(player2Id, {
          player_id: player2Id,
          player_name: match.player2_name || match.player2_username,
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0
        });
      }
      
      const p1Stats = groupPlayers.get(player1Id);
      const p2Stats = groupPlayers.get(player2Id);
      
      // Calculate wins/losses
      if (winnerId === player1Id) {
        p1Stats.wins++;
        p2Stats.losses++;
      } else if (winnerId === player2Id) {
        p1Stats.losses++;
        p2Stats.wins++;
      }
      
      // Calculate points
      if (match.player1_scores && match.player2_scores) {
        match.player1_scores.forEach((score, i) => {
          p1Stats.pointsFor += score;
          p2Stats.pointsAgainst += score;
          if (match.player2_scores[i]) {
            p2Stats.pointsFor += match.player2_scores[i];
            p1Stats.pointsAgainst += match.player2_scores[i];
          }
        });
      }
    });
    
    // Get winners from each group
    const groupWinners = [];
    groupStandings.forEach((players, groupName) => {
      const playersArray = Array.from(players.values()).map(p => ({
        ...p,
        points: p.wins * 3,
        pointDifference: p.pointsFor - p.pointsAgainst
      }));
      
      // Sort by points, then by point difference
      playersArray.sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        return b.pointDifference - a.pointDifference;
      });
      
      // Get top player(s) based on players_per_group_advance
      const playersToAdvance = tournament.players_per_group_advance || 1;
      for (let i = 0; i < Math.min(playersToAdvance, playersArray.length); i++) {
        groupWinners.push({
          player_id: playersArray[i].player_id,
          player_name: playersArray[i].player_name,
          group_name: groupName
        });
      }
    });
    
    console.log(`[🟢 CREATE PLAYOFF] Group winners:`, groupWinners.map(w => `${w.player_name} (${w.group_name})`));
    
    if (groupWinners.length < 2) {
      return res.status(400).json({ error: 'Not enough group winners to create playoff matches' });
    }
    
    // Create Final match
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // For 2 groups with 1 player advancing each, create Final
      if (groupWinners.length === 2) {
        const finalMatch = await client.query(`
          INSERT INTO matches (tournament_id, player1_id, player2_id, round, status)
          VALUES ($1, $2, $3, 'Final', 'scheduled')
          RETURNING id
        `, [id, groupWinners[0].player_id, groupWinners[1].player_id]);
        
        console.log(`[🟢 CREATE PLAYOFF] ✅ Created Final match: ${groupWinners[0].player_name} vs ${groupWinners[1].player_name}`);
        
        await client.query('COMMIT');
        
        res.json({
          message: 'Playoff matches created successfully',
          matchesCreated: 1,
          matchId: finalMatch.rows[0].id
        });
      } else {
        // For more than 2 winners, create Semifinals first
        // This is a simplified version - you may need to adjust based on your tournament structure
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Tournament structure with more than 2 group winners not yet supported' });
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('[🟢 CREATE PLAYOFF] ❌ Error creating playoff matches:', error);
    res.status(500).json({ error: 'Failed to create playoff matches: ' + error.message });
  }
});

// Complete tournament
router.post('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { winner_id } = req.body; // Optional winner_id for single-elimination

    // Get tournament info first
    const tournamentInfo = await pool.query(`
      SELECT id, format, status FROM tournaments WHERE id = $1
    `, [id]);

    if (tournamentInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const tournament = tournamentInfo.rows[0];
    
    if (tournament.status === 'completed') {
      return res.json({
        tournament: tournament,
        message: 'Tournament already completed'
      });
    }

    // For round-robin and group-stage, determine winner from standings
    // For single-elimination, winner_id should be provided
    let finalWinnerId = winner_id;
    
    if (!finalWinnerId && (tournament.format === 'round-robin' || tournament.format === 'group-stage')) {
      // Try to determine winner from matches
      // For round-robin, winner is the player with most wins
      // For group-stage, winner is the winner of the final playoff match
      if (tournament.format === 'round-robin') {
        // Get all completed matches and calculate standings
        // For round robin, matches typically don't have group_name
        // and may or may not have round set to 'Round Robin'
        const matchesResult = await pool.query(`
          SELECT m.player1_id, m.player2_id, m.winner_id, m.round, m.group_name
          FROM matches m
          WHERE m.tournament_id = $1 
            AND m.status = 'completed'
            AND (m.group_name IS NULL OR m.group_name = '')
            AND (m.round = 'Round Robin' OR m.round IS NULL OR m.round = '')
        `, [id]);
        
        console.log(`[🏆 TOURNAMENT COMPLETE] Round-robin matches found: ${matchesResult.rows.length}`);
        
        // Calculate wins for each player
        const wins = new Map();
        matchesResult.rows.forEach(match => {
          if (match.winner_id) {
            wins.set(match.winner_id, (wins.get(match.winner_id) || 0) + 1);
          }
        });
        
        // Find player with most wins
        let maxWins = 0;
        for (const [playerId, winCount] of wins.entries()) {
          if (winCount > maxWins) {
            maxWins = winCount;
            finalWinnerId = playerId;
          }
        }
      } else if (tournament.format === 'group-stage') {
        // For group-stage, find winner of final match
        const finalMatch = await pool.query(`
          SELECT winner_id FROM matches
          WHERE tournament_id = $1 
            AND (round = 'Final' OR round = 'Finals')
            AND status = 'completed'
          LIMIT 1
        `, [id]);
        
        if (finalMatch.rows.length > 0 && finalMatch.rows[0].winner_id) {
          finalWinnerId = finalMatch.rows[0].winner_id;
        }
      }
    }

    // Update tournament status
    const result = await pool.query(`
      UPDATE tournaments 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status IN ('ongoing', 'live')
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found or cannot be completed' });
    }

    // Create standings using the helper function
    // For round-robin, we can call it without winnerId (it will determine from matches)
    // For single-elimination, winnerId is required
    try {
      if (tournament.format === 'single-elimination' && !finalWinnerId) {
        console.warn('Single-elimination tournament completed without winner_id');
      }
      await completeTournamentForTournaments(id, finalWinnerId);
    } catch (standingsError) {
      console.error('Error creating standings:', standingsError);
      // Continue even if standings creation fails
    }

    res.json({
      tournament: result.rows[0],
      message: 'Tournament completed successfully'
    });

  } catch (error) {
    console.error('Error completing tournament:', error);
    res.status(500).json({ error: 'Failed to complete tournament' });
  }
});

// Delete tournament
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM tournaments 
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json({
      message: 'Tournament deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ error: 'Failed to delete tournament' });
  }
});

module.exports = router;
module.exports.completeTournamentForTournaments = completeTournamentForTournaments;