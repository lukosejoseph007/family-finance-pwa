import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.search_params.get('next') ?? '/';

	if (code) {
		await supabase.auth.exchangeCodeForSession(code);
	}

	throw redirect(303, `/${next.slice(1)}`);
};
