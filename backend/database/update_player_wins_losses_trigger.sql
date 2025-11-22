-- Trigger function to automatically update player wins/losses when matches change
CREATE OR REPLACE FUNCTION update_player_wins_losses()
RETURNS TRIGGER AS $func$
DECLARE
    old_winner_id INTEGER;
    new_winner_id INTEGER;
    player1_id_val INTEGER;
    player2_id_val INTEGER;
    old_status VARCHAR(20);
    new_status VARCHAR(20);
    old_loser_id INTEGER;
    loser_id INTEGER;
BEGIN
    -- Get old values (if UPDATE)
    IF TG_OP = 'UPDATE' THEN
        old_winner_id := OLD.winner_id;
        old_status := OLD.status;
        player1_id_val := COALESCE(NEW.player1_id, OLD.player1_id);
        player2_id_val := COALESCE(NEW.player2_id, OLD.player2_id);
    ELSE
        -- For INSERT, old values don't exist
        old_winner_id := NULL;
        old_status := NULL;
        player1_id_val := NEW.player1_id;
        player2_id_val := NEW.player2_id;
    END IF;
    
    new_winner_id := NEW.winner_id;
    new_status := NEW.status;
    
    -- Only process completed matches with a winner
    IF new_status = 'completed' AND new_winner_id IS NOT NULL AND player1_id_val IS NOT NULL AND player2_id_val IS NOT NULL THEN
        -- If this is an UPDATE and winner changed, we need to update both old and new winners
        IF TG_OP = 'UPDATE' AND old_winner_id IS NOT NULL AND old_winner_id != new_winner_id THEN
            -- Decrement wins for old winner
            UPDATE players 
            SET wins = GREATEST(0, wins - 1),
                games_played = GREATEST(0, games_played - 1),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = old_winner_id;
            
            -- Find the old loser (the other player)
            old_loser_id := CASE 
                WHEN old_winner_id = player1_id_val THEN player2_id_val 
                ELSE player1_id_val 
            END;
            
            -- Decrement losses for old loser
            UPDATE players 
            SET losses = GREATEST(0, losses - 1),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = old_loser_id;
        END IF;
        
        -- Increment wins for new winner
        UPDATE players 
        SET wins = wins + 1,
            games_played = games_played + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = new_winner_id;
        
        -- Find the loser (the other player)
        loser_id := CASE 
            WHEN new_winner_id = player1_id_val THEN player2_id_val 
            ELSE player1_id_val 
        END;
        
        -- Increment losses for loser
        UPDATE players 
        SET losses = losses + 1,
            games_played = games_played + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = loser_id;
        
        -- Update win_rate for both players
        UPDATE players 
        SET win_rate = CASE 
            WHEN games_played > 0 THEN (wins::NUMERIC / games_played::NUMERIC * 100)
            ELSE 0
        END,
        updated_at = CURRENT_TIMESTAMP
        WHERE id IN (new_winner_id, loser_id);
        
        -- Recalculate streaks for both players
        PERFORM recalculate_player_streaks(new_winner_id);
        PERFORM recalculate_player_streaks(loser_id);
        
    ELSIF TG_OP = 'UPDATE' AND old_status = 'completed' AND old_winner_id IS NOT NULL 
          AND (new_status != 'completed' OR new_winner_id IS NULL) THEN
        -- Match was completed but now is not (reset or cancelled)
        -- Decrement wins for old winner
        UPDATE players 
        SET wins = GREATEST(0, wins - 1),
            games_played = GREATEST(0, games_played - 1),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = old_winner_id;
        
        -- Find the old loser
        old_loser_id := CASE 
            WHEN old_winner_id = COALESCE(NEW.player1_id, OLD.player1_id) 
            THEN COALESCE(NEW.player2_id, OLD.player2_id)
            ELSE COALESCE(NEW.player1_id, OLD.player1_id)
        END;
        
        -- Decrement losses for old loser
        UPDATE players 
        SET losses = GREATEST(0, losses - 1),
            games_played = GREATEST(0, games_played - 1),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = old_loser_id;
        
        -- Update win_rate for both players
        UPDATE players 
        SET win_rate = CASE 
            WHEN games_played > 0 THEN (wins::NUMERIC / games_played::NUMERIC * 100)
            ELSE 0
        END,
        updated_at = CURRENT_TIMESTAMP
        WHERE id IN (old_winner_id, old_loser_id);
        
        -- Recalculate streaks for both players
        PERFORM recalculate_player_streaks(old_winner_id);
        PERFORM recalculate_player_streaks(old_loser_id);
    ELSIF TG_OP = 'INSERT' AND new_status = 'completed' AND new_winner_id IS NOT NULL 
          AND player1_id_val IS NOT NULL AND player2_id_val IS NOT NULL THEN
        -- New completed match - increment wins/losses
        UPDATE players 
        SET wins = wins + 1,
            games_played = games_played + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = new_winner_id;
        
        -- Find the loser
        loser_id := CASE 
            WHEN new_winner_id = player1_id_val THEN player2_id_val 
            ELSE player1_id_val 
        END;
        
        -- Increment losses for loser
        UPDATE players 
        SET losses = losses + 1,
            games_played = games_played + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = loser_id;
        
        -- Update win_rate for both players
        UPDATE players 
        SET win_rate = CASE 
            WHEN games_played > 0 THEN (wins::NUMERIC / games_played::NUMERIC * 100)
            ELSE 0
        END,
        updated_at = CURRENT_TIMESTAMP
        WHERE id IN (new_winner_id, loser_id);
        
        -- Recalculate streaks for both players
        PERFORM recalculate_player_streaks(new_winner_id);
        PERFORM recalculate_player_streaks(loser_id);
    END IF;
    
    RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_player_wins_losses ON matches;

-- Create trigger
CREATE TRIGGER trigger_update_player_wins_losses
    AFTER INSERT OR UPDATE OF winner_id, status, player1_id, player2_id ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_player_wins_losses();

