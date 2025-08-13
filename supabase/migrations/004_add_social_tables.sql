-- Add missing social interaction tables (likes, saves, comments)
-- This assumes the simplified schema (002) was used and we need to add these tables

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  visualization_id UUID REFERENCES public.visualizations(id) ON DELETE CASCADE NOT NULL,
  
  UNIQUE(user_id, visualization_id)
);

-- Create saves table (bookmarks)
CREATE TABLE IF NOT EXISTS public.saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  visualization_id UUID REFERENCES public.visualizations(id) ON DELETE CASCADE NOT NULL,
  
  UNIQUE(user_id, visualization_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  visualization_id UUID REFERENCES public.visualizations(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  
  CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 1000)
);

-- Add missing columns to visualizations table if they don't exist
ALTER TABLE public.visualizations 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS audio_file_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS duration INTEGER,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_visualization_id ON public.likes(visualization_id);

CREATE INDEX IF NOT EXISTS idx_saves_user_id ON public.saves(user_id);
CREATE INDEX IF NOT EXISTS idx_saves_visualization_id ON public.saves(visualization_id);

CREATE INDEX IF NOT EXISTS idx_comments_visualization_id ON public.comments(visualization_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- Enable Row Level Security
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
-- Note: DROP first to avoid conflicts if policies already exist

-- Likes policies
DROP POLICY IF EXISTS "likes_select_policy" ON public.likes;
DROP POLICY IF EXISTS "likes_insert_policy" ON public.likes;
DROP POLICY IF EXISTS "likes_delete_policy" ON public.likes;

CREATE POLICY "likes_select_policy" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "likes_insert_policy" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_policy" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);

-- Saves policies
DROP POLICY IF EXISTS "saves_select_policy" ON public.saves;
DROP POLICY IF EXISTS "saves_insert_policy" ON public.saves;
DROP POLICY IF EXISTS "saves_delete_policy" ON public.saves;

CREATE POLICY "saves_select_policy" ON public.saves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saves_insert_policy" ON public.saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saves_delete_policy" ON public.saves
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
DROP POLICY IF EXISTS "comments_select_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_insert_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_update_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_delete_policy" ON public.comments;

CREATE POLICY "comments_select_policy" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.visualizations 
      WHERE visualizations.id = comments.visualization_id 
      AND (visualizations.is_public = true OR visualizations.user_id = auth.uid())
    )
  );

CREATE POLICY "comments_insert_policy" ON public.comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.visualizations 
      WHERE visualizations.id = visualization_id 
      AND visualizations.is_public = true
    )
  );

CREATE POLICY "comments_update_policy" ON public.comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "comments_delete_policy" ON public.comments
  FOR DELETE USING (auth.uid() = user_id);

-- Functions for updating counters
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.visualizations 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.visualization_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.visualizations 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.visualization_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.visualizations 
    SET saves_count = saves_count + 1 
    WHERE id = NEW.visualization_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.visualizations 
    SET saves_count = GREATEST(0, saves_count - 1) 
    WHERE id = OLD.visualization_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.visualizations 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.visualization_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.visualizations 
    SET comments_count = GREATEST(0, comments_count - 1) 
    WHERE id = OLD.visualization_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers (drop existing first to avoid conflicts)
DROP TRIGGER IF EXISTS trigger_update_likes_count ON public.likes;
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();

DROP TRIGGER IF EXISTS trigger_update_saves_count ON public.saves;
CREATE TRIGGER trigger_update_saves_count
  AFTER INSERT OR DELETE ON public.saves
  FOR EACH ROW EXECUTE FUNCTION public.update_saves_count();

DROP TRIGGER IF EXISTS trigger_update_comments_count ON public.comments;
CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comments_count();