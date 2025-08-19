-- Add folder management functionality
-- This allows users to organize their saved visualizations into folders

-- Create folders table
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#4F46E5', -- Default purple color
  is_default BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT folder_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 50),
  CONSTRAINT folder_description_length CHECK (description IS NULL OR char_length(description) <= 200),
  CONSTRAINT folder_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  UNIQUE(user_id, name)
);

-- Create folder_saves junction table (many-to-many between folders and saved visualizations)
CREATE TABLE IF NOT EXISTS public.folder_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE NOT NULL,
  save_id UUID REFERENCES public.saves(id) ON DELETE CASCADE NOT NULL,
  
  UNIQUE(folder_id, save_id)
);

-- Add folder count to folders table
ALTER TABLE public.folders 
ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_created_at ON public.folders(created_at);
CREATE INDEX IF NOT EXISTS idx_folder_saves_folder_id ON public.folder_saves(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_saves_save_id ON public.folder_saves(save_id);

-- Enable Row Level Security
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_saves ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
-- Folders policies
DROP POLICY IF EXISTS "folders_select_policy" ON public.folders;
DROP POLICY IF EXISTS "folders_insert_policy" ON public.folders;
DROP POLICY IF EXISTS "folders_update_policy" ON public.folders;
DROP POLICY IF EXISTS "folders_delete_policy" ON public.folders;

CREATE POLICY "folders_select_policy" ON public.folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "folders_insert_policy" ON public.folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "folders_update_policy" ON public.folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "folders_delete_policy" ON public.folders
  FOR DELETE USING (auth.uid() = user_id);

-- Folder saves policies
DROP POLICY IF EXISTS "folder_saves_select_policy" ON public.folder_saves;
DROP POLICY IF EXISTS "folder_saves_insert_policy" ON public.folder_saves;
DROP POLICY IF EXISTS "folder_saves_delete_policy" ON public.folder_saves;

CREATE POLICY "folder_saves_select_policy" ON public.folder_saves
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.folders 
      WHERE folders.id = folder_saves.folder_id 
      AND folders.user_id = auth.uid()
    )
  );

CREATE POLICY "folder_saves_insert_policy" ON public.folder_saves
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.folders 
      WHERE folders.id = folder_id 
      AND folders.user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.saves 
      WHERE saves.id = save_id 
      AND saves.user_id = auth.uid()
    )
  );

CREATE POLICY "folder_saves_delete_policy" ON public.folder_saves
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.folders 
      WHERE folders.id = folder_saves.folder_id 
      AND folders.user_id = auth.uid()
    )
  );

-- Function for updating folder saves count
CREATE OR REPLACE FUNCTION public.update_folder_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.folders 
    SET saves_count = saves_count + 1 
    WHERE id = NEW.folder_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.folders 
    SET saves_count = GREATEST(0, saves_count - 1) 
    WHERE id = OLD.folder_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_folder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_folder_saves_count ON public.folder_saves;
CREATE TRIGGER trigger_update_folder_saves_count
  AFTER INSERT OR DELETE ON public.folder_saves
  FOR EACH ROW EXECUTE FUNCTION public.update_folder_saves_count();

DROP TRIGGER IF EXISTS trigger_update_folder_updated_at ON public.folders;
CREATE TRIGGER trigger_update_folder_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.update_folder_updated_at();

-- Function to create default folder for new users
CREATE OR REPLACE FUNCTION public.create_default_folder()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.folders (user_id, name, description, is_default)
  VALUES (NEW.id, 'My Favorites', 'Your favorite visualizations', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create default folder for new users
DROP TRIGGER IF EXISTS trigger_create_default_folder ON public.profiles;
CREATE TRIGGER trigger_create_default_folder
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_folder();