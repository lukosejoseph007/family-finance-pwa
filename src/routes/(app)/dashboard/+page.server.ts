import type { PageServerLoad } from './$types';
import type { Family } from '$lib/types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	console.log('🔍 Dashboard +page.server.ts: Starting load function');
	
	try {
		// Get session from parent layout
		const { session } = await parent();
		console.log('🔍 Dashboard: Session check -', session?.user ? 'User found' : 'No user');
		
		if (!session?.user) {
			console.error('❌ Dashboard: No session or user found');
			throw new Error('Unauthorized');
		}

		console.log('🔍 Dashboard: User ID:', session.user.id);
		console.log('🔍 Dashboard: User email:', session.user.email);

		// Use locals.supabase which has proper session context
		console.log('🔍 Dashboard: Fetching family data with server-side Supabase client...');
		
		const { data: user, error: userError } = await locals.supabase
			.from('users')
			.select(`
				*,
				families (*)
			`)
			.eq('id', session.user.id)
			.single();

		console.log('🔍 Dashboard: User query result');
		console.log('  - User error:', userError);
		console.log('  - User data:', user ? 'Found' : 'Null');
		console.log('  - User families:', user?.families ? 'Found' : 'Null');
		
		if (userError || !user || !user.families) {
			console.error('❌ Dashboard: Failed to fetch user/family data:', userError);
			throw new Error('Family not found');
		}

		const family: Family = user.families;
		console.log('🔍 Dashboard: Family found:', family.name);
		console.log('🔍 Dashboard: Family settings:', family.settings);

		// Fetch categories using server-side client
		console.log('🔍 Dashboard: Fetching categories with server-side Supabase client...');
		const { data: categories, error: categoriesError } = await locals.supabase
			.from('categories')
			.select('*')
			.eq('family_id', user.family_id)
			.order('type', { ascending: true })
			.order('name', { ascending: true });

		console.log('🔍 Dashboard: Categories query result');
		console.log('  - Categories error:', categoriesError);
		console.log('  - Categories count:', categories?.length || 0);

		if (categoriesError) {
			console.error('❌ Dashboard: Failed to fetch categories:', categoriesError);
			throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
		}

		const result = {
			settings: family.settings,
			categories: categories || []
		};
		
		console.log('✅ Dashboard: Load function completed successfully');
		return result;
		
	} catch (error) {
		console.error('❌ Dashboard +page.server.ts: Error in load function:', error);
		console.error('❌ Dashboard: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
		throw error;
	}
};