import { supabase } from '../supabase';
import type { Database } from '../database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export interface SignUpData {
  email: string;
  password: string;
  full_name?: string;
  username?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  username?: string;
  full_name?: string;
  bio?: string;
  website?: string;
  avatar_url?: string;
}

// Sign up with email and password
export async function signUp({ email, password, full_name, username }: SignUpData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        username,
      }
    }
  });

  return { data, error };
}

// Sign in with email and password
export async function signIn({ email, password }: SignInData) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

// Sign in with OAuth (Google, GitHub, etc.)
export async function signInWithOAuth(provider: 'google' | 'github' | 'discord') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });

  return { data, error };
}

// Get current user profile
export async function getCurrentProfile(): Promise<{ data: Profile | null; error: any }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: 'No authenticated user' } };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { data, error };
}

// Update user profile
export async function updateProfile(updates: UpdateProfileData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: 'No authenticated user' } };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  return { data, error };
}

// Get profile by username
export async function getProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  return { data, error };
}

// Check if username is available
export async function checkUsernameAvailability(username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  // If error and no data, username is available
  return { isAvailable: !data && error, error: error?.code !== 'PGRST116' ? error : null };
}

// Follow/unfollow a user
export async function toggleFollow(targetUserId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: { message: 'User not authenticated' } };
  }

  if (user.id === targetUserId) {
    return { error: { message: 'Cannot follow yourself' } };
  }

  // Check if already following
  const { data: existingFollow } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .single();

  if (existingFollow) {
    // Unfollow
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);
    
    return { isFollowing: false, error };
  } else {
    // Follow
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: targetUserId
      });
    
    return { isFollowing: true, error };
  }
}

// Get user's followers
export async function getFollowers(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      follower_id,
      created_at,
      profiles:follower_id (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

// Get users that a user is following
export async function getFollowing(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      following_id,
      created_at,
      profiles:following_id (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}