-- Make username required and unique
-- First, update any existing profiles that have null usernames with temporary unique values

-- Update null usernames with temporary unique values based on user_id
UPDATE profiles 
SET username = 'user_' || substring(id::text, 1, 8)
WHERE username IS NULL;

-- Now add the NOT NULL constraint and unique index
ALTER TABLE profiles 
ALTER COLUMN username SET NOT NULL;

-- Create unique index on username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx 
ON profiles (LOWER(username));

-- Add constraint to prevent spaces in username
ALTER TABLE profiles 
ADD CONSTRAINT username_no_spaces 
CHECK (username !~ '\s');

-- Add constraint for minimum username length
ALTER TABLE profiles 
ADD CONSTRAINT username_min_length 
CHECK (char_length(username) >= 3);

-- Add constraint for valid username characters (alphanumeric, underscore, hyphen)
ALTER TABLE profiles 
ADD CONSTRAINT username_valid_chars 
CHECK (username ~ '^[a-zA-Z0-9_-]+$');