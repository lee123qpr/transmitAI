-- Add Keywords to Articles for categorization
ALTER TABLE articles ADD COLUMN IF NOT EXISTS keywords TEXT;
