-- Trigger function to automatically update max_points and best_ranking
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $func$
DECLARE
    current_points INTEGER;
    current_ranking INTEGER;
BEGIN
    -- Calculate current points
    current_points := NEW.wins * 3 + NEW.losses * 1;
    
    -- Update max_points (keep the maximum)
    NEW.max_points := GREATEST(COALESCE(OLD.max_points, 0), current_points);
    
    -- Determine current ranking
    IF NEW.ranking > 0 THEN
        current_ranking := NEW.ranking;
    ELSIF NEW.rank > 0 THEN
        current_ranking := NEW.rank;
    ELSE
        current_ranking := NULL;
    END IF;
    
    -- Update best_ranking (keep the minimum, as lower rank number is better)
    IF current_ranking IS NOT NULL THEN
        IF OLD.best_ranking IS NULL THEN
            NEW.best_ranking := current_ranking;
        ELSIF current_ranking < OLD.best_ranking THEN
            NEW.best_ranking := current_ranking;
        ELSE
            NEW.best_ranking := OLD.best_ranking;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_player_stats ON players;

-- Create trigger
CREATE TRIGGER trigger_update_player_stats
    BEFORE UPDATE OF wins, losses, ranking, rank ON players
    FOR EACH ROW
    WHEN (OLD.wins IS DISTINCT FROM NEW.wins OR 
          OLD.losses IS DISTINCT FROM NEW.losses OR
          OLD.ranking IS DISTINCT FROM NEW.ranking OR
          OLD.rank IS DISTINCT FROM NEW.rank)
    EXECUTE FUNCTION update_player_stats();

