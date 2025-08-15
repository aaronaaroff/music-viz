import { supabase } from '../supabase';

export interface AudioFileUpload {
  file: File;
  userId: string;
  visualizationId?: string;
}

/**
 * Upload an audio file to Supabase Storage
 */
export async function uploadAudioFile({ file, userId, visualizationId }: AudioFileUpload) {
  try {
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'mp3';
    const fileName = `${userId}/${visualizationId || 'temp'}_${timestamp}.${extension}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('audio-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('audio-files')
      .getPublicUrl(fileName);

    return {
      path: data.path,
      url: urlData.publicUrl,
      fileName: file.name
    };
  } catch (error) {
    console.error('Error uploading audio file:', error);
    throw error;
  }
}

/**
 * Delete an audio file from Supabase Storage
 */
export async function deleteAudioFile(filePath: string) {
  try {
    const { error } = await supabase.storage
      .from('audio-files')
      .remove([filePath]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting audio file:', error);
    throw error;
  }
}

/**
 * Load an audio file from URL and create a File object
 */
export async function loadAudioFileFromUrl(url: string, fileName: string): Promise<File> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return new File([blob], fileName, {
      type: blob.type || 'audio/mpeg'
    });
  } catch (error) {
    console.error('Error loading audio file from URL:', error);
    throw error;
  }
}