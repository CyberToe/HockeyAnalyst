-- Diagnostic script to check database structure
-- Run this to see what tables and columns exist

-- Check if tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('games', 'players', 'teams', 'users')
ORDER BY table_name;

-- Check games table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'games' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check players table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'players' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if player_type enum exists
SELECT 
  typname,
  typtype,
  typcategory
FROM pg_type 
WHERE typname = 'player_type';

-- Check if games table has any data
SELECT COUNT(*) as game_count FROM games;

-- Check if players table has any data
SELECT COUNT(*) as player_count FROM players;
