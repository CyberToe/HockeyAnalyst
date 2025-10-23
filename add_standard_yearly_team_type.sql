-- Add STANDARD_YEARLY to TeamType enum
-- This script adds the missing STANDARD_YEARLY team type to the existing enum

-- First, add the new value to the enum
ALTER TYPE "TeamType" ADD VALUE 'STANDARD_YEARLY';

-- Update the constraint to include the new value
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_type_check;
ALTER TABLE teams ADD CONSTRAINT teams_type_check CHECK (type IN ('BASIC_FREE', 'STANDARD_MONTHLY', 'STANDARD_YEARLY'));

-- Verify the enum now includes all three values
SELECT unnest(enum_range(NULL::"TeamType")) as team_types;
