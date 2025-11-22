-- Add display_order column to achievements table
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 999;

-- Set display order for achievements according to the specified order
UPDATE achievements SET display_order = 1 WHERE name = 'Newcomer';
UPDATE achievements SET display_order = 2 WHERE name = 'Veteran';
UPDATE achievements SET display_order = 3 WHERE name = 'Jungle Explorer';
UPDATE achievements SET display_order = 4 WHERE name = 'First Victory';
UPDATE achievements SET display_order = 5 WHERE name = 'Legend';
UPDATE achievements SET display_order = 6 WHERE name = 'Match Master';
UPDATE achievements SET display_order = 7 WHERE name = 'Regular Player';
UPDATE achievements SET display_order = 8 WHERE name = 'Community Member';
UPDATE achievements SET display_order = 9 WHERE name = 'Tournament Enthusiast';
UPDATE achievements SET display_order = 10 WHERE name = 'Path Finder';
UPDATE achievements SET display_order = 11 WHERE name = 'Social Butterfly';
UPDATE achievements SET display_order = 12 WHERE name = 'Perfect Game';
UPDATE achievements SET display_order = 13 WHERE name = 'Comeback King';
UPDATE achievements SET display_order = 14 WHERE name = 'Undefeated';
UPDATE achievements SET display_order = 15 WHERE name = 'Champion';
UPDATE achievements SET display_order = 16 WHERE name = 'Win Streak';
UPDATE achievements SET display_order = 17 WHERE name = 'Podium Master';
UPDATE achievements SET display_order = 18 WHERE name = 'Lightning Fast';


