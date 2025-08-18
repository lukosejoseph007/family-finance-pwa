import { redirect } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, cookies, locals }) => {
	const supabase = locals.supabase ?? createServerClient(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				get: (key) => cookies.get(key),
				set: (key, value, options) => {
					cookies.set(key, value, { ...options, path: '/' });
				},
				remove: (key, options) => {
					cookies.delete(key, { ...options, path: '/' });
				}
			}
		}
	);

	const code = url.searchParams.get('code');
	if (code) {
		try {
			const { data, error } = await supabase.auth.exchangeCodeForSession(code);

			if (error) {
				console.error('Auth callback error:', error);
				throw redirect(303, `/auth/error?message=${encodeURIComponent(error.message)}&pwa=1`);
			}

			// Update user metadata
			if (data?.user) {
				try {
					await supabase.auth.updateUser({
						data: {
							display_name:
								data.user.user_metadata?.full_name ||
								data.user.user_metadata?.display_name,
							full_name:
								data.user.user_metadata?.full_name ||
								data.user.user_metadata?.display_name,
							avatar_url: data.user.user_metadata?.avatar_url
						}
					});
				} catch (updateError) {
					console.warn('Failed to update user metadata:', updateError);
				}

				console.log('Email verified successfully for user:', data.user.email);
			}
		} catch (err) {
			console.error('Unexpected error in auth callback:', err);
			throw redirect(303, '/auth/error?message=Verification failed&pwa=1');
		}
	}

	// Handle PWA-specific redirects
	const isPWA = url.searchParams.has('pwa');
	const next = url.searchParams.get('next') || '/dashboard';

	if (isPWA) {
		throw redirect(303, `${next}?auth_success=1`);
	} else {
		throw redirect(303, next);
	}
};
