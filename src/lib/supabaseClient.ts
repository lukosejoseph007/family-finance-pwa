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
