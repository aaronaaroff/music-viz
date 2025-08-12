import { useEffect, useCallback } from 'react';

interface SessionState {
  visualizationId: string | null;
  visualizationName: string;
  settings: any;
  audioSource?: {
    type: 'file' | 'microphone' | 'keyboard';
    fileName?: string;
  };
  lastSaved?: number;
}

const SESSION_KEY = 'music-viz-session';
const LOCAL_KEY = 'music-viz-current-work';

export function useSessionPersistence() {
  // Save current session state
  const saveSession = useCallback((state: SessionState) => {
    try {
      const stateWithTimestamp = {
        ...state,
        lastSaved: Date.now()
      };
      
      // Save to both sessionStorage (for tab switches) and localStorage (for page refreshes)
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(stateWithTimestamp));
      localStorage.setItem(LOCAL_KEY, JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, []);

  // Load saved session state
  const loadSession = useCallback((): SessionState | null => {
    try {
      // Try sessionStorage first (for tab switches)
      let saved = sessionStorage.getItem(SESSION_KEY);
      
      // Fall back to localStorage (for page refreshes)
      if (!saved) {
        saved = localStorage.getItem(LOCAL_KEY);
      }
      
      if (!saved) return null;
      
      const parsed = JSON.parse(saved);
      
      // Check if session is less than 24 hours old
      if (parsed.lastSaved && Date.now() - parsed.lastSaved > 86400000) {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(LOCAL_KEY);
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }, []);

  // Clear session
  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LOCAL_KEY);
  }, []);

  // Auto-save on tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is being hidden, trigger save through custom event
        window.dispatchEvent(new CustomEvent('saveSessionState'));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    saveSession,
    loadSession,
    clearSession
  };
}