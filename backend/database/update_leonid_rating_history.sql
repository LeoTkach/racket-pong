-- Update rating history for leonid tkach with more realistic progression
-- Delete existing history and create new one with gradual growth

DO $$
DECLARE
    leonid_id INTEGER;
    current_rating INTEGER;
    start_rating INTEGER;
    start_date TIMESTAMP;
    i INTEGER;
    total_points INTEGER := 60;
    days_span INTEGER := 180;
    rating_value INTEGER;
    match_date TIMESTAMP;
    match_id_val INTEGER;
    tournament_id_val INTEGER;
    opponent_id INTEGER;
    is_winner BOOLEAN;
    rating_change INTEGER;
    progress REAL;
BEGIN
    -- Find leonid tkach user ID
    SELECT id, rating INTO leonid_id, current_rating 
    FROM players 
    WHERE username LIKE '%leonid%' OR username LIKE '%tkach%' OR full_name LIKE '%Leonid%' OR full_name LIKE '%Tkach%'
    LIMIT 1;
    
    IF leonid_id IS NULL THEN
        RAISE NOTICE 'User leonid tkach not found.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user ID: %, current rating: %', leonid_id, current_rating;
    
    -- Get current rating or use default
    IF current_rating IS NULL OR current_rating = 0 THEN
        current_rating := 2200;
    END IF;
    
    -- Start rating will be lower (around 1000-1200)
    start_rating := GREATEST(800, current_rating - 1000);
    
    -- Get an opponent for matches
    SELECT id INTO opponent_id FROM players WHERE id != leonid_id LIMIT 1;
    IF opponent_id IS NULL THEN
        RAISE NOTICE 'No opponents found.';
        RETURN;
    END IF;
    
    -- Get or create a tournament
    SELECT id INTO tournament_id_val FROM tournaments LIMIT 1;
    IF tournament_id_val IS NULL THEN
        INSERT INTO tournaments (name, date, location, status, format, max_participants, current_participants)
        VALUES ('Rating History Tournament', CURRENT_DATE - INTERVAL '180 days', 'Online', 'completed', 'round-robin', 16, 2)
        RETURNING id INTO tournament_id_val;
    END IF;
    
    -- Delete existing rating history for this player
    DELETE FROM player_rating_history WHERE player_id = leonid_id;
    RAISE NOTICE 'Deleted existing rating history';
    
    -- Start from 180 days ago
    start_date := CURRENT_TIMESTAMP - (INTERVAL '1 day' * days_span);
    rating_value := start_rating;
    
    -- Create realistic rating progression over 180 days
    FOR i IN 1..total_points LOOP
        progress := (i - 1.0) / (total_points - 1.0);
        match_date := start_date + (INTERVAL '1 day' * (days_span * progress));
        
        -- Calculate target rating (gradual increase from start to current)
        DECLARE
            target_rating INTEGER;
            variance REAL;
        BEGIN
            target_rating := start_rating + FLOOR((current_rating - start_rating) * progress);
            
            -- Add some realistic variance (wins and losses)
            -- More wins than losses to show overall upward trend
            is_winner := (i % 4) != 0; -- Win 3 out of 4 matches
            
            IF is_winner THEN
                -- Win: gain 8-20 points
                rating_change := 8 + (i % 12);
            ELSE
                -- Loss: lose 5-12 points
                rating_change := -(5 + (i % 7));
            END IF;
            
            -- Apply change but keep it moving toward target
            rating_value := rating_value + rating_change;
            
            -- Smooth the rating toward target (prevents too much deviation)
            DECLARE
                deviation INTEGER;
            BEGIN
                deviation := target_rating - rating_value;
                -- Pull rating 30% toward target
                rating_value := rating_value + FLOOR(deviation * 0.3);
            END;
            
            -- Ensure rating doesn't go below 800 or above current_rating + 100
            rating_value := GREATEST(800, LEAST(current_rating + 100, rating_value));
        END;
        
        -- Create a match for this date
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
            tournament_id_val,
            leonid_id,
            opponent_id,
            CASE WHEN is_winner THEN leonid_id ELSE opponent_id END,
            'completed',
            match_date,
            match_date + INTERVAL '30 minutes',
            'Group Stage',
            match_date
        ) RETURNING id INTO match_id_val;
        
        -- Insert rating history
        INSERT INTO player_rating_history (
            player_id,
            rating,
            recorded_at,
            match_id
        ) VALUES (
            leonid_id,
            rating_value,
            match_date,
            match_id_val
        );
        
        IF i % 10 = 0 OR i = 1 OR i = total_points THEN
            RAISE NOTICE 'Point %: rating % at %', i, rating_value, match_date;
        END IF;
    END LOOP;
    
    -- Add final point with current rating
    INSERT INTO player_rating_history (
        player_id,
        rating,
        recorded_at
    ) VALUES (
        leonid_id,
        current_rating,
        CURRENT_TIMESTAMP
    );
    
    -- Update player stats
    UPDATE players 
    SET 
        rating = current_rating,
        games_played = (SELECT COUNT(*) FROM matches WHERE player1_id = leonid_id OR player2_id = leonid_id),
        wins = (SELECT COUNT(*) FROM matches WHERE winner_id = leonid_id),
        losses = (SELECT COUNT(*) FROM matches WHERE (player1_id = leonid_id OR player2_id = leonid_id) AND winner_id != leonid_id AND winner_id IS NOT NULL),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = leonid_id;
    
    RAISE NOTICE 'Added rating history: % points, range %-%', total_points + 1, start_rating, current_rating;
END $$;






