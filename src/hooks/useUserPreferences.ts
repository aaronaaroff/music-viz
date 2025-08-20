import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getUserPreferences, type UserPreferences } from '@/lib/api/userPreferences';

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setPreferences(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await getUserPreferences(user.id);
        
        if (error) {
          setError(error.message || 'Failed to load preferences');
          setPreferences(null);
        } else {
          setPreferences(data);
          setError(null);
        }
      } catch (err) {
        setError('Failed to load preferences');
        setPreferences(null);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const refreshPreferences = async () => {
    if (!user) return;
    
    const { data } = await getUserPreferences(user.id);
    if (data) {
      setPreferences(data);
    }
  };

  return {
    preferences,
    loading,
    error,
    refreshPreferences
  };
}