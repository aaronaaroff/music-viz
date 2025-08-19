// Utility functions for profile data

export interface ProfileData {
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
}

/**
 * Get display name, prioritizing full_name over username
 */
export function getDisplayName(profile: ProfileData | null | undefined, fallback = 'User'): string {
  if (!profile) return fallback;
  return profile.full_name || profile.username || fallback;
}

/**
 * Get initials for avatar, prioritizing full_name over username
 */
export function getInitials(profile: ProfileData | null | undefined, fallback = 'U'): string {
  if (!profile) return fallback.charAt(0).toUpperCase();
  
  const name = profile.full_name || profile.username;
  if (!name) return fallback.charAt(0).toUpperCase();
  
  // For full names, get first letter of each word
  if (profile.full_name) {
    const words = profile.full_name.trim().split(/\s+/);
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
  }
  
  // For username or single name, just first letter
  return name.charAt(0).toUpperCase();
}