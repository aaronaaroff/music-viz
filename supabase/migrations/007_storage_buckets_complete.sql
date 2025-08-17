-- Create audio-files storage bucket (if not exists)
-- This recreates the bucket you created manually
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files', 
  'audio-files', 
  true,
  52428800, -- 50MB limit for audio files
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-m4a']
) ON CONFLICT (id) DO NOTHING;

-- Create profile-images storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images', 
  'profile-images', 
  true,
  5242880, -- 5MB limit for images
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for audio-files bucket
-- Allow authenticated users to upload their own audio files
CREATE POLICY "Users can upload their own audio files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own audio files
CREATE POLICY "Users can update their own audio files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'audio-files' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'audio-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own audio files
CREATE POLICY "Users can delete their own audio files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'audio-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to audio files
CREATE POLICY "Public read access to audio files" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'audio-files');

-- RLS policies for profile-images bucket
-- Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload their own profile images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own profile images
CREATE POLICY "Users can update their own profile images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own profile images
CREATE POLICY "Users can delete their own profile images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access to profile images
CREATE POLICY "Public read access to profile images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'profile-images');

-- Add banner_url column to profiles table (if not exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banner_url text;

-- Remove category column from visualizations table (consolidating to tags only)
ALTER TABLE public.visualizations
DROP COLUMN IF EXISTS category;