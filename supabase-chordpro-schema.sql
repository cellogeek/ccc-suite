-- ChordPro Extension to CCC Suite Database Schema

-- Create songs table for ChordPro songs
CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  key TEXT,
  tempo INTEGER,
  capo INTEGER,
  content TEXT NOT NULL, -- ChordPro formatted content
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create setlists table for worship service planning
CREATE TABLE IF NOT EXISTS setlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  service_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create setlist_songs table for songs in setlists
CREATE TABLE IF NOT EXISTS setlist_songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setlist_id UUID REFERENCES setlists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  override_key TEXT, -- Override key for this performance
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create song_categories table for organizing songs
CREATE TABLE IF NOT EXISTS song_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create song_category_assignments table for many-to-many relationship
CREATE TABLE IF NOT EXISTS song_category_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  category_id UUID REFERENCES song_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(song_id, category_id)
);

-- Enable Row Level Security
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_category_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for songs
CREATE POLICY "Users can view own songs" ON songs
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own songs" ON songs
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own songs" ON songs
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own songs" ON songs
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create policies for setlists
CREATE POLICY "Users can view own setlists" ON setlists
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own setlists" ON setlists
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own setlists" ON setlists
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own setlists" ON setlists
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create policies for setlist_songs (inherit from setlist ownership)
CREATE POLICY "Users can view setlist songs for own setlists" ON setlist_songs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM setlists 
      WHERE setlists.id = setlist_songs.setlist_id 
      AND setlists.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Users can insert setlist songs for own setlists" ON setlist_songs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM setlists 
      WHERE setlists.id = setlist_songs.setlist_id 
      AND setlists.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Users can update setlist songs for own setlists" ON setlist_songs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM setlists 
      WHERE setlists.id = setlist_songs.setlist_id 
      AND setlists.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Users can delete setlist songs for own setlists" ON setlist_songs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM setlists 
      WHERE setlists.id = setlist_songs.setlist_id 
      AND setlists.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Create policies for song_categories
CREATE POLICY "Users can view own song categories" ON song_categories
  FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own song categories" ON song_categories
  FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own song categories" ON song_categories
  FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own song categories" ON song_categories
  FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create policies for song_category_assignments (inherit from song ownership)
CREATE POLICY "Users can view category assignments for own songs" ON song_category_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM songs 
      WHERE songs.id = song_category_assignments.song_id 
      AND songs.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Users can insert category assignments for own songs" ON song_category_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM songs 
      WHERE songs.id = song_category_assignments.song_id 
      AND songs.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Users can update category assignments for own songs" ON song_category_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM songs 
      WHERE songs.id = song_category_assignments.song_id 
      AND songs.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Users can delete category assignments for own songs" ON song_category_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM songs 
      WHERE songs.id = song_category_assignments.song_id 
      AND songs.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_songs_user_id ON songs(user_id);
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_key ON songs(key);
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_songs_tags ON songs USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_setlists_user_id ON setlists(user_id);
CREATE INDEX IF NOT EXISTS idx_setlists_service_date ON setlists(service_date);
CREATE INDEX IF NOT EXISTS idx_setlists_created_at ON setlists(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist_id ON setlist_songs(setlist_id);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_song_id ON setlist_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_order ON setlist_songs(setlist_id, order_index);

CREATE INDEX IF NOT EXISTS idx_song_categories_user_id ON song_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_song_category_assignments_song_id ON song_category_assignments(song_id);
CREATE INDEX IF NOT EXISTS idx_song_category_assignments_category_id ON song_category_assignments(category_id);

-- Create triggers for updated_at
CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON songs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_setlists_updated_at BEFORE UPDATE ON setlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default song categories
INSERT INTO song_categories (name, description, color, user_id) VALUES
  ('Worship', 'Songs for worship and praise', '#10b981', 'system'),
  ('Contemporary', 'Modern worship songs', '#3b82f6', 'system'),
  ('Hymns', 'Traditional hymns', '#8b5cf6', 'system'),
  ('Christmas', 'Christmas and holiday songs', '#ef4444', 'system'),
  ('Easter', 'Easter and resurrection songs', '#f59e0b', 'system'),
  ('Communion', 'Songs for communion service', '#6366f1', 'system')
ON CONFLICT DO NOTHING;