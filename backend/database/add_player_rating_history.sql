-- Create table for player rating history if it doesn't exist
CREATE TABLE IF NOT EXISTS player_rating_history (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    match_id INTEGER REFERENCES matches(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_player_rating_history_player ON player_rating_history(player_id);
CREATE INDEX IF NOT EXISTS idx_player_rating_history_date ON player_rating_history(recorded_at);

-- Add rating history for leonid tkach with varying ratings over time
DO $$
DECLARE
    leonid_id INTEGER;
    current_rating INTEGER;
    start_date TIMESTAMP;
    i INTEGER;
    days_ago INTEGER;
    rating_value INTEGER;
    match_date TIMESTAMP;
    match_id_val INTEGER;
    tournament_id_val INTEGER;
    opponent_id INTEGER;
    is_winner BOOLEAN;
BEGIN
    -- Find leonid tkach user ID
    SELECT id, rating INTO leonid_id, current_rating 
    FROM players 
    WHERE username LIKE '%leonid%' OR username LIKE '%tkach%' OR full_name LIKE '%Leonid%' OR full_name LIKE '%Tkach%'
    LIMIT 1;
    
    IF leonid_id IS NULL THEN
        RAISE NOTICE 'User leonid tkach not found. Please check the username.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user ID: %, current rating: %', leonid_id, current_rating;
    
    -- Get current rating or use default
    IF current_rating IS NULL OR current_rating = 0 THEN
        current_rating := 1200;
    END IF;
    
    -- Get an opponent for matches
    SELECT id INTO opponent_id FROM players WHERE id != leonid_id LIMIT 1;
    IF opponent_id IS NULL THEN
        RAISE NOTICE 'No opponents found. Cannot create matches.';
        RETURN;
    END IF;
    
    -- Get or create a tournament
    SELECT id INTO tournament_id_val FROM tournaments LIMIT 1;
    IF tournament_id_val IS NULL THEN
        INSERT INTO tournaments (name, date, location, status, format, max_participants, current_participants)
        VALUES ('Rating History Tournament', CURRENT_DATE - INTERVAL '120 days', 'Online', 'completed', 'round-robin', 16, 2)
        RETURNING id INTO tournament_id_val;
    END IF;
    
    -- Start from 120 days ago
    start_date := CURRENT_TIMESTAMP - INTERVAL '120 days';
    
    -- Generate rating history over 120 days with realistic variations
    -- Start rating will be lower, gradually increase to current rating
    rating_value := current_rating - 200; -- Start 200 points lower
    
    -- Create 40-50 data points over 120 days
    FOR i IN 1..50 LOOP
        days_ago := 120 - (i * 2.4); -- Spread over 120 days
        match_date := CURRENT_TIMESTAMP - (INTERVAL '1 day' * days_ago);
        
        -- Calculate rating change (simulate wins and losses)
        -- More wins than losses to show upward trend
        is_winner := (i % 3) != 0; -- Win 2 out of 3 matches
        
        IF is_winner THEN
            -- Win: gain 10-25 points
            rating_value := rating_value + (10 + (i % 15));
        ELSE
            -- Loss: lose 5-15 points
            rating_value := rating_value - (5 + (i % 10));
        END IF;
        
        -- Ensure rating doesn't go below 800 or above 2000
        rating_value := GREATEST(800, LEAST(2000, rating_value));
        
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
        
        RAISE NOTICE 'Created rating history point %: rating % at %', i, rating_value, match_date;
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
    
    RAISE NOTICE 'Added rating history for user ID: %. Total points: %', leonid_id, 51;
END $$;






