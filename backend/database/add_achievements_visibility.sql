-- Migration: Add achievements_visibility column to user_settings table
-- Run this if you already have user_settings table without achievements_visibility

-- Add achievements_visibility column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        AND column_name = 'achievements_visibility'
    ) THEN
        ALTER TABLE user_settings 
        ADD COLUMN achievements_visibility BOOLEAN DEFAULT true;
        
        -- Update existing rows to have achievements_visibility = true by default
        UPDATE user_settings 
        SET achievements_visibility = true 
        WHERE achievements_visibility IS NULL;
    END IF;
END $$;


