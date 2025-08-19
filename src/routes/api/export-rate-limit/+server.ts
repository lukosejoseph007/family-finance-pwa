import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const session = await locals.supabase.auth.getSession();
    if (!session.data.session) {
      return json({ remaining: 0 });
    }

    const userId = session.data.session.user.id;

    const { count, error } = await locals.supabase
      .from('export_requests')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .gte('requested_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Rate limit check error:', error);
      return json({ remaining: 10 }); // Default to max on error
    }

    const remaining = Math.max(0, 10 - (count || 0));
    
    return json({ remaining });
  } catch (error) {
    console.error('Rate limit endpoint error:', error);
    return json({ remaining: 10 });
  }
};