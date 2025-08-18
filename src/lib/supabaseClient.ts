import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// TypeScript interface for iOS Safari standalone mode
interface NavigatorWithStandalone extends Navigator {
	standalone?: boolean;
}

export const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

// Check if running as PWA
const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as NavigatorWithStandalone).standalone === true ||
         document.referrer.includes('android-app://');
};

// Central redirect target with PWA awareness
const getRedirectTo = (path: string = '/auth/callback') => {
  const baseUrl = `${window.location.origin}${path}`;
  return isPWA() ? `${baseUrl}?pwa=1` : baseUrl;
};

// ------------------ SIGN UP / EMAIL ------------------

export const signUp = async (email: string, password: string) => {
	const redirectTo = getRedirectTo();
	console.log('🚀 Starting signup process...', email, redirectTo);

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: { emailRedirectTo: redirectTo }
	});

	console.log('📊 SignUp response:', { data, error });

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
	console.log('🚀 Starting magic link sign-in...', email);

	const { data, error } = await supabase.auth.signInWithOtp({
		email,
		options: { emailRedirectTo: redirectTo }
	});

	if (error) throw error;
	return data;
};

// ------------------ SIGN OUT ------------------

export const signOut = async () => {
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

export const signInWithProvider = async (provider: 'google' | 'apple' | 'github') => {
	const redirectTo = getRedirectTo();
	console.log(`🚀 Starting ${provider} OAuth sign-in...`);
	console.log('📱 PWA Mode:', isPWA());
	console.log('🔗 Redirect URL:', redirectTo);

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider,
		options: { 
			redirectTo,
			queryParams: { prompt: 'consent' },
			// Add skipBrowserRedirect for PWA to handle auth manually
			skipBrowserRedirect: isPWA()
		}
	});

	if (error) throw error;
	return data;
};

// Convenience wrapper for Google
export const signInWithGoogle = () => signInWithProvider('google');

// ------------------ ACCOUNT CHECK ------------------

export const checkUserExists = async (email: string) => {
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
	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) throw new Error('User not found');

	const googleIdentity = user.identities?.find((i) => i.provider === 'google');
	if (!googleIdentity) throw new Error('Google account not linked');

	const { data, error } = await supabase.auth.unlinkIdentity(googleIdentity);
	if (error) throw error;
	return data;
};

// ------------------ GET LINKED PROVIDERS ------------------

export const getLinkedProviders = async () => {
	const { data: { user }, error } = await supabase.auth.getUser();
	if (error || !user) return [];
	return user.identities?.map((i) => i.provider) || [];
};

// ------------------ PWA SPECIFIC HELPERS ------------------

// Handle OAuth redirect manually for PWA
export const handlePWAOAuthRedirect = async (url: string) => {
	if (!isPWA()) return false;
	
	try {
		// Open OAuth in a popup or external browser
		window.open(url, '_blank');
		return true;
	} catch (error) {
		console.error('Failed to handle PWA OAuth redirect:', error);
		return false;
	}
};

// Listen for auth state changes and handle PWA redirects
export const setupPWAAuthListener = () => {
	if (!isPWA()) return;

	supabase.auth.onAuthStateChange((event, session) => {
		console.log('🔄 Auth state changed in PWA:', event, session?.user?.email);
		
		if (event === 'SIGNED_IN' && session) {
			// Navigate programmatically instead of relying on redirects
			const params = new URLSearchParams(window.location.search);
			const next = params.get('next') || '/onboarding';
			window.location.href = `${next}?auth_success=1&pwa=1`;
		}
	});
};