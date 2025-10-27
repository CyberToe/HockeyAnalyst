-- Hockey assistant schema for PostgreSQL
-- Assumes pgcrypto extension available for gen_random_uuid()
-- Run as superuser or a user allowed to create extensions.

-- 1) Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2) Enum types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
    CREATE TYPE member_role AS ENUM ('member', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attacking_direction') THEN
    CREATE TYPE attacking_direction AS ENUM ('left', 'right');
  END IF;
END$$;

-- 3) Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,            -- store hashed password (bcrypt/argon2/etc.) NOT plaintext
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

-- 4) Teams table
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  team_code varchar(7) NOT NULL UNIQUE,  -- shareable code (<=7 chars)
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

-- 5) Team membership: users <-> teams; a user can belong to many teams and teams can be shared
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member', -- 'admin' or 'member'
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- 6) Players (belongs to team)
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  number integer,       -- optional
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, name) -- restrict duplicate names within a team (optional)
);

-- Partial unique index to ensure number uniqueness per team when number is not null:
CREATE UNIQUE INDEX IF NOT EXISTS players_team_number_unique
  ON players(team_id, number)
  WHERE number IS NOT NULL;

-- 7) Games (belongs to team)
CREATE TABLE games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent text,
  location text,
  start_time timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

-- 8) Periods (each game has exactly up to 3 periods: 1,2,3)
CREATE TABLE periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  period_number smallint NOT NULL CHECK (period_number BETWEEN 1 AND 3),
  attacking_direction attacking_direction,
  started_at timestamptz,
  ended_at timestamptz,
  UNIQUE(game_id, period_number)
);

-- 9) Shots captured within games/periods
CREATE TABLE shots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  shooter_player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  x_coord double precision NOT NULL,  -- pixel or normalized coordinate depending on app convention
  y_coord double precision NOT NULL,
  scored boolean NOT NULL DEFAULT false,      -- whether this shot resulted in a goal
  scored_against boolean NOT NULL DEFAULT false, -- if true: goal scored AGAINST this team
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  taken_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_games_team ON games(team_id);
CREATE INDEX IF NOT EXISTS idx_shots_game ON shots(game_id);
CREATE INDEX IF NOT EXISTS idx_shots_period ON shots(period_id);

-- 10) Helper: function to generate a unique team code (<=7 chars)
-- Returns a random alphanumeric uppercase string (length 7) and guarantees uniqueness by checking teams.team_code.
CREATE OR REPLACE FUNCTION generate_team_code(len integer DEFAULT 7)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  charset text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- avoid I, O, 0, 1 to reduce confusion
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

    -- ensure uniqueness
    IF NOT EXISTS (SELECT 1 FROM teams WHERE team_code = candidate) THEN
      RETURN candidate;
    END IF;
    -- else loop and try again
  END LOOP;
END;
$$;

-- 11) Trigger to assign a unique team code if not provided on insert
CREATE OR REPLACE FUNCTION teams_assign_code_if_null()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.team_code IS NULL OR trim(NEW.team_code) = '' THEN
    NEW.team_code := generate_team_code(7);
  ELSE
    -- enforce uppercase and length
    NEW.team_code := upper(substr(trim(NEW.team_code), 1, 7));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_teams_assign_code
BEFORE INSERT ON teams
FOR EACH ROW
EXECUTE FUNCTION teams_assign_code_if_null();

-- 12) Trigger to automatically create 3 periods when a game is inserted
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

CREATE TRIGGER trg_games_create_periods
AFTER INSERT ON games
FOR EACH ROW
EXECUTE FUNCTION games_insert_create_periods();

-- 13) Procedure to add a user to a team using the team code (shared link flow)
CREATE OR REPLACE FUNCTION add_user_to_team_by_code(p_user_id uuid, p_team_code text)
RETURNS TABLE(team_id uuid, role member_role) LANGUAGE plpgsql AS $$
DECLARE
  v_team teams%ROWTYPE;
BEGIN
  SELECT * INTO v_team FROM teams WHERE team_code = upper(trim(p_team_code)) AND NOT deleted;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team with that code not found or has been deleted';
  END IF;

  -- If already a member, return existing
  IF EXISTS (SELECT 1 FROM team_members WHERE team_id = v_team.id AND user_id = p_user_id) THEN
    RETURN QUERY SELECT v_team.id, (SELECT role FROM team_members WHERE team_id = v_team.id AND user_id = p_user_id);
    RETURN;
  END IF;

  INSERT INTO team_members (team_id, user_id, role)
  VALUES (v_team.id, p_user_id, 'member');

  RETURN QUERY SELECT v_team.id, 'member'::member_role;
END;
$$;

-- 14) Procedure to make another user admin (must be called by an existing admin)
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

-- 15) Procedure to delete a team or leave a team depending on actor role and confirmation
-- Behavior:
-- - If actor is admin:
--     - If team has only one member: deletion allowed (but require confirm=true to prevent accidental drop).
--     - If team has more than one member: require confirm=true to delete team entirely (application might instead require a UI confirmation).
-- - If actor is non-admin member: function removes only their membership (they "leave" the team).
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
      -- proceed to hard delete team (cascades)
      DELETE FROM teams WHERE id = p_team_id;
      RETURN;
    ELSE
      -- only one member (the actor)
      IF NOT p_confirm THEN
        RAISE EXCEPTION 'This team only has one member. Deleting the team will remove it permanently. Pass confirm = true to proceed.';
      END IF;
      DELETE FROM teams WHERE id = p_team_id;
      RETURN;
    END IF;
  ELSE
    -- not admin -> just remove the membership for this user (they are leaving)
    DELETE FROM team_members WHERE team_id = p_team_id AND user_id = p_actor_user_id;
    RETURN;
  END IF;
END;
$$;

-- 16) Ensure data integrity for shots: shooter must belong to same team as game
-- We'll implement a trigger to check that if shooter_player_id is provided, that player.team_id = game.team_id
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

  -- Also ensure the period belongs to the same game
  IF NEW.period_id IS NOT NULL THEN
    PERFORM 1 FROM periods WHERE id = NEW.period_id AND game_id = NEW.game_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'period_id does not belong to the same game';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_shots_validate
BEFORE INSERT OR UPDATE ON shots
FOR EACH ROW
EXECUTE FUNCTION shots_validate_shooter_belongs_to_team();

-- 17) Example convenience view: show team members and roles
CREATE OR REPLACE VIEW team_member_roles AS
SELECT t.id AS team_id, t.name AS team_name, u.id AS user_id, u.email, tm.role, tm.joined_at
FROM teams t
JOIN team_members tm ON tm.team_id = t.id
JOIN users u ON u.id = tm.user_id;

-- 18) Notes and recommended application responsibilities:
-- - Password hashing & verification should happen in the application layer; only store the hash in password_hash.
-- - UI should present the team_code to the creator and allow users to add a team using the code (use add_user_to_team_by_code()).
-- - Application should call delete_or_leave_team(team_id, actor_user_id, confirm) to ensure proper semantics.
-- - Making admin: call make_user_admin(team_id, actor_id, target_user_id).
-- - Period attacking_direction can be set/updated by authorized users.
-- - The DB enforces that periods are 1..3 per game (unique constraint + creation trigger).
-- - Business rules that require user confirmations are implemented as exceptions if confirm flag not provided;
--   the UI should catch these and show messages / confirmations to the user.

-- 19) Example: optionally create a sample admin user and team (uncomment for testing)
-- INSERT INTO users (email, password_hash, display_name) VALUES ('admin@example.com','<hash>','Admin User');
-- SELECT generate_team_code(); -- try generator
