import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase }, url }) => {
	const { session } = await safeGetSession();

	if (!session) {
		redirect(303, '/');
	}

	// Check if user has a family (unless they're on the onboarding page)
	if (url.pathname !== '/onboarding') {
		try {
			const { data: user, error: userError } = await supabase
				.from('users')
				.select('family_id')
				.eq('id', session.user.id)
				.single();

			// Log any errors for debugging
			if (userError) {
				console.error('❌ Error fetching user family:', userError);
				console.log('🔍 User ID:', session.user.id);
				// Redirect to onboarding if there's an error fetching user data
				redirect(303, '/onboarding');
			}

			// If user doesn't exist in users table or doesn't have a family, redirect to onboarding
			if (!user || !user.family_id) {
				redirect(303, '/onboarding');
			}
		} catch (error) {
			console.error('❌ Unexpected error checking user family:', error);
			// Redirect to onboarding if there's an unexpected error
			redirect(303, '/onboarding');
		}
	}

	return { session };
};
