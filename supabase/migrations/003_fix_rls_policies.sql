-- Fix RLS Policies - Replace overly complex policies with simpler ones
-- This should resolve the hanging issue with authenticated queries

-- Drop existing policies that might be causing hangs
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Public visualizations are viewable by everyone" ON public.visualizations;
DROP POLICY IF EXISTS "Users can insert their own visualizations" ON public.visualizations;
DROP POLICY IF EXISTS "Users can update their own visualizations" ON public.visualizations;
DROP POLICY IF EXISTS "Users can delete their own visualizations" ON public.visualizations;

-- Create simpler, more reliable policies

-- Profiles: Allow viewing all profiles, but only modify your own
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Visualizations: View public ones and your own, modify only your own
CREATE POLICY "visualizations_select_policy" ON public.visualizations
  FOR SELECT USING (
    is_public = true OR user_id = auth.uid()
  );

CREATE POLICY "visualizations_insert_policy" ON public.visualizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "visualizations_update_policy" ON public.visualizations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "visualizations_delete_policy" ON public.visualizations
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visualizations ENABLE ROW LEVEL SECURITY;