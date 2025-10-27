-- Add player type column to players table
-- This migration adds a new 'type' column to distinguish between team players and substitutes

-- Add the player_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'player_type') THEN
    CREATE TYPE player_type AS ENUM ('TEAM_PLAYER', 'SUBSTITUTE');
  END IF;
END$$;

-- Add the type column to the players table with default value
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS type player_type NOT NULL DEFAULT 'TEAM_PLAYER';

-- Add a comment to explain the column
COMMENT ON COLUMN players.type IS 'Player type: TEAM_PLAYER for regular team members, SUBSTITUTE for substitute players';
