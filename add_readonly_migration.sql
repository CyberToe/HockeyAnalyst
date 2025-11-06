-- Migration to add read_only field to team_members table
-- This field defaults to true, meaning new members are read-only by default
-- Only team owners (admins) can change this field
-- Owners cannot be set as read-only

-- Add read_only column with default value of true
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS read_only BOOLEAN NOT NULL DEFAULT true;

-- Update existing members: if they are admins, set read_only to false
-- Regular members will remain read-only (true) by default
UPDATE team_members 
SET read_only = false 
WHERE role = 'admin';

-- Add comment to explain the field
COMMENT ON COLUMN team_members.read_only IS 'If true, member cannot enter games to add statistics or update players. Only owners can modify this field. Owners cannot be read-only.';

