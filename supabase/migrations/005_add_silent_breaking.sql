-- Add is_silent and is_breaking flags to changes table
ALTER TABLE changes ADD COLUMN IF NOT EXISTS is_silent boolean DEFAULT false;
ALTER TABLE changes ADD COLUMN IF NOT EXISTS is_breaking boolean DEFAULT false;
