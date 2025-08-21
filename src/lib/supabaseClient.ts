import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// TypeScript interface for iOS Safari standalone mode
interface NavigatorWithStandalone extends Navigator {
	standalone?: boolean;
}

type AuthProvider = 'google' | 'apple' | 'github';

interface UserProfileUpdates {
	displayName?: string;
	avatarUrl?: string;
}

interface UserExistsResponse {
	exists: boolean;
	needsConfirmation: boolean;
}

export const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

// Check if running as PWA
const isPWA = (): boolean => {
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		(window.navigator as NavigatorWithStandalone).standalone === true ||
		document.referrer.includes('android-app://')
	);
};

// Central redirect target with PWA awareness
const getRedirectTo = (path: string = '/auth/callback'): string => {
	const baseUrl = `${window.location.origin}${path}`;
	return isPWA() ? `${baseUrl}?pwa=1` : baseUrl;
};

// ------------------ SIGN UP / EMAIL ------------------

export const signUp = async (email: string, password: string, displayName: string) => {
	const redirectTo = getRedirectTo();

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: redirectTo,
			data: {
				display_name: displayName,
				full_name: displayName
			}
		}
	});

	if (error) throw error;
	return data;
};

// ------------------ EMAIL / PASSWORD SIGN IN ------------------

export const signIn = async (email: string, password: string) => {
	const { data, error } = await supabase.auth.signInWithPassword({ email, password });
	if (error) throw error;
	return data;
};

// ------------------ MAGIC LINK / PASSWORDLESS ------------------

export const signInWithMagicLink = async (email: string) => {
	const redirectTo = getRedirectTo();
	const { data, error } = await supabase.auth.signInWithOtp({
		email,
		options: { emailRedirectTo: redirectTo }
	});

	if (error) throw error;
	return data;
};

// ------------------ SIGN OUT ------------------

export const signOut = async (): Promise<void> => {
	const { error } = await supabase.auth.signOut();
	if (error) throw error;
};

// ------------------ PASSWORD RESET ------------------

export const resetPassword = async (email: string) => {
	const redirectTo = getRedirectTo('/auth/reset-password');
	const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo
	});
	if (error) throw error;
	return data;
};

export const updatePassword = async (newPassword: string) => {
	const { data, error } = await supabase.auth.updateUser({ password: newPassword });
	if (error) throw error;
	return data;
};

// ------------------ OAUTH SIGN IN ------------------

export const signInWithProvider = async (provider: AuthProvider) => {
	const redirectTo = getRedirectTo();

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider,
		options: {
			redirectTo,
			queryParams: {
				prompt: 'consent',
				access_type: 'offline'
			},
			skipBrowserRedirect: isPWA()
		}
	});

	if (error) throw error;
	return data;
};

// Updated convenience wrappers
export const signInWithGoogle = () => signInWithProvider('google');
export const signInWithApple = () => signInWithProvider('apple');
export const signInWithGithub = () => signInWithProvider('github');

// ------------------ ACCOUNT CHECK ------------------

export const checkUserExists = async (email: string): Promise<UserExistsResponse> => {
	try {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password: 'dummy-password-for-checking'
		});

		if (error) {
			if (
				error.message.includes('Invalid login credentials') ||
				error.message.includes('Email not confirmed') ||
				error.message.includes('Account not found')
			) {
				return { exists: true, needsConfirmation: error.message.includes('Email not confirmed') };
			}
			return { exists: false, needsConfirmation: false };
		}
		return { exists: true, needsConfirmation: false };
	} catch {
		return { exists: false, needsConfirmation: false };
	}
};

// ------------------ LINK / UNLINK OAUTH ------------------

export const linkGoogleAccount = async () => {
	const redirectTo = getRedirectTo('/auth/callback?next=/settings');
	const { data, error } = await supabase.auth.linkIdentity({
		provider: 'google',
		options: {
			redirectTo,
			skipBrowserRedirect: isPWA()
		}
	});
	if (error) throw error;
	return data;
};

export const unlinkGoogleAccount = async () => {
	const {
		data: { user },
		error: userError
	} = await supabase.auth.getUser();
	if (userError || !user) throw new Error('User not found');

	const googleIdentity = user.identities?.find((i) => i.provider === 'google');
	if (!googleIdentity) throw new Error('Google account not linked');

	const { data, error } = await supabase.auth.unlinkIdentity(googleIdentity);
	if (error) throw error;
	return data;
};

// ------------------ GET LINKED PROVIDERS ------------------

export const getLinkedProviders = async (): Promise<string[]> => {
	const {
		data: { user },
		error
	} = await supabase.auth.getUser();
	if (error || !user) return [];
	return user.identities?.map((i) => i.provider) || [];
};

// ------------------ USER METADATA HELPERS ------------------

export const updateUserProfile = async (updates: UserProfileUpdates) => {
	const { data, error } = await supabase.auth.updateUser({
		data: {
			display_name: updates.displayName,
			full_name: updates.displayName,
			avatar_url: updates.avatarUrl
		}
	});

	if (error) throw error;
	return data;
};

export const refreshSession = async () => {
	const { data, error } = await supabase.auth.refreshSession();
	if (error) throw error;
	return data;
};
