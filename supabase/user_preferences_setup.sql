-- Add background_theme column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS background_theme VARCHAR(50) DEFAULT 'default';

-- Update RLS policy to allow users to update their own background_theme
-- (Existing policies should allow this via standard update)

-- Create user_preferences table for more settings (optional)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  background_theme VARCHAR(50) DEFAULT 'default',
  sidebar_collapsed BOOLEAN DEFAULT false,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
