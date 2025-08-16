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
				throw redirect(303, `/auth/error?message=${encodeURIComponent(error.message)}`);
			}

			if (data.user) {
				console.log('Email verified successfully for user:', data.user.email);
				
				// Check if user has pending invite code from session storage
				// This will be handled on the client side
				throw redirect(303, '/onboarding');
			}
		} catch (err) {
			console.error('Unexpected error in auth callback:', err);
			throw redirect(303, '/auth/error?message=Verification failed');
		}
	}

	// If no code, redirect to login
	throw redirect(303, '/login');
}