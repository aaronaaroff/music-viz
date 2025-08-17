-- Create profile-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true);

-- Add banner_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN banner_url text;

-- Add RLS policies for profile-images bucket
INSERT INTO storage.policies (name, bucket_id, operation, policies)
VALUES 
  ('Users can upload their own profile images', 'profile-images', 'INSERT', ARRAY['(auth.uid() = user_id)']),
  ('Users can update their own profile images', 'profile-images', 'UPDATE', ARRAY['(auth.uid() = user_id)']),
  ('Users can delete their own profile images', 'profile-images', 'DELETE', ARRAY['(auth.uid() = user_id)']),
  ('Public read access to profile images', 'profile-images', 'SELECT', ARRAY['true']);

-- Remove category column from visualizations table (consolidating to tags only)
ALTER TABLE public.visualizations
DROP COLUMN IF EXISTS category;