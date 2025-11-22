-- Add tournament_id column to player_rating_history for easier queries
-- This allows direct access to tournament information without JOIN

-- Step 1: Add tournament_id column (nullable initially)
ALTER TABLE player_rating_history 
ADD COLUMN IF NOT EXISTS tournament_id INTEGER REFERENCES tournaments(id) ON DELETE SET NULL;

-- Step 2: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_player_rating_history_tournament 
ON player_rating_history(tournament_id);

-- Step 3: Update existing records to populate tournament_id from matches
UPDATE player_rating_history prh
SET tournament_id = m.tournament_id
FROM matches m
WHERE prh.match_id = m.id
  AND prh.tournament_id IS NULL;

-- Step 4: Add comment
COMMENT ON COLUMN player_rating_history.tournament_id IS 'Tournament ID - populated from match_id for easier querying';


