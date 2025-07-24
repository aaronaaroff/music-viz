-- Enable Row Level Security
-- Note: ALTER DATABASE requires superuser privileges, set this in Supabase dashboard instead

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE visualization_category AS ENUM (
  'ambient', 'electronic', 'hip_hop', 'rock', 'pop', 'classical', 'jazz', 'other'
);

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT
);

-- Create visualizations table
CREATE TABLE visualizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  audio_file_url TEXT,
  audio_file_name TEXT,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT true,
  duration INTEGER, -- Duration in seconds
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  CONSTRAINT title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 100)
);

-- Create likes table
CREATE TABLE likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  visualization_id UUID REFERENCES visualizations(id) ON DELETE CASCADE NOT NULL,
  
  UNIQUE(user_id, visualization_id)
);

-- Create saves table (bookmarks)
CREATE TABLE saves (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  visualization_id UUID REFERENCES visualizations(id) ON DELETE CASCADE NOT NULL,
  
  UNIQUE(user_id, visualization_id)
);

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  visualization_id UUID REFERENCES visualizations(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  
  CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 1000)
);

-- Create follows table
CREATE TABLE follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

-- Create indexes for better performance
CREATE INDEX idx_visualizations_user_id ON visualizations(user_id);
CREATE INDEX idx_visualizations_created_at ON visualizations(created_at DESC);
CREATE INDEX idx_visualizations_public ON visualizations(is_public) WHERE is_public = true;
CREATE INDEX idx_visualizations_category ON visualizations(category);
CREATE INDEX idx_visualizations_tags ON visualizations USING GIN(tags);

CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_visualization_id ON likes(visualization_id);

CREATE INDEX idx_saves_user_id ON saves(user_id);
CREATE INDEX idx_saves_visualization_id ON saves(visualization_id);

CREATE INDEX idx_comments_visualization_id ON comments(visualization_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Visualizations policies
CREATE POLICY "Public visualizations are viewable by everyone" ON visualizations
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can insert their own visualizations" ON visualizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visualizations" ON visualizations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visualizations" ON visualizations
  FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like visualizations" ON likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" ON likes
  FOR DELETE USING (auth.uid() = user_id);

-- Saves policies
CREATE POLICY "Users can view their own saves" ON saves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save visualizations" ON saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave their own saves" ON saves
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments on public visualizations are viewable by everyone" ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM visualizations 
      WHERE visualizations.id = comments.visualization_id 
      AND (visualizations.is_public = true OR visualizations.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can comment on public visualizations" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM visualizations 
      WHERE visualizations.id = visualization_id 
      AND visualizations.is_public = true
    )
  );

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Categories policies (public read-only)
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Functions for updating counters
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE visualizations 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.visualization_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE visualizations 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.visualization_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE visualizations 
    SET saves_count = saves_count + 1 
    WHERE id = NEW.visualization_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE visualizations 
    SET saves_count = GREATEST(0, saves_count - 1) 
    WHERE id = OLD.visualization_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE visualizations 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.visualization_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE visualizations 
    SET comments_count = GREATEST(0, comments_count - 1) 
    WHERE id = OLD.visualization_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

CREATE TRIGGER trigger_update_saves_count
  AFTER INSERT OR DELETE ON saves
  FOR EACH ROW EXECUTE FUNCTION update_saves_count();

CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comments_count();

CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_visualizations_updated_at
  BEFORE UPDATE ON visualizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, description, color, icon) VALUES
  ('Ambient', 'Atmospheric and ambient music visualizations', '#8B5CF6', 'cloud'),
  ('Electronic', 'Electronic and EDM visualizations', '#06B6D4', 'zap'),
  ('Hip Hop', 'Hip hop and rap visualizations', '#F59E0B', 'music'),
  ('Rock', 'Rock and metal visualizations', '#EF4444', 'volume-2'),
  ('Pop', 'Pop and mainstream visualizations', '#EC4899', 'heart'),
  ('Classical', 'Classical and orchestral visualizations', '#6366F1', 'violin'),
  ('Jazz', 'Jazz and blues visualizations', '#84CC16', 'saxophone'),
  ('Other', 'Other genres and experimental visualizations', '#64748B', 'more-horizontal');

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();