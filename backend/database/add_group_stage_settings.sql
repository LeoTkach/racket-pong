-- Add group stage settings to tournaments table
-- These fields are used when format = 'group-stage'

ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS num_groups INTEGER,
ADD COLUMN IF NOT EXISTS players_per_group_advance INTEGER;

-- Add comments
COMMENT ON COLUMN tournaments.num_groups IS 'Number of groups for group-stage tournaments';
COMMENT ON COLUMN tournaments.players_per_group_advance IS 'Number of players advancing from each group to playoffs';




