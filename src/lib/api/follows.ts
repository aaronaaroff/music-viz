import { supabase } from '../supabase';
import type { Database } from '../database.types';

// Follow a user
export async function followUser(userId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { error: { message: 'User not authenticated' } };
  }

  if (session.user.id === userId) {
    return { error: { message: 'Cannot follow yourself' } };
  }

  // Check if already following
  const { data: existingFollow } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', session.user.id)
    .eq('following_id', userId)
    .single();

  if (existingFollow) {
    return { error: { message: 'Already following this user' } };
  }

  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: session.user.id,
      following_id: userId
    });

  return { isFollowing: true, error };
}

// Unfollow a user
export async function unfollowUser(userId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { error: { message: 'User not authenticated' } };
  }

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', session.user.id)
    .eq('following_id', userId);

  return { isFollowing: false, error };
}

// Toggle follow/unfollow
export async function toggleFollow(userId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { error: { message: 'User not authenticated' } };
  }

  if (session.user.id === userId) {
    return { error: { message: 'Cannot follow yourself' } };
  }

  // Check if already following
  const { data: existingFollow } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', session.user.id)
    .eq('following_id', userId)
    .single();

  if (existingFollow) {
    // Unfollow
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', session.user.id)
      .eq('following_id', userId);
    
    return { isFollowing: false, error };
  } else {
    // Follow
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: session.user.id,
        following_id: userId
      });
    
    return { isFollowing: true, error };
  }
}

// Check if following a user
export async function checkIsFollowing(userId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { isFollowing: false, error: null };
  }

  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', session.user.id)
    .eq('following_id', userId)
    .single();

  return { isFollowing: !!data, error };
}

// Get trending creators (based on likes and followers)
export async function getTrendingCreators(limit = 10) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      banner_url,
      bio,
      followers_count,
      following_count,
      visualizations_count:visualizations(count),
      total_likes:visualizations(likes_count)
    `)
    .not('username', 'is', null)
    .order('followers_count', { ascending: false })
    .limit(limit);

  // Calculate trending score (followers + total likes)
  const trending = data?.map(creator => {
    const totalLikes = creator.total_likes?.reduce((sum: number, viz: any) => sum + (viz.likes_count || 0), 0) || 0;
    const trendingScore = (creator.followers_count || 0) + totalLikes;
    
    return {
      ...creator,
      total_likes: totalLikes,
      trending_score: trendingScore,
      visualizations_count: creator.visualizations_count?.[0]?.count || 0
    };
  }) || [];

  // Sort by trending score
  trending.sort((a, b) => b.trending_score - a.trending_score);

  return { data: trending, error };
}

// Get users that the current user is following
export async function getFollowing() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return { data: [], error: { message: 'User not authenticated' } };
  }

  const { data, error } = await supabase
    .from('follows')
    .select(`
      following_id,
      profiles:following_id (
        id,
        username,
        full_name,
        avatar_url,
        followers_count,
        following_count
      )
    `)
    .eq('follower_id', session.user.id)
    .order('created_at', { ascending: false });

  return { 
    data: data?.map(follow => follow.profiles).filter(Boolean) || [], 
    error 
  };
}

// Get followers of a user
export async function getFollowers(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      follower_id,
      profiles:follower_id (
        id,
        username,
        full_name,
        avatar_url,
        followers_count,
        following_count
      )
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false });

  return { 
    data: data?.map(follow => follow.profiles).filter(Boolean) || [], 
    error 
  };
}