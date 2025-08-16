import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/onboarding';

	if (code) {
		console.log('🔄 Processing OAuth callback with code:', code.substring(0, 10) + '...');
		
		const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			cookies: {
				get: (key) => cookies.get(key),
				set: (key, value, options) => {
					cookies.set(key, value, { ...options, path: '/' });
				},
				remove: (key, options) => {
					cookies.delete(key, { ...options, path: '/' });
				}
			}
		});

		try {
			const { data, error } = await supabase.auth.exchangeCodeForSession(code);
			
			if (error) {
				console.error('❌ OAuth callback error:', error);
				
				// Check if this is an account linking issue (email already exists)
				if (error.message.includes('email') && error.message.includes('already') ||
				    error.message.includes('verification') ||
				    error.message.includes('User already registered')) {
					console.log('🔗 Account linking needed - email already exists with different provider');
					throw redirect(303, `/login?error=${encodeURIComponent('This email is already registered. Please sign in with your original method (email/password), then link your Google account in settings.')}&email=${encodeURIComponent(url.searchParams.get('email') || '')}`);
				}
				
				throw redirect(303, `/login?error=${encodeURIComponent(error.message)}`);
			}

			console.log('✅ OAuth callback successful');
			console.log('👤 User:', data.user?.email);
			
			// Verify the session was established successfully
			if (data.session && data.user) {
				console.log('🎉 User authenticated successfully via OAuth');
				console.log('📧 User email:', data.user.email);
				console.log('🔑 Session established:', !!data.session.access_token);
				
				// Add a success parameter to indicate successful authentication
				const redirectUrl = new URL(next, url.origin);
				redirectUrl.searchParams.set('oauth_success', 'true');
				
				throw redirect(303, redirectUrl.toString());
			} else {
				console.error('❌ OAuth succeeded but no session/user data');
				throw redirect(303, `/login?error=${encodeURIComponent('Authentication completed but session not established')}`);
			}
		} catch (err) {
			console.error('❌ OAuth callback processing error:', err);
			if (err instanceof Error && err.message.includes('redirect')) {
				throw err; // Re-throw redirect errors
			}
			throw redirect(303, `/login?error=${encodeURIComponent('Authentication failed')}`);
		}
	}

	console.log('❌ No authorization code found in callback');
	throw redirect(303, '/login?error=no_code');
};