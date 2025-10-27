-- Hockey Assistant Database Setup Script
-- Run this script to set up the PostgreSQL database for the Hockey Assistant application

-- Create database (run as superuser)
-- CREATE DATABASE hockey_analytics;

-- Connect to the database
-- \c hockey_analytics;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
    CREATE TYPE member_role AS ENUM ('member', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attacking_direction') THEN
    CREATE TYPE attacking_direction AS ENUM ('left', 'right');
  END IF;
END$$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  team_code varchar(7) NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

-- Team membership table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  number integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, name)
);

-- Ensure number uniqueness per team when number is not null
CREATE UNIQUE INDEX IF NOT EXISTS players_team_number_unique
  ON players(team_id, number)
  WHERE number IS NOT NULL;

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent text,
  location text,
  start_time timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

-- Periods table
CREATE TABLE IF NOT EXISTS periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  period_number smallint NOT NULL CHECK (period_number BETWEEN 1 AND 3),
  attacking_direction attacking_direction,
  started_at timestamptz,
  ended_at timestamptz,
  UNIQUE(game_id, period_number)
);

-- Shots table
CREATE TABLE IF NOT EXISTS shots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  shooter_player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  x_coord double precision NOT NULL,
  y_coord double precision NOT NULL,
  scored boolean NOT NULL DEFAULT false,
  scored_against boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  taken_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_team ON games(team_id);
CREATE INDEX IF NOT EXISTS idx_shots_game ON shots(game_id);
CREATE INDEX IF NOT EXISTS idx_shots_period ON shots(period_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_periods_game ON periods(game_id);

-- Helper function to generate unique team codes
CREATE OR REPLACE FUNCTION generate_team_code(len integer DEFAULT 7)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  charset text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
BEGIN
  IF len < 4 THEN
    RAISE EXCEPTION 'team code length must be >= 4';
  END IF;

  LOOP
    candidate := '';
    FOR i IN 1..len LOOP
      candidate := candidate || substr(charset, (1 + floor(random() * length(charset)))::int, 1);
    END LOOP;

    IF NOT EXISTS (SELECT 1 FROM teams WHERE team_code = candidate) THEN
      RETURN candidate;
    END IF;
  END LOOP;
END;
$$;

-- Trigger to assign team code on insert
CREATE OR REPLACE FUNCTION teams_assign_code_if_null()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.team_code IS NULL OR trim(NEW.team_code) = '' THEN
    NEW.team_code := generate_team_code(7);
  ELSE
    NEW.team_code := upper(substr(trim(NEW.team_code), 1, 7));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER IF NOT EXISTS trg_teams_assign_code
BEFORE INSERT ON teams
FOR EACH ROW
EXECUTE FUNCTION teams_assign_code_if_null();

-- Trigger to create 3 periods when a game is inserted
CREATE OR REPLACE FUNCTION games_insert_create_periods()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  i int;
BEGIN
  FOR i IN 1..3 LOOP
    INSERT INTO periods (game_id, period_number)
    VALUES (NEW.id, i);
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER IF NOT EXISTS trg_games_create_periods
AFTER INSERT ON games
FOR EACH ROW
EXECUTE FUNCTION games_insert_create_periods();

-- Function to add user to team by code
CREATE OR REPLACE FUNCTION add_user_to_team_by_code(p_user_id uuid, p_team_code text)
RETURNS TABLE(team_id uuid, role member_role) LANGUAGE plpgsql AS $$
DECLARE
  v_team teams%ROWTYPE;
BEGIN
  SELECT * INTO v_team FROM teams WHERE team_code = upper(trim(p_team_code)) AND NOT deleted;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team with that code not found or has been deleted';
  END IF;

  IF EXISTS (SELECT 1 FROM team_members WHERE team_id = v_team.id AND user_id = p_user_id) THEN
    RETURN QUERY SELECT v_team.id, (SELECT role FROM team_members WHERE team_id = v_team.id AND user_id = p_user_id);
    RETURN;
  END IF;

  INSERT INTO team_members (team_id, user_id, role)
  VALUES (v_team.id, p_user_id, 'member');

  RETURN QUERY SELECT v_team.id, 'member'::member_role;
END;
$$;

-- Function to make user admin
CREATE OR REPLACE FUNCTION make_user_admin(p_team_id uuid, p_actor_user_id uuid, p_target_user_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  actor_role member_role;
BEGIN
  SELECT role INTO actor_role FROM team_members WHERE team_id = p_team_id AND user_id = p_actor_user_id;
  IF NOT FOUND OR actor_role <> 'admin' THEN
    RAISE EXCEPTION 'Only an admin can promote another user to admin';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM team_members WHERE team_id = p_team_id AND user_id = p_target_user_id) THEN
    RAISE EXCEPTION 'Target user is not a member of the team';
  END IF;

  UPDATE team_members
  SET role = 'admin'
  WHERE team_id = p_team_id AND user_id = p_target_user_id;
END;
$$;

-- Function to delete or leave team
CREATE OR REPLACE FUNCTION delete_or_leave_team(p_team_id uuid, p_actor_user_id uuid, p_confirm boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_role member_role;
  v_member_count int;
BEGIN
  SELECT role INTO v_role FROM team_members WHERE team_id = p_team_id AND user_id = p_actor_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Actor is not a member of this team';
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM team_members WHERE team_id = p_team_id;

  IF v_role = 'admin' THEN
    IF v_member_count > 1 THEN
      IF NOT p_confirm THEN
        RAISE EXCEPTION 'Team has % members. To delete the team entirely you must pass confirm = true. If you only want to leave, remove yourself via leave operation.', v_member_count;
      END IF;
      DELETE FROM teams WHERE id = p_team_id;
      RETURN;
    ELSE
      IF NOT p_confirm THEN
        RAISE EXCEPTION 'This team only has one member. Deleting the team will remove it permanently. Pass confirm = true to proceed.';
      END IF;
      DELETE FROM teams WHERE id = p_team_id;
      RETURN;
    END IF;
  ELSE
    DELETE FROM team_members WHERE team_id = p_team_id AND user_id = p_actor_user_id;
    RETURN;
  END IF;
END;
$$;

-- Validation function for shots
CREATE OR REPLACE FUNCTION shots_validate_shooter_belongs_to_team()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_game_team uuid;
  v_player_team uuid;
BEGIN
  SELECT team_id INTO v_game_team FROM games WHERE id = NEW.game_id;
  IF NEW.shooter_player_id IS NOT NULL THEN
    SELECT team_id INTO v_player_team FROM players WHERE id = NEW.shooter_player_id;
    IF v_player_team IS NULL THEN
      RAISE EXCEPTION 'Invalid shooter_player_id: player not found';
    END IF;
    IF v_player_team <> v_game_team THEN
      RAISE EXCEPTION 'Player does not belong to the same team as the game';
    END IF;
  END IF;

  IF NEW.period_id IS NOT NULL THEN
    PERFORM 1 FROM periods WHERE id = NEW.period_id AND game_id = NEW.game_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'period_id does not belong to the same game';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER IF NOT EXISTS trg_shots_validate
BEFORE INSERT OR UPDATE ON shots
FOR EACH ROW
EXECUTE FUNCTION shots_validate_shooter_belongs_to_team();

-- Convenience view for team members
CREATE OR REPLACE VIEW team_member_roles AS
SELECT t.id AS team_id, t.name AS team_name, u.id AS user_id, u.email, tm.role, tm.joined_at
FROM teams t
JOIN team_members tm ON tm.team_id = t.id
JOIN users u ON u.id = tm.user_id;

-- Insert sample data for testing (optional)
-- Uncomment the following lines to create sample data

-- INSERT INTO users (email, password_hash, display_name) VALUES 
-- ('admin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6L6xW7J7L6', 'Admin User'),
-- ('coach@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6L6xW7J7L6', 'Coach Smith');

-- Get the admin user ID for sample team creation
-- DO $$
-- DECLARE
--   admin_user_id uuid;
--   sample_team_id uuid;
-- BEGIN
--   SELECT id INTO admin_user_id FROM users WHERE email = 'admin@example.com';
--   
--   -- Create sample team
--   INSERT INTO teams (name, description, created_by) VALUES 
--   ('Sample Hockey Team', 'A sample team for testing the application', admin_user_id)
--   RETURNING id INTO sample_team_id;
--   
--   -- Add sample players
--   INSERT INTO players (team_id, name, number) VALUES 
--   (sample_team_id, 'John Smith', 1),
--   (sample_team_id, 'Mike Johnson', 2),
--   (sample_team_id, 'David Wilson', 3);
-- END $$;

COMMIT;
