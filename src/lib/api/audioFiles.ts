import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

export interface AudioFileUpload {
  file: File;
  userId: string;
  visualizationId?: string;
}

/**
 * Calculate SHA-256 hash of a file for validation
 */
async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Upload an audio file to Supabase Storage with unique identification
 */
export async function uploadAudioFile({ file, userId, visualizationId }: AudioFileUpload) {
  try {
    // Generate unique identifier for this file
    const fileId = uuidv4();
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'mp3';
    
    // Create unique path with UUID to prevent conflicts
    const fileName = `${userId}/${fileId}_${timestamp}.${extension}`;
    
    // Calculate file hash for validation
    const fileHash = await calculateFileHash(file);
    
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

    // Get the public URL with cache-busting parameter
    const { data: urlData } = supabase.storage
      .from('audio-files')
      .getPublicUrl(fileName);
    
    // Add cache-busting parameter to ensure fresh loads
    const publicUrl = `${urlData.publicUrl}?v=${timestamp}`;

    return {
      path: data.path,
      url: publicUrl,
      fileName: file.name,
      fileId,
      fileHash,
      originalName: file.name
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
 * Load an audio file from URL with cache clearing
 */
export async function loadAudioFileFromUrl(
  url: string, 
  fileName: string,
  expectedHash?: string
): Promise<File> {
  try {
    // Clear any cached version by adding timestamp
    const cacheBustUrl = url.includes('?') 
      ? `${url}&t=${Date.now()}`
      : `${url}?t=${Date.now()}`;
    
    const response = await fetch(cacheBustUrl, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const file = new File([blob], fileName, {
      type: blob.type || 'audio/mpeg'
    });
    
    // Validate file hash if provided
    if (expectedHash) {
      const actualHash = await calculateFileHash(file);
      if (actualHash !== expectedHash) {
        console.warn('Audio file hash mismatch - file may be corrupted or incorrect');
        // Continue anyway but log the issue
      }
    }
    
    return file;
  } catch (error) {
    console.error('Error loading audio file from URL:', error);
    throw error;
  }
}

/**
 * Validate that an audio URL is accessible
 */
export async function validateAudioUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-cache'
    });
    return response.ok;
  } catch {
    return false;
  }
}