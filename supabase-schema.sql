-- CCC Suite Database Schema for Supabase
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create presentations table
CREATE TABLE IF NOT EXISTS presentations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scripture_reference TEXT NOT NULL,
  slides JSONB NOT NULL DEFAULT '[]',
  compliance_report JSONB NOT NULL DEFAULT '{}',
  streaming_title TEXT,
  streaming_description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create app_settings table for ESV API key and global settings
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  esv_api_key TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create church_state table for last-saved presentation info
CREATE TABLE IF NOT EXISTS church_state (
  id TEXT PRIMARY KEY DEFAULT 'current_state',
  last_saved_presentation JSONB,
  active_users TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS presentations_user_id_idx ON presentations(user_id);
CREATE INDEX IF NOT EXISTS presentations_updated_at_idx ON presentations(updated_at DESC);
CREATE INDEX IF NOT EXISTS presentations_scripture_reference_idx ON presentations(scripture_reference);
CREATE INDEX IF NOT EXISTS presentations_is_public_idx ON presentations(is_public);

-- Enable Row Level Security (RLS)
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies for presentations
-- Users can only see their own presentations
CREATE POLICY "Users can view own presentations" ON presentations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own presentations
CREATE POLICY "Users can insert own presentations" ON presentations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own presentations
CREATE POLICY "Users can update own presentations" ON presentations
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own presentations
CREATE POLICY "Users can delete own presentations" ON presentations
  FOR DELETE USING (auth.uid() = user_id);

-- Anyone can view public presentations
CREATE POLICY "Anyone can view public presentations" ON presentations
  FOR SELECT USING (is_public = true);

-- RLS Policies for app_settings
-- Only authenticated users can view settings
CREATE POLICY "Authenticated users can view settings" ON app_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users can update settings (you can make this more restrictive)
CREATE POLICY "Authenticated users can update settings" ON app_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for church_state
-- All authenticated users can view church state
CREATE POLICY "Authenticated users can view church state" ON church_state
  FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can update church state
CREATE POLICY "Authenticated users can update church state" ON church_state
  FOR ALL USING (auth.role() = 'authenticated');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_presentations_updated_at 
  BEFORE UPDATE ON presentations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at 
  BEFORE UPDATE ON app_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_church_state_updated_at 
  BEFORE UPDATE ON church_state 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default app settings
INSERT INTO app_settings (id, esv_api_key) 
VALUES ('global', '') 
ON CONFLICT (id) DO NOTHING;

-- Insert default church state
INSERT INTO church_state (id) 
VALUES ('current_state') 
ON CONFLICT (id) DO NOTHING;