import { supabase } from '../supabase';
import type { Database } from '../database.types';

type Visualization = Database['public']['Tables']['visualizations']['Row'];
type VisualizationInsert = Database['public']['Tables']['visualizations']['Insert'];
type VisualizationUpdate = Database['public']['Tables']['visualizations']['Update'];

export interface CreateVisualizationData {
  title: string;
  description?: string;
  settings: Record<string, any>;
  audio_file_url?: string;
  audio_file_name?: string;
  category?: string;
  tags?: string[];
  is_public?: boolean;
  is_draft?: boolean;
}

// Get all public visualizations with pagination
export async function getPublicVisualizations(
  page = 0,
  limit = 12,
  category?: string,
  sortBy: 'created_at' | 'likes_count' | 'views_count' = 'created_at'
) {
  let query = supabase
    .from('visualizations')
    .select(`
      *,
      profiles:user_id (
        username,
        full_name,
        avatar_url
      ),
      user_liked:likes!inner (user_id),
      user_saved:saves!inner (user_id)
    `)
    .eq('is_public', true)
    .eq('is_draft', false)
    .range(page * limit, (page + 1) * limit - 1);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  query = query.order(sortBy, { ascending: false });

  const { data, error, count } = await query;

  return {
    data: data || [],
    error,
    totalCount: count || 0,
    hasMore: (count || 0) > (page + 1) * limit
  };
}

// Get user's visualizations (including drafts)
export async function getUserVisualizations(userId: string, includeDrafts = true) {
  let query = supabase
    .from('visualizations')
    .select(`
      *,
      profiles:user_id (
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (!includeDrafts) {
    query = query.eq('is_draft', false);
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

// Get user's saved visualizations
export async function getSavedVisualizations(userId: string) {
  const { data, error } = await supabase
    .from('saves')
    .select(`
      visualization_id,
      created_at,
      visualizations (
        *,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return {
    data: data?.map(save => ({
      ...save.visualizations,
      saved_at: save.created_at
    })) || [],
    error
  };
}

// Create a new visualization
export async function createVisualization(data: CreateVisualizationData) {
  // Get fresh session to ensure we have current auth state
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  const visualizationData: VisualizationInsert = {
    ...data,
    user_id: session.user.id,
  };

  try {
    // Add timeout to prevent hanging
    const insertPromise = supabase
      .from('visualizations')
      .insert(visualizationData)
      .select()
      .single();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Save operation timed out')), 10000)
    );

    const { data: visualization, error } = await Promise.race([
      insertPromise,
      timeoutPromise
    ]) as any;

    return { data: visualization, error };
  } catch (error) {
    console.error('Create visualization error:', error);
    return { 
      data: null, 
      error: { 
        message: error instanceof Error ? error.message : 'Failed to save visualization' 
      } 
    };
  }
}

// Update a visualization
export async function updateVisualization(id: string, updates: VisualizationUpdate) {
  try {
    // Add timeout to prevent hanging
    const updatePromise = supabase
      .from('visualizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Update operation timed out')), 10000)
    );

    const { data, error } = await Promise.race([
      updatePromise,
      timeoutPromise
    ]) as any;

    return { data, error };
  } catch (error) {
    console.error('Update visualization error:', error);
    return { 
      data: null, 
      error: { 
        message: error instanceof Error ? error.message : 'Failed to update visualization' 
      } 
    };
  }
}

// Delete a visualization
export async function deleteVisualization(id: string) {
  const { error } = await supabase
    .from('visualizations')
    .delete()
    .eq('id', id);

  return { error };
}

// Like/unlike a visualization
export async function toggleLike(visualizationId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { error: { message: 'User not authenticated' } };
  }

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('visualization_id', visualizationId)
    .single();

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', session.user.id)
      .eq('visualization_id', visualizationId);
    
    return { isLiked: false, error };
  } else {
    // Like
    const { error } = await supabase
      .from('likes')
      .insert({
        user_id: session.user.id,
        visualization_id: visualizationId
      });
    
    return { isLiked: true, error };
  }
}

// Save/unsave a visualization
export async function toggleSave(visualizationId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { error: { message: 'User not authenticated' } };
  }

  // Check if already saved
  const { data: existingSave } = await supabase
    .from('saves')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('visualization_id', visualizationId)
    .single();

  if (existingSave) {
    // Unsave
    const { error } = await supabase
      .from('saves')
      .delete()
      .eq('user_id', session.user.id)
      .eq('visualization_id', visualizationId);
    
    return { isSaved: false, error };
  } else {
    // Save
    const { error } = await supabase
      .from('saves')
      .insert({
        user_id: session.user.id,
        visualization_id: visualizationId
      });
    
    return { isSaved: true, error };
  }
}

// Get next available draft number for a user
export async function getNextDraftNumber(userId: string): Promise<number> {
  const { data } = await supabase
    .from('visualizations')
    .select('title')
    .eq('user_id', userId)
    .like('title', 'Visualization %');

  if (!data) return 1;

  const draftNumbers = data
    .map(viz => {
      const match = viz.title.match(/^Visualization (\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => num > 0);

  if (draftNumbers.length === 0) return 1;

  draftNumbers.sort((a, b) => a - b);
  
  for (let i = 1; i <= draftNumbers.length + 1; i++) {
    if (!draftNumbers.includes(i)) {
      return i;
    }
  }

  return draftNumbers.length + 1;
}