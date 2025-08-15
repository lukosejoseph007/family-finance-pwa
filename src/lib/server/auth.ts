import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db, isDatabaseConnected } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { supabase } from '$lib/supabaseClient';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	console.log('Generated session token:', token);
	return token;
}

export async function createSession(token: string, userId: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	console.log('Creating session with token:', token, 'and user ID:', userId);

	const session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 7)
	};

	if (isDatabaseConnected() && db) {
		try {
			await db.insert(table.sessions).values(session);
			console.log('Session created in database:', session);
		} catch (error) {
			console.error('Failed to create session in database:', error);
			console.log('Session created in-memory only:', session);
		}
	} else {
		console.log('Database not available - session created in-memory only:', session);
	}

	return session;
}

export async function validateSession(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	console.log('Validating session with token:', token);

	if (isDatabaseConnected() && db) {
		try {
			const sessions = await db
				.select()
				.from(table.sessions)
				.where(eq(table.sessions.id, sessionId))
				.limit(1);
			const session = sessions[0] || null;

			if (!session || session.expiresAt < new Date()) {
				console.log('Session is invalid or expired:', session);
				return null;
			}

			console.log('Session is valid:', session);
			return session;
		} catch (error) {
			console.error('Failed to validate session in database:', error);
			console.log('Session validation failed - database error');
			return null;
		}
	} else {
		console.log('Database not available - session validation disabled');
		return null;
	}
}

export async function invalidateSession(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	console.log('Invalidating session with token:', token);

	if (isDatabaseConnected() && db) {
		try {
			await db.delete(table.sessions).where(eq(table.sessions.id, sessionId));
			console.log('Session invalidated in database');
		} catch (error) {
			console.error('Failed to invalidate session in database:', error);
			console.log('Session invalidation failed - database error');
		}
	} else {
		console.log('Database not available - session invalidated in-memory only');
	}
}

export async function signUp(email: string, password: string) {
	const { data, error } = await supabase.auth.signUp({
		email,
		password
	});

	if (error) {
		throw error;
	}

	if (data.user) {
		const session = await createSession(generateSessionToken(), data.user.id);
		return { user: data.user, session };
	}

	return { user: null, session: null };
}

export async function signIn(email: string, password: string) {
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password
	});

	if (error) {
		throw error;
	}

	if (data.user) {
		const session = await createSession(generateSessionToken(), data.user.id);
		return { user: data.user, session };
	}

	return { user: null, session: null };
}

export async function signOut() {
	const { error } = await supabase.auth.signOut();

	if (error) {
		throw error;
	}

	await invalidateSession(generateSessionToken());
}
