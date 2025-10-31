-- Migration: Add rink dimensions to shots table
-- This migration adds optional rink_width and rink_height columns to store
-- the canvas dimensions when a shot was recorded, allowing shots to be
-- properly scaled and positioned across different screen sizes.

-- Add rink_width column
ALTER TABLE shots 
ADD COLUMN IF NOT EXISTS rink_width DOUBLE PRECISION;

-- Add rink_height column
ALTER TABLE shots 
ADD COLUMN IF NOT EXISTS rink_height DOUBLE PRECISION;

-- Add comment for documentation
COMMENT ON COLUMN shots.rink_width IS 'Width of the rink canvas when the shot was recorded';
COMMENT ON COLUMN shots.rink_height IS 'Height of the rink canvas when the shot was recorded';

