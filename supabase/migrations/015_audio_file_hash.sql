-- Add file hash and file ID columns for audio file validation
ALTER TABLE public.visualizations
ADD COLUMN IF NOT EXISTS audio_file_hash TEXT,
ADD COLUMN IF NOT EXISTS audio_file_id TEXT;

-- Add index for file ID lookups
CREATE INDEX IF NOT EXISTS idx_visualizations_audio_file_id 
ON public.visualizations(audio_file_id) 
WHERE audio_file_id IS NOT NULL;