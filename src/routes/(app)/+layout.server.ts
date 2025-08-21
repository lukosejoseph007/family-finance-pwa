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
				
				// If user doesn't exist in users table, create them first
				if (userError.code === 'PGRST116') { // No rows returned
					console.log('🔧 User not found in users table, creating user record...');
					try {
						const { error: insertError } = await supabase
							.from('users')
							.insert({
								id: session.user.id,
								email: session.user.email!,
								display_name: session.user.user_metadata?.display_name ||
											  session.user.user_metadata?.full_name ||
											  session.user.email?.split('@')[0],
								created_at: new Date().toISOString(),
								updated_at: new Date().toISOString()
							});
						
						if (insertError) {
							console.error('❌ Failed to create user record:', insertError);
						} else {
							console.log('✅ User record created successfully');
						}
					} catch (createError) {
						console.error('❌ Error creating user record:', createError);
					}
				}
				
				// Redirect to onboarding regardless to let them set up properly
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
