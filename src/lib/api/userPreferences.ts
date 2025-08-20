import { supabase } from "@/lib/supabase";

export interface UserPreferences {
  id?: string;
  user_id: string;
  profile_is_public: boolean;
  show_email: boolean;
  show_full_name: boolean;
  default_viz_privacy: 'private' | 'public';
  default_sensitivity: number;
  default_smoothing: number;
  default_color_theme: string;
  default_visualization_type: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
}

export async function getUserPreferences(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no preferences exist, create default ones
      if (error.code === 'PGRST116') {
        return createDefaultPreferences(userId);
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return { data: null, error };
  }
}

export async function createDefaultPreferences(userId: string) {
  try {
    const defaultPrefs: Partial<UserPreferences> = {
      user_id: userId,
      profile_is_public: true,
      show_email: false,
      show_full_name: true,
      default_viz_privacy: 'private',
      default_sensitivity: 0.5,
      default_smoothing: 0.3,
      default_color_theme: 'neon',
      default_visualization_type: 'CIRCLE',
      email_notifications: true,
      push_notifications: false
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .insert(defaultPrefs)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error creating default preferences:', error);
    return { data: null, error };
  }
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<UserPreferences>
) {
  try {
    // Remove fields that shouldn't be updated
    const { id, user_id, ...updateData } = updates;

    const { data, error } = await supabase
      .from('user_preferences')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      // If preferences don't exist, create them with the updates
      if (error.code === 'PGRST116') {
        return createDefaultPreferences(userId);
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return { data: null, error };
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    // First verify current password by attempting to sign in
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      throw updateError;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error changing password:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to change password' 
    };
  }
}

export async function deleteAccount(password: string) {
  try {
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Call the Edge Function to handle deletion with admin privileges
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { password }
    });

    if (error) {
      throw new Error(error.message || 'Failed to delete account');
    }

    if (!data?.success) {
      throw new Error('Account deletion failed');
    }

    // User is automatically signed out by the Edge Function
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete account' 
    };
  }
}