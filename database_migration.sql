-- Add new columns to teams table
ALTER TABLE teams ADD COLUMN image_url VARCHAR(255);
ALTER TABLE teams ADD COLUMN type VARCHAR(50) DEFAULT 'BASIC_FREE';
ALTER TABLE teams ADD COLUMN state VARCHAR(50) DEFAULT 'ACTIVE';

-- Create enum types for PostgreSQL
CREATE TYPE "TeamType" AS ENUM ('BASIC_FREE', 'STANDARD_MONTHLY', 'STANDARD_YEARLY');
CREATE TYPE "TeamState" AS ENUM ('ACTIVE', 'DISABLED');

-- Update the columns to use the enum types
ALTER TABLE teams ALTER COLUMN type TYPE "TeamType" USING type::"TeamType";
ALTER TABLE teams ALTER COLUMN state TYPE "TeamState" USING state::"TeamState";

-- Add constraints to ensure valid values
ALTER TABLE teams ADD CONSTRAINT teams_type_check CHECK (type IN ('BASIC_FREE', 'STANDARD_MONTHLY', 'STANDARD_YEARLY'));
ALTER TABLE teams ADD CONSTRAINT teams_state_check CHECK (state IN ('ACTIVE', 'DISABLED'));

-- Update existing records to have default values
UPDATE teams SET type = 'BASIC_FREE' WHERE type IS NULL;
UPDATE teams SET state = 'ACTIVE' WHERE state IS NULL;

-- Make the new columns NOT NULL (after setting defaults)
ALTER TABLE teams ALTER COLUMN type SET NOT NULL;
ALTER TABLE teams ALTER COLUMN state SET NOT NULL;
