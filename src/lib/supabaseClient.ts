import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, DEV_UTILS } from '$lib/config/env';

DEV_UTILS.log('Supabase Configuration:', {
  url: SUPABASE_CONFIG.url,
  hasAnonKey: Boolean(SUPABASE_CONFIG.anonKey && !SUPABASE_CONFIG.anonKey.includes('placeholder'))
});

export const supabase: SupabaseClient = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    console.error('Sign up error:', error);
    throw error;
  }
  console.log('Sign up success:', data);
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Sign in error:', error);
    throw error;
  }
  console.log('Sign in success:', data);
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
    throw error;
  }
  console.log('Sign out success');
};