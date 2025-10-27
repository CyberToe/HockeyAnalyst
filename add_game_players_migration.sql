-- Add game_players table for game-specific player rosters
-- This table stores which players are included in each game and their game-specific jersey numbers

-- Create the game_players table
CREATE TABLE IF NOT EXISTS game_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  included boolean NOT NULL DEFAULT true,
  number integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(game_id, player_id)
);

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
