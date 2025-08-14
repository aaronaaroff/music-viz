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
      user_liked:likes(user_id),
      user_saved:saves(user_id)
    `)
    .eq('is_public', true)
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
    query = query.eq('is_public', true);
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
    // Get fresh session to ensure we have current auth state
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // First check if the visualization exists and belongs to the user
    const { data: existingViz, error: checkError } = await supabase
      .from('visualizations')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking visualization:', checkError);
      return { data: null, error: checkError };
    }

    if (!existingViz) {
      return { 
        data: null, 
        error: { message: 'Visualization not found or you do not have permission to update it' } 
      };
    }

    // Now perform the update
    const { data, error } = await supabase
      .from('visualizations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Update visualization error:', error);
      return { data: null, error };
    }

    return { data, error: null };
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

// Share a visualization (make it public)
export async function shareVisualization(visualizationId: string) {
  // Get fresh session to ensure we have current auth state
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  try {
    const { data, error } = await supabase
      .from('visualizations')
      .update({ 
        is_public: true
      })
      .eq('id', visualizationId)
      .eq('user_id', session.user.id) // Only allow user to share their own visualizations
      .select()
      .single();

    if (error) {
      console.error('Error sharing visualization:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error sharing visualization:', error);
    return { data: null, error: { message: 'Failed to share visualization' } };
  }
}

// Unshare a visualization (make it private)
export async function unshareVisualization(visualizationId: string) {
  // Get fresh session to ensure we have current auth state
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  try {
    const { data, error } = await supabase
      .from('visualizations')
      .update({ is_public: false })
      .eq('id', visualizationId)
      .eq('user_id', session.user.id) // Only allow user to unshare their own visualizations
      .select()
      .single();

    if (error) {
      console.error('Error unsharing visualization:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error unsharing visualization:', error);
    return { data: null, error: { message: 'Failed to unshare visualization' } };
  }
}

// Generate a shareable URL for a visualization
export function generateShareableUrl(visualizationId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/?load=${visualizationId}`;
}

// Create a comment on a visualization
export async function createComment(visualizationId: string, content: string) {
  // Get fresh session to ensure we have current auth state
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: session.user.id,
        visualization_id: visualizationId,
        content: content.trim()
      })
      .select(`
        *,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error creating comment:', error);
    return { data: null, error: { message: 'Failed to create comment' } };
  }
}

// Get comments for a visualization
export async function getVisualizationComments(visualizationId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id (
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('visualization_id', visualizationId)
    .order('created_at', { ascending: false });

  return {
    data: data || [],
    error
  };
}

// Delete a comment
export async function deleteComment(commentId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { error: { message: 'User not authenticated' } };
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', session.user.id); // Only allow users to delete their own comments

  return { error };
}