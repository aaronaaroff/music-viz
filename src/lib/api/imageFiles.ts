import { supabase } from '../supabase';

export interface ImageUpload {
  file: File;
  userId: string;
  type: 'avatar' | 'banner';
}

/**
 * Upload an image file to Supabase Storage
 */
export async function uploadImage({ file, userId, type }: ImageUpload) {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (5MB limit for images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image must be less than 5MB');
    }

    // Create filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${type}_${timestamp}.${extension}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting existing images
        contentType: file.type
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName);

    return {
      path: data.path,
      url: urlData.publicUrl,
      fileName: file.name
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Delete an image file from Supabase Storage
 */
export async function deleteImage(filePath: string) {
  try {
    const { error } = await supabase.storage
      .from('profile-images')
      .remove([filePath]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}