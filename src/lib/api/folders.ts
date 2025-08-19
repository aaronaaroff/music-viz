import { supabase } from '../supabase';
import type { Database } from '../database.types';

type Folder = Database['public']['Tables']['folders']['Row'];
type FolderInsert = Database['public']['Tables']['folders']['Insert'];
type FolderUpdate = Database['public']['Tables']['folders']['Update'];

// Get user's folders with their contents
export async function getUserFolders(userId: string) {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  return { data: data || [], error };
}

// Get visualizations in a specific folder
export async function getFolderContents(userId: string) {
  // First get all saves for the user
  const { data: saves, error: savesError } = await supabase
    .from('saves')
    .select('id, visualization_id')
    .eq('user_id', userId);

  if (savesError || !saves) {
    return { data: {}, error: savesError };
  }

  // Then get folder_saves relationships
  const saveIds = saves.map(s => s.id);
  const { data: folderSaves, error: folderSavesError } = await supabase
    .from('folder_saves')
    .select('folder_id, save_id')
    .in('save_id', saveIds);

  if (folderSavesError) {
    return { data: {}, error: folderSavesError };
  }

  // Map visualization IDs to folder IDs
  const folderContents: Record<string, string[]> = {};
  
  if (folderSaves) {
    folderSaves.forEach(fs => {
      const save = saves.find(s => s.id === fs.save_id);
      if (save) {
        if (!folderContents[fs.folder_id]) {
          folderContents[fs.folder_id] = [];
        }
        folderContents[fs.folder_id].push(save.visualization_id);
      }
    });
  }

  return { data: folderContents, error: null };
}

// Create a new folder
export async function createFolder(data: Omit<FolderInsert, 'user_id'>) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  const { data: folder, error } = await supabase
    .from('folders')
    .insert({
      ...data,
      user_id: session.user.id,
    })
    .select()
    .single();

  return { data: folder, error };
}

// Update a folder
export async function updateFolder(id: string, updates: FolderUpdate) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  const { data, error } = await supabase
    .from('folders')
    .update(updates)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single();

  return { data, error };
}

// Delete a folder
export async function deleteFolder(id: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { error: { message: 'User not authenticated' } };
  }

  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  return { error };
}

// Get folders that contain a specific visualization
export async function getFoldersForVisualization(visualizationId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { data: [], error: { message: 'User not authenticated' } };
  }

  // First get the save record
  const { data: save } = await supabase
    .from('saves')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('visualization_id', visualizationId)
    .single();

  if (!save) {
    return { data: [], error: null };
  }

  // Then get folders containing this save
  const { data, error } = await supabase
    .from('folder_saves')
    .select(`
      folders (
        id,
        name,
        color,
        saves_count
      )
    `)
    .eq('save_id', save.id);

  return { 
    data: data?.map(fs => fs.folders).filter(Boolean) || [], 
    error 
  };
}

// Add visualization to folder
export async function addVisualizationToFolder(visualizationId: string, folderId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { error: { message: 'User not authenticated' } };
  }

  try {
    // First ensure the visualization is saved
    const { data: existingSave } = await supabase
      .from('saves')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('visualization_id', visualizationId)
      .single();

    let saveId = existingSave?.id;

    if (!existingSave) {
      // Create the save first
      const { data: newSave, error: saveError } = await supabase
        .from('saves')
        .insert({
          user_id: session.user.id,
          visualization_id: visualizationId
        })
        .select('id')
        .single();

      if (saveError) {
        return { error: saveError };
      }
      saveId = newSave.id;
    }

    // Check if already in folder
    const { data: existingFolderSave } = await supabase
      .from('folder_saves')
      .select('id')
      .eq('folder_id', folderId)
      .eq('save_id', saveId)
      .single();

    if (existingFolderSave) {
      return { error: null }; // Already in folder
    }

    // Add to folder
    const { error } = await supabase
      .from('folder_saves')
      .insert({
        folder_id: folderId,
        save_id: saveId
      });

    return { error };
  } catch (error) {
    console.error('Error adding to folder:', error);
    return { error: { message: 'Failed to add to folder' } };
  }
}

// Remove visualization from folder
export async function removeVisualizationFromFolder(visualizationId: string, folderId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { error: { message: 'User not authenticated' } };
  }

  try {
    // Find the save record
    const { data: save } = await supabase
      .from('saves')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('visualization_id', visualizationId)
      .single();

    if (!save) {
      return { error: { message: 'Visualization not saved' } };
    }

    // Remove from folder
    const { error } = await supabase
      .from('folder_saves')
      .delete()
      .eq('folder_id', folderId)
      .eq('save_id', save.id);

    return { error };
  } catch (error) {
    console.error('Error removing from folder:', error);
    return { error: { message: 'Failed to remove from folder' } };
  }
}