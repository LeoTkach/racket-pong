-- Create notifications table for user notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES players(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'tournament', 'match', 'achievement', 'system'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    link_url TEXT, -- Optional link to related page (tournament, match, etc.)
    metadata JSONB, -- Additional data (tournament_id, match_id, achievement_id, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;


