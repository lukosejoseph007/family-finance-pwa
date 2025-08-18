import type { AuthUser } from '$lib/types';

export const getUserDisplayName = (user: AuthUser | null | undefined): string => {
    if (!user) return 'User';
    
    return user.user_metadata?.display_name || 
           user.user_metadata?.full_name ||
           user.identities?.[0]?.identity_data?.name ||
           user.email?.split('@')[0] ||
           'User';
};

export const getUserInitials = (user: AuthUser | null | undefined): string => {
    const name = getUserDisplayName(user);
    return name.split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2); // Limit to 2 characters
};