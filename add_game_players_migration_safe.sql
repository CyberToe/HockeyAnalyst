-- Add game_players table for game-specific player rosters
-- This table stores which players are included in each game and their game-specific jersey numbers

-- First, check if the required tables exist
DO $$
BEGIN
  -- Check if games table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'games') THEN
    RAISE EXCEPTION 'games table does not exist. Please run the main schema migration first.';
  END IF;
  
  -- Check if players table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'players') THEN
    RAISE EXCEPTION 'players table does not exist. Please run the main schema migration first.';
  END IF;
  
  -- Check if player_type enum exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'player_type') THEN
    RAISE EXCEPTION 'player_type enum does not exist. Please run the player type migration first.';
  END IF;
END$$;

-- Create the game_players table
CREATE TABLE IF NOT EXISTS game_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL,
  player_id uuid NOT NULL,
  included boolean NOT NULL DEFAULT true,
  number integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(game_id, player_id)
);

-- Add foreign key constraints separately to avoid issues
DO $$
BEGIN
  -- Add foreign key to games table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'game_players_game_id_fkey'
  ) THEN
    ALTER TABLE game_players 
    ADD CONSTRAINT game_players_game_id_fkey 
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE;
  END IF;
  
  -- Add foreign key to players table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'game_players_player_id_fkey'
  ) THEN
    ALTER TABLE game_players 
    ADD CONSTRAINT game_players_player_id_fkey 
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;
  END IF;
END$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_player_id ON game_players(player_id);
CREATE INDEX IF NOT EXISTS idx_game_players_included ON game_players(included);

-- Add a comment to explain the table
COMMENT ON TABLE game_players IS 'Game-specific player rosters with inclusion status and jersey numbers';
COMMENT ON COLUMN game_players.included IS 'Whether the player is included in this game (checked by default for team players)';
COMMENT ON COLUMN game_players.number IS 'Jersey number for this specific game (can differ from player default number)';

-- Create a function to automatically populate game_players when a new game is created
-- This will be called from the application when creating games
CREATE OR REPLACE FUNCTION populate_game_players(game_uuid uuid, team_uuid uuid)
RETURNS void AS $$
BEGIN
  -- Insert all team players as included by default
  INSERT INTO game_players (game_id, player_id, included, number)
  SELECT 
    game_uuid,
    p.id,
    CASE WHEN p.type = 'TEAM_PLAYER' THEN true ELSE false END,
    p.number
  FROM players p
  WHERE p.team_id = team_uuid;
END;
$$ LANGUAGE plpgsql;
