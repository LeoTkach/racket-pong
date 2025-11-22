-- Update existing achievements in the database
-- This script updates the descriptions and names of achievements that have been changed

-- Update Tournament Enthusiast: from 25 to 10 tournaments
UPDATE achievements 
SET description = 'Join 10 tournaments'
WHERE name = 'Tournament Enthusiast';

-- Update Win Streak: from 10 to 5 matches
UPDATE achievements 
SET description = 'Win 5 matches in a row'
WHERE name = 'Win Streak';

-- Rename Digital Master/Online Champion to Match Master and update description: from 100 to 30 wins, remove "online"
UPDATE achievements 
SET name = 'Match Master', description = 'Achieve 30 wins in tournament matches'
WHERE name = 'Digital Master' OR name = 'Online Champion';

-- Update Legend: change from time-based to match-based achievement
UPDATE achievements 
SET description = 'Win 10 tournament matches'
WHERE name = 'Legend';

-- Update Veteran: from 6 months to 1 month
UPDATE achievements 
SET description = 'Play for 1 month'
WHERE name = 'Veteran';

-- Update Newcomer: from 1 month to 1 week
UPDATE achievements 
SET description = 'Play for 1 week'
WHERE name = 'Newcomer';

-- Update Lightning Fast: change from time-based to tournament-based (time not tracked)
UPDATE achievements 
SET description = 'Win 3 matches in a single tournament'
WHERE name = 'Lightning Fast';

-- Update Path Finder: from "3 different" to "all" tournament formats
UPDATE achievements 
SET description = 'Complete all tournament formats'
WHERE name = 'Path Finder';

-- Update Regular Player: change to avoid conflict with Veteran (both were "Play for 6 months")
UPDATE achievements 
SET description = 'Play in 3 tournaments'
WHERE name = 'Regular Player';

-- Update Social Butterfly: from 50 to 10 different opponents
UPDATE achievements 
SET description = 'Play against 10 different opponents'
WHERE name = 'Social Butterfly';

-- Update Podium Master: now represents the "paper champion" who loses in the final
UPDATE achievements 
SET description = 'Reach the tournament final but lose'
WHERE name = 'Podium Master';

-- Update Champion: now awarded for winning a professional tournament
UPDATE achievements 
SET description = 'Win a professional tournament'
WHERE name = 'Champion';

-- Remove deprecated Globetrotter achievement
DELETE FROM achievements 
WHERE name = 'Globetrotter';

