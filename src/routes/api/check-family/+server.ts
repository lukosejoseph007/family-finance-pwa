import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const session = await locals.supabase.auth.getSession();
  if (!session.data.session) {
    return json({ hasFamily: false }, { status: 401 });
  }

  const { data: userData, error } = await locals.supabase
    .from('users')
    .select('family_id')
    .eq('id', session.data.session.user.id)
    .single();

  if (error || !userData?.family_id) {
    return json({ hasFamily: false }, { status: 200 });
  }

  return json({ hasFamily: true }, { status: 200 });
};