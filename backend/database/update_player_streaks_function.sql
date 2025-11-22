-- Function to recalculate streaks for a player
CREATE OR REPLACE FUNCTION recalculate_player_streaks(player_id INTEGER)
RETURNS VOID AS $func$
DECLARE
    current_streak_val INTEGER := 0;
    best_streak_val INTEGER := 0;
    running_streak INTEGER := 0;
    match_record RECORD;
BEGIN
    -- Calculate current streak (from most recent matches)
    -- Sort by date DESC, then by ID DESC (simpler sorting without rounds)
    FOR match_record IN
        SELECT 
            m.*,
            CASE WHEN m.winner_id = player_id THEN 1 ELSE 0 END as is_win
        FROM matches m
        WHERE (m.player1_id = player_id OR m.player2_id = player_id)
            AND m.status = 'completed'
            AND m.winner_id IS NOT NULL
        ORDER BY 
            COALESCE(m.end_time, m.start_time, (SELECT t.date FROM tournaments t WHERE t.id = m.tournament_id)) DESC,
            m.id DESC
    LOOP
        IF match_record.is_win = 1 THEN
            current_streak_val := current_streak_val + 1;
        ELSE
            EXIT; -- Stop at first loss
        END IF;
    END LOOP;
    
    -- Calculate best streak (across all matches, from oldest to newest)
    -- Sort by date ASC, then by ID ASC (simpler sorting without rounds)
    running_streak := 0;
    FOR match_record IN
        SELECT 
            m.*,
            CASE WHEN m.winner_id = player_id THEN 1 ELSE 0 END as is_win
        FROM matches m
        WHERE (m.player1_id = player_id OR m.player2_id = player_id)
            AND m.status = 'completed'
            AND m.winner_id IS NOT NULL
        ORDER BY 
            COALESCE(m.end_time, m.start_time, (SELECT t.date FROM tournaments t WHERE t.id = m.tournament_id)) ASC,
            m.id ASC
    LOOP
        IF match_record.is_win = 1 THEN
            running_streak := running_streak + 1;
            best_streak_val := GREATEST(best_streak_val, running_streak);
        ELSE
            running_streak := 0;
        END IF;
    END LOOP;
    
    -- Update player record
    UPDATE players
    SET 
        current_streak = current_streak_val,
        best_streak = best_streak_val,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = player_id;
END;
$func$ LANGUAGE plpgsql;

