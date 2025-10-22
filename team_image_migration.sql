-- Add team image column to teams table
ALTER TABLE teams ADD COLUMN image_url VARCHAR(500);

-- Add comment to document the column
COMMENT ON COLUMN teams.image_url IS 'URL or base64 data for team image';

-- Create an index on image_url for better query performance (optional)
CREATE INDEX idx_teams_image_url ON teams(image_url) WHERE image_url IS NOT NULL;

-- Update any existing teams to have NULL image_url (they will use default icon)
-- This is optional but ensures consistency
UPDATE teams SET image_url = NULL WHERE image_url IS NULL;
