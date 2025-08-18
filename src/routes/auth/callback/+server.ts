import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/onboarding';

  if (!code) {
    console.log('❌ No authorization code found in callback');
    throw redirect(303, '/login?error=no_code&pwa=1');
  }

  console.log('🔄 Processing OAuth/email callback with code:', code.substring(0, 10) + '...');

  const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => cookies.get(key),
      set: (key, value, options) => cookies.set(key, value, { ...options, path: '/' }),
      remove: (key, options) => cookies.delete(key, { ...options, path: '/' })
    }
  });

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('❌ Callback error:', error);

      // Account linking detection
      if (
        (error.message.includes('email') && error.message.includes('already')) ||
        error.message.includes('verification') ||
        error.message.includes('User already registered')
      ) {
        console.log('🔗 Account linking needed');
        throw redirect(
          303,
          `/login?error=${encodeURIComponent(
            'This email is already registered. Please sign in with your original method, then link your Google account in settings.'
          )}&email=${encodeURIComponent(url.searchParams.get('email') || '')}&pwa=1`
        );
      }

      throw redirect(303, `/login?error=${encodeURIComponent(error.message)}&pwa=1`);
    }

    console.log('✅ Callback successful');
    console.log('👤 User:', data.user?.email);

    if (data.session && data.user) {
      console.log('🎉 User authenticated successfully');

      // Build redirect URL with PWA context preservation
      const redirectUrl = new URL(next, url.origin);
      redirectUrl.searchParams.set('auth_success', 'true');
      redirectUrl.searchParams.set('pwa', '1');

      console.log('↩️ Redirecting back to:', redirectUrl.toString());
      
      // Use 302 redirect to try to maintain PWA context better
      throw redirect(302, redirectUrl.toString());
    } else {
      console.error('❌ Auth succeeded but no session/user data');
      throw redirect(
        303,
        `/login?error=${encodeURIComponent('Authentication completed but session not established')}&pwa=1`
      );
    }
  } catch (err) {
    console.error('❌ Callback processing error:', err);
    if (err instanceof Error && err.message.includes('redirect')) throw err; // Re-throw redirect errors
    throw redirect(303, `/login?error=${encodeURIComponent('Authentication failed')}&pwa=1`);
  }
};