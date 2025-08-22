import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseFollowCountOptions {
  userId: string;
  initialCount?: number;
}

export function useFollowCount({ userId, initialCount = 0 }: UseFollowCountOptions) {
  const [followersCount, setFollowersCount] = useState(initialCount);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!userId) return;

    let channel: RealtimeChannel;

    // Fetch current count
    const fetchCount = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('followers_count')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setFollowersCount(data.followers_count || 0);
      }
    };

    // Initial fetch
    fetchCount();

    // Set up real-time subscription
    channel = supabase
      .channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && 'followers_count' in payload.new) {
            setFollowersCount(payload.new.followers_count as number);
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  // Optimistic update function
  const optimisticUpdate = (delta: number) => {
    setIsUpdating(true);
    setFollowersCount(prev => Math.max(0, prev + delta));
    
    // Reset updating state after a delay
    setTimeout(() => setIsUpdating(false), 1000);
  };

  return {
    followersCount,
    isUpdating,
    optimisticUpdate,
    refetch: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('followers_count')
        .eq('id', userId)
        .single();
      
      if (data) {
        setFollowersCount(data.followers_count || 0);
      }
    }
  };
}