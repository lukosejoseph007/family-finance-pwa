import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export const signUp = async (email: string, password: string) => {
	// Dynamic redirect URL based on current environment
	const redirectUrl = `${window.location.origin}/auth/callback`;
	
	console.log('🚀 Starting signup process...');
	console.log('📧 Email:', email);
	console.log('🔗 Redirect URL:', redirectUrl);
	console.log('🌐 Current origin:', window.location.origin);
	
	const signUpOptions = {
		email,
		password,
		options: {
			emailRedirectTo: redirectUrl
		}
	};
	
	console.log('📝 Signup options:', signUpOptions);
	
	const { data, error } = await supabase.auth.signUp(signUpOptions);
	
	console.log('📊 Raw Supabase response:', { data, error });
	
	if (error) {
		console.error('❌ Sign up error:', error);
		console.error('❌ Error details:', {
			message: error.message,
			status: error.status,
			name: error.name
		});
		throw error;
	}
	
	console.log('✅ Sign up successful!');
	console.log('👤 User data:', data.user);
	console.log('🔐 Session data:', data.session);
	console.log('📧 Email confirmation needed:', !data.session);
	
	return data;
};

export const signIn = async (email: string, password: string) => {
	const { data, error } = await supabase.auth.signInWithPassword({ email, password });
	if (error) {
		console.error('Sign in error:', error);
		throw error;
	}
	return data;
};

export const signOut = async () => {
	const { error } = await supabase.auth.signOut();
	if (error) {
		console.error('Sign out error:', error);
		throw error;
	}
};

export const resetPassword = async (email: string) => {
	const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${window.location.origin}/auth/reset-password`
	});
	if (error) {
		console.error('Reset password error:', error);
		throw error;
	}
	console.log('Reset password email sent successfully');
	return data;
};

export const updatePassword = async (newPassword: string) => {
	const { data, error } = await supabase.auth.updateUser({
		password: newPassword
	});
	if (error) {
		console.error('Update password error:', error);
		throw error;
	}
	console.log('Password updated successfully');
	return data;
};

export const signInWithGoogle = async () => {
	const redirectUrl = `${window.location.origin}/auth/callback`;
	
	console.log('🚀 Starting Google OAuth sign-in...');
	console.log('🔗 Redirect URL:', redirectUrl);
	
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: redirectUrl
		}
	});
	
	if (error) {
		console.error('❌ Google sign-in error:', error);
		throw error;
	}
	
	console.log('✅ Google OAuth initiated successfully');
	return data;
};

export const checkUserExists = async (email: string) => {
	try {
		console.log('🔍 Checking if user exists with email:', email);
		
		// Try to get user by email using a dummy password
		// This will fail but tell us if email exists
		const { error } = await supabase.auth.signInWithPassword({
			email: email,
			password: 'dummy-password-for-checking'
		});
		
		// If we get 'Invalid login credentials', it means email exists but password is wrong
		// If we get 'Email not confirmed', it means email exists but needs confirmation
		if (error) {
			if (error.message.includes('Invalid login credentials') ||
			    error.message.includes('Email not confirmed') ||
			    error.message.includes('Account not found')) {
				return { exists: true, needsConfirmation: error.message.includes('Email not confirmed') };
			}
			return { exists: false, needsConfirmation: false };
		}
		
		return { exists: true, needsConfirmation: false };
	} catch (err) {
		console.error('Error checking user existence:', err);
		return { exists: false, needsConfirmation: false };
	}
};

export const linkGoogleAccount = async () => {
	try {
		console.log('🔗 Starting Google account linking...');
		
		const redirectUrl = `${window.location.origin}/auth/callback?next=/settings`;
		
		const { data, error } = await supabase.auth.linkIdentity({
			provider: 'google',
			options: {
				redirectTo: redirectUrl
			}
		});
		
		if (error) {
			console.error('❌ Google account linking error:', error);
			throw error;
		}
		
		console.log('✅ Google account linking initiated');
		return data;
	} catch (err) {
		console.error('Error linking Google account:', err);
		throw err;
	}
};

export const unlinkGoogleAccount = async () => {
	try {
		console.log('🔗 Unlinking Google account...');
		
		// First get the user to find the Google identity
		const { data: { user }, error: userError } = await supabase.auth.getUser();
		
		if (userError || !user) {
			throw new Error('User not found');
		}
		
		// Find the Google identity
		const googleIdentity = user.identities?.find(identity => identity.provider === 'google');
		
		if (!googleIdentity) {
			throw new Error('Google account not linked');
		}
		
		const { data, error } = await supabase.auth.unlinkIdentity(googleIdentity);
		
		if (error) {
			console.error('❌ Google account unlinking error:', error);
			throw error;
		}
		
		console.log('✅ Google account unlinked successfully');
		return data;
	} catch (err) {
		console.error('Error unlinking Google account:', err);
		throw err;
	}
};

export const getLinkedProviders = async () => {
	try {
		const { data: { user }, error } = await supabase.auth.getUser();
		
		if (error) {
			console.error('Error getting user:', error);
			return [];
		}
		
		if (!user) {
			return [];
		}
		
		// Get all linked identities/providers
		const providers = user.identities?.map(identity => identity.provider) || [];
		console.log('🔗 Linked providers:', providers);
		
		return providers;
	} catch (err) {
		console.error('Error getting linked providers:', err);
		return [];
	}
};
