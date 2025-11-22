-- Create guest tournament players table
-- This table allows tournament participation without creating a full system account
CREATE TABLE IF NOT EXISTS guest_tournament_players (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    country VARCHAR(50) NOT NULL,
    skill_level VARCHAR(20) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    additional_info TEXT,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registered_by_organizer BOOLEAN DEFAULT FALSE,
    -- Track if they should receive emails
    send_notifications BOOLEAN DEFAULT TRUE,
    UNIQUE(tournament_id, email)
);

-- Update tournament_participants to support both system players and guest players
-- Add a nullable player_id and nullable guest_player_id
-- At least one must be present
ALTER TABLE tournament_participants 
    ADD COLUMN IF NOT EXISTS guest_player_id INTEGER REFERENCES guest_tournament_players(id) ON DELETE CASCADE,
    ALTER COLUMN player_id DROP NOT NULL;

-- Add constraint to ensure at least one player type is specified
ALTER TABLE tournament_participants
    ADD CONSTRAINT player_type_check CHECK (
        (player_id IS NOT NULL AND guest_player_id IS NULL) OR
        (player_id IS NULL AND guest_player_id IS NOT NULL)
    );

-- Update the unique constraint to handle both player types
ALTER TABLE tournament_participants
    DROP CONSTRAINT IF EXISTS tournament_participants_tournament_id_player_id_key;

-- Create partial unique indexes for each player type
CREATE UNIQUE INDEX IF NOT EXISTS tournament_participants_tournament_player_unique 
    ON tournament_participants(tournament_id, player_id) 
    WHERE player_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tournament_participants_tournament_guest_unique 
    ON tournament_participants(tournament_id, guest_player_id) 
    WHERE guest_player_id IS NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_players_tournament ON guest_tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_guest_players_email ON guest_tournament_players(email);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_guest ON tournament_participants(guest_player_id);

-- Create a view to easily see all tournament participants (both types)
CREATE OR REPLACE VIEW tournament_all_participants AS
SELECT 
    tp.id,
    tp.tournament_id,
    tp.player_id,
    tp.guest_player_id,
    CASE 
        WHEN tp.player_id IS NOT NULL THEN 'system'
        ELSE 'guest'
    END as player_type,
    CASE 
        WHEN tp.player_id IS NOT NULL THEN p.full_name
        ELSE CONCAT(gtp.first_name, ' ', gtp.last_name)
    END as full_name,
    CASE 
        WHEN tp.player_id IS NOT NULL THEN p.email
        ELSE gtp.email
    END as email,
    CASE 
        WHEN tp.player_id IS NOT NULL THEN p.country
        ELSE gtp.country
    END as country,
    CASE 
        WHEN tp.player_id IS NOT NULL THEN p.rating
        ELSE NULL
    END as rating,
    tp.registered_at
FROM tournament_participants tp
LEFT JOIN players p ON tp.player_id = p.id
LEFT JOIN guest_tournament_players gtp ON tp.guest_player_id = gtp.id;
