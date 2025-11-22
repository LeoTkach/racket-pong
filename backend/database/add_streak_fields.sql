-- Add streak fields to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;

-- Update existing players with calculated streaks
UPDATE players p
SET 
    current_streak = COALESCE((
        SELECT COUNT(*)
        FROM (
            SELECT m.*
            FROM matches m
            WHERE (m.player1_id = p.id OR m.player2_id = p.id)
                AND m.status = 'completed'
                AND m.winner_id IS NOT NULL
            ORDER BY 
                COALESCE(m.end_time, m.start_time, (SELECT t.date FROM tournaments t WHERE t.id = m.tournament_id)) DESC
        ) recent_matches
        WHERE recent_matches.winner_id = p.id
        LIMIT (
            SELECT COUNT(*)
            FROM (
                SELECT m.*
                FROM matches m
                WHERE (m.player1_id = p.id OR m.player2_id = p.id)
                    AND m.status = 'completed'
                    AND m.winner_id IS NOT NULL
                ORDER BY 
                    COALESCE(m.end_time, m.start_time, (SELECT t.date FROM tournaments t WHERE t.id = m.tournament_id)) DESC
            ) check_matches
            WHERE check_matches.winner_id != p.id
            LIMIT 1
        )
    ), 0),
    best_streak = COALESCE((
        WITH match_results AS (
            SELECT 
                m.*,
                CASE 
                    WHEN m.winner_id = p.id THEN 1
                    ELSE 0
                END as is_win,
                ROW_NUMBER() OVER (
                    ORDER BY COALESCE(m.end_time, m.start_time, (SELECT t.date FROM tournaments t WHERE t.id = m.tournament_id)) ASC
                ) as match_order
            FROM matches m
            WHERE (m.player1_id = p.id OR m.player2_id = p.id)
                AND m.status = 'completed'
                AND m.winner_id IS NOT NULL
        ),
        streaks AS (
            SELECT 
                match_order,
                is_win,
                SUM(CASE WHEN is_win = 0 THEN 1 ELSE 0 END) OVER (ORDER BY match_order) as streak_group
            FROM match_results
        ),
        streak_lengths AS (
            SELECT 
                streak_group,
                COUNT(*) as streak_length
            FROM streaks
            WHERE is_win = 1
            GROUP BY streak_group
        )
        SELECT MAX(streak_length)
        FROM streak_lengths
    ), 0)
WHERE EXISTS (
    SELECT 1 FROM matches m 
    WHERE (m.player1_id = p.id OR m.player2_id = p.id) 
        AND m.status = 'completed'
);

