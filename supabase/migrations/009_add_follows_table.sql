-- Add follows functionality for user-to-user following

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Add follow counts to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_profiles_followers_count ON public.profiles(followers_count);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
DROP POLICY IF EXISTS "follows_select_policy" ON public.follows;
DROP POLICY IF EXISTS "follows_insert_policy" ON public.follows;
DROP POLICY IF EXISTS "follows_delete_policy" ON public.follows;

CREATE POLICY "follows_select_policy" ON public.follows
  FOR SELECT USING (true); -- Anyone can see who follows whom

CREATE POLICY "follows_insert_policy" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete_policy" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Function for updating follow counts
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increase following count for follower
    UPDATE public.profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    -- Increase followers count for followed user
    UPDATE public.profiles 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease following count for follower
    UPDATE public.profiles 
    SET following_count = GREATEST(0, following_count - 1) 
    WHERE id = OLD.follower_id;
    
    -- Decrease followers count for followed user
    UPDATE public.profiles 
    SET followers_count = GREATEST(0, followers_count - 1) 
    WHERE id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follow counts
DROP TRIGGER IF EXISTS trigger_update_follow_counts ON public.follows;
CREATE TRIGGER trigger_update_follow_counts
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();