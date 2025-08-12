import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string, username?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Fetch profile with proper error handling and timeout
  const fetchProfile = async (userId: string): Promise<void> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      clearTimeout(timeoutId);

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, try to create it
          console.log('Profile not found, creating...');
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData?.user) {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userData.user.id,
                full_name: userData.user.user_metadata?.full_name || null,
                username: userData.user.user_metadata?.username || null,
                avatar_url: userData.user.user_metadata?.avatar_url || null,
              })
              .select()
              .single();

            if (!createError && newProfile) {
              setProfile(newProfile);
            } else {
              console.error('Failed to create profile:', createError);
              setProfile(null);
            }
          }
        } else {
          console.error('Error fetching profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(data);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Profile fetch timed out');
      } else {
        console.error('Error fetching profile:', error);
      }
      setProfile(null);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get the session from Supabase
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (!mounted) return;

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile(initialSession.user.id);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted || !isInitialized) return;

        console.log('Auth state change:', _event);

        // Update session and user
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Update profile
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isInitialized]);

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Only refresh if it's been more than 5 minutes AND we currently have a user
      if (!document.hidden && user && Date.now() - lastRefresh > 300000) {
        console.log('Tab became visible after 5+ minutes, validating auth state...');
        
        try {
          // Just validate the session without disrupting the current state
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          if (currentSession?.user && currentSession.user.id === user.id) {
            // Session is still valid for the same user, just update timestamp
            setLastRefresh(Date.now());
            console.log('Session validated, no changes needed');
          } else if (!currentSession?.user && user) {
            // Session expired, need to clear state
            console.log('Session expired, clearing auth state');
            setSession(null);
            setUser(null);
            setProfile(null);
          }
          // If currentSession has a different user, let the normal auth flow handle it
          
        } catch (error) {
          console.error('Error validating auth on tab focus:', error);
        }
      } else if (!document.hidden) {
        // Tab became visible but not enough time passed, just update timestamp
        setLastRefresh(Date.now());
      }
    };

    // Handle cross-tab auth state synchronization
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === 'music-viz-supabase-auth' && e.newValue) {
        console.log('Auth state changed in another tab');
        
        // Give Supabase a moment to sync
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchProfile(currentSession.user.id);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, lastRefresh]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string, username?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
          }
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear state immediately to provide instant feedback
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Force a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update last refresh to prevent immediate re-fetch
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: { message: 'No user logged in' } };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (!error) {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper to get current user without causing re-renders
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}