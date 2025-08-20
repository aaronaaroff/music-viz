-- Add is_public field to profiles table for public profile privacy
ALTER TABLE public.profiles 
ADD COLUMN is_public BOOLEAN DEFAULT true;

-- Create index for public profiles
CREATE INDEX profiles_is_public_idx ON public.profiles(is_public) WHERE is_public = true;

-- Update existing profiles to be public by default
UPDATE public.profiles SET is_public = true WHERE is_public IS NULL;

-- Function to sync profile privacy with user preferences
CREATE OR REPLACE FUNCTION sync_profile_privacy()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile.is_public based on user_preferences.profile_is_public
  UPDATE public.profiles 
  SET is_public = NEW.profile_is_public
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically sync profile privacy when user preferences change
CREATE TRIGGER sync_profile_privacy_trigger
  AFTER INSERT OR UPDATE OF profile_is_public ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_privacy();

-- Initial sync of existing user preferences to profiles
UPDATE public.profiles 
SET is_public = up.profile_is_public
FROM public.user_preferences up
WHERE profiles.id = up.user_id;