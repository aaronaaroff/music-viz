import { supabase } from '../supabase';
import { createVisualization, updateVisualization } from './visualizations';
import type { CreateVisualizationData } from './visualizations';

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
}

// Enhanced session validation
async function ensureValidSession(options: RetryOptions = {}): Promise<boolean> {
  const { maxAttempts = 3, delayMs = 1000 } = options;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Try to get a fresh session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error(`Session validation attempt ${attempt} failed:`, error);
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        return false;
      }
      
      if (session?.user) {
        // Session is valid
        console.log(`Session validated on attempt ${attempt}`);
        return true;
      } else {
        console.warn(`No valid session on attempt ${attempt}`);
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        return false;
      }
    } catch (error) {
      console.error(`Session validation attempt ${attempt} error:`, error);
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      return false;
    }
  }
  
  return false;
}

// Robust create visualization with retry
export async function robustCreateVisualization(
  data: CreateVisualizationData,
  options: RetryOptions = {}
): Promise<{ data: any; error: any }> {
  const { maxAttempts = 3, delayMs = 1000 } = options;
  
  // First, ensure we have a valid session
  const sessionValid = await ensureValidSession(options);
  if (!sessionValid) {
    return { 
      data: null, 
      error: { message: 'Unable to validate authentication session. Please refresh the page.' } 
    };
  }
  
  // Attempt the operation with retry logic
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Create visualization attempt ${attempt}`);
      
      const result = await createVisualization(data);
      
      if (result.error) {
        // Check if it's an auth error
        if (result.error.message?.includes('not authenticated') || 
            result.error.message?.includes('JWT') ||
            result.error.message?.includes('session')) {
          
          console.warn(`Auth error on attempt ${attempt}, retrying...`);
          
          if (attempt < maxAttempts) {
            // Wait and try to refresh session
            await new Promise(resolve => setTimeout(resolve, delayMs));
            const refreshed = await ensureValidSession({ maxAttempts: 1, delayMs: 500 });
            if (!refreshed) {
              return { 
                data: null, 
                error: { message: 'Session expired. Please refresh the page and try again.' } 
              };
            }
            continue;
          }
        }
        
        // Non-auth error or final attempt
        return result;
      }
      
      // Success!
      console.log(`Create visualization succeeded on attempt ${attempt}`);
      return result;
      
    } catch (error: any) {
      console.error(`Create visualization attempt ${attempt} failed:`, error);
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      return { 
        data: null, 
        error: { message: error.message || 'Failed to create visualization after multiple attempts' } 
      };
    }
  }
  
  return { 
    data: null, 
    error: { message: 'Failed to create visualization after all retry attempts' } 
  };
}

// Robust update visualization with retry
export async function robustUpdateVisualization(
  id: string,
  updates: any,
  options: RetryOptions = {}
): Promise<{ data: any; error: any }> {
  const { maxAttempts = 3, delayMs = 1000 } = options;
  
  // First, ensure we have a valid session
  const sessionValid = await ensureValidSession(options);
  if (!sessionValid) {
    return { 
      data: null, 
      error: { message: 'Unable to validate authentication session. Please refresh the page.' } 
    };
  }
  
  // Attempt the operation with retry logic
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Update visualization attempt ${attempt}`);
      
      const result = await updateVisualization(id, updates);
      
      if (result.error) {
        // Check if it's an auth error
        if (result.error.message?.includes('not authenticated') || 
            result.error.message?.includes('JWT') ||
            result.error.message?.includes('session')) {
          
          console.warn(`Auth error on attempt ${attempt}, retrying...`);
          
          if (attempt < maxAttempts) {
            // Wait and try to refresh session
            await new Promise(resolve => setTimeout(resolve, delayMs));
            const refreshed = await ensureValidSession({ maxAttempts: 1, delayMs: 500 });
            if (!refreshed) {
              return { 
                data: null, 
                error: { message: 'Session expired. Please refresh the page and try again.' } 
              };
            }
            continue;
          }
        }
        
        // Non-auth error or final attempt
        return result;
      }
      
      // Success!
      console.log(`Update visualization succeeded on attempt ${attempt}`);
      return result;
      
    } catch (error: any) {
      console.error(`Update visualization attempt ${attempt} failed:`, error);
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      
      return { 
        data: null, 
        error: { message: error.message || 'Failed to update visualization after multiple attempts' } 
      };
    }
  }
  
  return { 
    data: null, 
    error: { message: 'Failed to update visualization after all retry attempts' } 
  };
}