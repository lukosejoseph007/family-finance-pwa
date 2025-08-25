import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { getSession, supabase }, url }) => {
	const session = await getSession();

	if (session && url.pathname !== '/onboarding') {
		const { data: user, error } = await supabase
			.from('users')
			.select('family_id')
			.eq('id', session.user.id)
			.single();

		if (error && error.code !== 'PGRST116') {
			throw new Error('Failed to fetch user data');
		}

		if (!user) {
			const { error: insertError } = await supabase.from('users').insert({
				id: session.user.id,
				email: session.user.email!,
				display_name:
					session.user.user_metadata?.display_name ||
					session.user.user_metadata?.full_name ||
					session.user.email?.split('@')[0]
			});

			if (insertError) {
				throw new Error('Failed to create user profile');
			}
			throw redirect(303, '/onboarding');
		}

		if (!user.family_id) {
			throw redirect(303, '/onboarding');
		}
	}

	return { session };
};