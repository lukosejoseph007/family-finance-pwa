import { redirect, type RequestEvent } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export async function load({ url, cookies }: RequestEvent) {
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

	const code = url.searchParams.get('code');

	if (code) {
		try {
			const { data, error } = await supabase.auth.exchangeCodeForSession(code);
			
			if (error) {
				console.error('Auth callback error:', error);
				// Use replace instead of redirect for PWA context preservation
				throw redirect(303, `/auth/error?message=${encodeURIComponent(error.message)}&pwa=1`);
			}

			if (data.user) {
				console.log('Email verified successfully for user:', data.user.email);
				
				// Add PWA flag to maintain standalone context
				throw redirect(303, '/onboarding?pwa=1&auth_success=1');
			}
		} catch (err) {
			console.error('Unexpected error in auth callback:', err);
			// Preserve PWA context in error redirects
			throw redirect(303, '/auth/error?message=Verification failed&pwa=1');
		}
	}

	// If no code, redirect to login with PWA preservation
	throw redirect(303, '/login?pwa=1');
}