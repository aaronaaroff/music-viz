/**
 * Session synchronization across browser tabs
 * Uses BroadcastChannel API to sync auth state between app tabs only
 * Does not interfere with tab switching to other websites
 */

import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

const CHANNEL_NAME = 'vuzik_session_sync';
const SYNC_EVENTS = {
  SESSION_UPDATE: 'session_update',
  SESSION_CLEAR: 'session_clear',
  REQUEST_SYNC: 'request_sync',
} as const;

interface SyncMessage {
  type: keyof typeof SYNC_EVENTS;
  session?: Session | null;
  timestamp: number;
}

class SessionSyncManager {
  private channel: BroadcastChannel | null = null;
  private isLeader = false;
  private lastSync = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.initChannel();
    }
  }

  private initChannel() {
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      
      // Listen for messages from other tabs
      this.channel.onmessage = async (event: MessageEvent<SyncMessage>) => {
        const { type, session, timestamp } = event.data;
        
        // Ignore old messages
        if (timestamp < this.lastSync) return;
        
        switch (type) {
          case 'SESSION_UPDATE':
            if (session) {
              // Update local session without triggering another broadcast
              await this.updateLocalSession(session);
            }
            break;
            
          case 'SESSION_CLEAR':
            await this.clearLocalSession();
            break;
            
          case 'REQUEST_SYNC':
            // If we're the leader, broadcast current session
            if (this.isLeader) {
              const currentSession = await supabase.auth.getSession();
              if (currentSession.data.session) {
                this.broadcast('SESSION_UPDATE', currentSession.data.session);
              }
            }
            break;
        }
        
        this.lastSync = timestamp;
      };

      // Request sync on initialization
      this.broadcast('REQUEST_SYNC', null);
      
      // Try to become leader
      this.attemptLeadership();
      
    } catch (error) {
      console.warn('BroadcastChannel not supported:', error);
    }
  }

  private attemptLeadership() {
    // Simple leadership election - first tab becomes leader
    const leaderKey = 'vuzik_session_leader';
    const tabId = `${Date.now()}_${Math.random()}`;
    
    if (!localStorage.getItem(leaderKey)) {
      localStorage.setItem(leaderKey, tabId);
      this.isLeader = localStorage.getItem(leaderKey) === tabId;
    }
    
    // Re-elect on storage change
    window.addEventListener('storage', (e) => {
      if (e.key === leaderKey && !e.newValue) {
        // Leader left, try to become new leader
        setTimeout(() => this.attemptLeadership(), 100);
      }
    });
    
    // Clear leadership on unload
    window.addEventListener('beforeunload', () => {
      if (this.isLeader) {
        localStorage.removeItem(leaderKey);
      }
    });
  }

  private async updateLocalSession(session: Session) {
    // Update Supabase client without triggering auth state change
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    
    if (error) {
      console.error('Failed to sync session:', error);
    }
  }

  private async clearLocalSession() {
    await supabase.auth.signOut({ scope: 'local' });
  }

  broadcast(type: keyof typeof SYNC_EVENTS, session: Session | null) {
    if (!this.channel) return;
    
    const message: SyncMessage = {
      type,
      session,
      timestamp: Date.now(),
    };
    
    try {
      this.channel.postMessage(message);
    } catch (error) {
      console.error('Failed to broadcast session update:', error);
    }
  }

  cleanup() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

// Create singleton instance
export const sessionSync = new SessionSyncManager();

// Helper to broadcast session changes
export function broadcastSessionUpdate(session: Session | null) {
  if (session) {
    sessionSync.broadcast('SESSION_UPDATE', session);
  } else {
    sessionSync.broadcast('SESSION_CLEAR', null);
  }
}