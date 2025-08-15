/**
 * Environment Configuration
 * Centralized management of environment variables
 */

// Supabase Configuration
export const SUPABASE_CONFIG = {
	url: import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
	anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key',
	authRedirectUrl: import.meta.env.VITE_AUTH_REDIRECT_URL || 'http://localhost:5173/auth/callback'
} as const;

// App Configuration
export const APP_CONFIG = {
	title: import.meta.env.VITE_APP_TITLE || 'Family Finance Tracker',
	description:
		import.meta.env.VITE_APP_DESCRIPTION || 'A comprehensive family finance tracking application',
	version: import.meta.env.VITE_APP_VERSION || '1.0.0',
	environment: import.meta.env.NODE_ENV || 'development',
	isDevelopment: import.meta.env.NODE_ENV === 'development',
	isProduction: import.meta.env.NODE_ENV === 'production'
} as const;

// Debug Configuration
export const DEBUG_CONFIG = {
	enabled: import.meta.env.VITE_DEBUG === 'true' || false,
	logLevel: import.meta.env.VITE_LOG_LEVEL || 'info'
} as const;

// Push Notifications Configuration
export const NOTIFICATION_CONFIG = {
	vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || '',
	enabled: Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY)
} as const;

// Analytics Configuration
export const ANALYTICS_CONFIG = {
	id: import.meta.env.VITE_ANALYTICS_ID || '',
	enabled: Boolean(import.meta.env.VITE_ANALYTICS_ID)
} as const;

// Validation function to check if required environment variables are set
export function validateEnvironment(): { isValid: boolean; missingVars: string[] } {
	const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

	const missingVars = requiredVars.filter((varName) => {
		const value = import.meta.env[varName];
		return !value || value.includes('placeholder') || value.includes('your-');
	});

	return {
		isValid: missingVars.length === 0,
		missingVars
	};
}

// Development utilities
export const DEV_UTILS = {
	log: (...args: unknown[]) => {
		if (DEBUG_CONFIG.enabled && APP_CONFIG.isDevelopment) {
			console.log('[Family Finance Tracker]', ...args);
		}
	},
	warn: (...args: unknown[]) => {
		if (DEBUG_CONFIG.enabled && APP_CONFIG.isDevelopment) {
			console.warn('[Family Finance Tracker]', ...args);
		}
	},
	error: (...args: unknown[]) => {
		if (DEBUG_CONFIG.enabled && APP_CONFIG.isDevelopment) {
			console.error('[Family Finance Tracker]', ...args);
		}
	}
};

// Environment check on module load
if (APP_CONFIG.isDevelopment) {
	const { isValid, missingVars } = validateEnvironment();
	if (!isValid) {
		DEV_UTILS.warn('Missing or invalid environment variables:', missingVars);
		DEV_UTILS.warn('Please check your .env file and update with proper values');
	}
}
