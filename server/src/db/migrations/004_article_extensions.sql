-- Add Header Image to Articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS header_image VARCHAR(512);
