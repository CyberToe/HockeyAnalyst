-- Manual fix for adding STANDARD_YEARLY to existing TeamType enum
-- Run this SQL directly in your database

-- Step 1: Add the new value to the existing enum
ALTER TYPE "TeamType" ADD VALUE 'STANDARD_YEARLY';

-- Step 2: Verify it was added (optional - you can run this to check)
SELECT unnest(enum_range(NULL::"TeamType")) as team_types;

-- Step 3: If you have any constraints that need updating, run this:
-- (Only run if you get constraint errors)
-- ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_type_check;
-- ALTER TABLE teams ADD CONSTRAINT teams_type_check CHECK (type IN ('BASIC_FREE', 'STANDARD_MONTHLY', 'STANDARD_YEARLY'));
