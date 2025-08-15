import * as auth from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';
// TODO: Re-enable paraglide middleware once the import issue is resolved
// import { paraglideMiddleware } from '@inlang/paraglide-js/server';

// Temporarily disabled paraglide middleware due to import issues
// const handleParaglide: Handle = ({ event, resolve }) =>
// 	paraglideMiddleware(event.request, ({ request, locale }: { request: Request; locale: string }) => {
// 	    event.request = request;
// 	    return resolve(event, {
// 	        transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
// 	    });
// 	});

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const session = await auth.validateSession(sessionToken);

	if (session) {
		// Session is valid, continue
		event.locals.session = session;
		event.locals.user = { id: session.userId }; // Basic user object
	} else {
		// Session is invalid, clear it
		await auth.invalidateSession(sessionToken);
		event.locals.user = null;
		event.locals.session = null;
	}

	return resolve(event);
};

// Temporarily using only handleAuth until paraglide is fixed
export const handle: Handle = handleAuth;
// export const handle: Handle = sequence(handleParaglide, handleAuth);
