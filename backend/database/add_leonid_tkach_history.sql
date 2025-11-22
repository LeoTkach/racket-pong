-- Add match history for leonid tkach (user ID 32) to show rating changes
-- This will create multiple matches over the past 90 days with varying outcomes

-- First, find the user ID for leonid tkach
-- Assuming username is 'leonidtkach' or similar, and ID is 32 based on logs

-- Get or create some opponent players (we'll use existing players or create temp ones)
DO $$
DECLARE
    leonid_id INTEGER;
    opponent_ids INTEGER[];
    tournament_id INTEGER;
    match_date TIMESTAMP;
    i INTEGER;
    is_winner BOOLEAN;
    opponent_id INTEGER;
BEGIN
    -- Find leonid tkach user ID
    SELECT id INTO leonid_id FROM players WHERE username LIKE '%leonid%' OR username LIKE '%tkach%' OR id = 32 LIMIT 1;
    
    IF leonid_id IS NULL THEN
        RAISE NOTICE 'User leonid tkach not found. Please check the username.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user ID: %', leonid_id;
    
    -- Get some existing players as opponents (exclude leonid)
    SELECT ARRAY_AGG(id) INTO opponent_ids 
    FROM players 
    WHERE id != leonid_id AND id IS NOT NULL 
    LIMIT 10;
    
    -- If no opponents, create a dummy tournament or use any available player
    IF opponent_ids IS NULL OR array_length(opponent_ids, 1) IS NULL THEN
        -- Get any player as opponent, or create one if needed
        SELECT id INTO opponent_id FROM players WHERE id != leonid_id LIMIT 1;
        IF opponent_id IS NULL THEN
            RAISE NOTICE 'No opponents found. Creating a temporary opponent.';
            -- Would need to create opponent here, but for now we'll skip
            RETURN;
        END IF;
        opponent_ids := ARRAY[opponent_id];
    END IF;
    
    -- Get or create a tournament for these matches
    SELECT id INTO tournament_id FROM tournaments LIMIT 1;
    IF tournament_id IS NULL THEN
        -- Create a tournament for these matches
        INSERT INTO tournaments (name, date, location, status, format, max_participants, current_participants)
        VALUES ('Practice Tournament', CURRENT_DATE - INTERVAL '30 days', 'Online', 'completed', 'round-robin', 16, 2)
        RETURNING id INTO tournament_id;
    END IF;
    
    RAISE NOTICE 'Using tournament ID: %', tournament_id;
    
    -- Create matches over the past 90 days
    -- Start rating around 1200-1300, end at current rating
    FOR i IN 1..25 LOOP
        match_date := CURRENT_TIMESTAMP - (INTERVAL '1 day' * (90 - i * 3.5));
        
        -- Alternate between win and loss, with more wins overall
        is_winner := (i % 3) != 0; -- Win 2 out of 3 matches
        
        -- Pick a random opponent
        opponent_id := opponent_ids[1 + (i % array_length(opponent_ids, 1))];
        
        -- Insert match
        INSERT INTO matches (
            tournament_id,
            player1_id,
            player2_id,
            winner_id,
            status,
            start_time,
            end_time,
            round,
            created_at
        ) VALUES (
            tournament_id,
            leonid_id,
            opponent_id,
            CASE WHEN is_winner THEN leonid_id ELSE opponent_id END,
            'completed',
            match_date,
            match_date + INTERVAL '30 minutes',
            'Group Stage',
            match_date
        );
        
        RAISE NOTICE 'Created match %: % at %', i, CASE WHEN is_winner THEN 'Win' ELSE 'Loss' END, match_date;
    END LOOP;
    
    -- Update player stats
    UPDATE players 
    SET 
        games_played = (SELECT COUNT(*) FROM matches WHERE player1_id = leonid_id OR player2_id = leonid_id),
        wins = (SELECT COUNT(*) FROM matches WHERE winner_id = leonid_id),
        losses = (SELECT COUNT(*) FROM matches WHERE (player1_id = leonid_id OR player2_id = leonid_id) AND winner_id != leonid_id AND winner_id IS NOT NULL),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = leonid_id;
    
    RAISE NOTICE 'Updated player statistics for user ID: %', leonid_id;
END $$;


