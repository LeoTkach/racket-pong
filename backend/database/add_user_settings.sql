-- Add user settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES players(id) ON DELETE CASCADE UNIQUE,
    
    -- Account settings
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'utc+0',
    
    -- Notification settings
    tournament_notifications BOOLEAN DEFAULT true,
    match_notifications BOOLEAN DEFAULT true,
    achievement_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    
    -- Privacy settings
    profile_visibility BOOLEAN DEFAULT true,
    stats_visibility BOOLEAN DEFAULT true,
    match_history_visibility BOOLEAN DEFAULT false,
    achievements_visibility BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add achievements_visibility column if it doesn't exist (for existing databases)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'achievements_visibility'
    ) THEN
        ALTER TABLE user_settings 
        ADD COLUMN achievements_visibility BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Trigger for updating timestamps
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
