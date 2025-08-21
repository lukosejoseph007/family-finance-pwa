import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Handle OAuth callbacks that might land on the root page
	const code = url.searchParams.get('code');
	if (code) {
		console.log('🔄 OAuth code detected on root page, redirecting to proper callback handler');
		
		// Preserve all query parameters and redirect to the proper auth callback
		const callbackUrl = new URL('/auth/callback', url.origin);
		url.searchParams.forEach((value, key) => {
			callbackUrl.searchParams.set(key, value);
		});
		
		throw redirect(303, callbackUrl.toString());
	}

	// Normal page load - no session needed for landing page
	return {};
};