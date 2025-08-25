import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signUp, signIn, signOut } from './supabaseClient';
import * as supabaseSSR from '@supabase/ssr';

// Type definitions for test mocks
interface MockSupabaseClient {
	auth: {
		signUp: ReturnType<typeof vi.fn>;
		signInWithPassword: ReturnType<typeof vi.fn>;
		signOut: ReturnType<typeof vi.fn>;
	};
	from: ReturnType<typeof vi.fn>;
}

// Mock the window object
global.window = {
	location: {
		origin: 'http://localhost:5173'
	}
} as unknown as Window & typeof globalThis;

describe('supabaseClient', () => {
	const mockSignUp = vi.fn();
	const mockSignIn = vi.fn();
	const mockSignOut = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(supabaseSSR, 'createBrowserClient').mockReturnValue({
			auth: {
				signUp: mockSignUp,
				signInWithPassword: mockSignIn,
				signOut: mockSignOut
			},
			from: vi.fn(() => ({
				select: vi.fn(() => ({})),
				insert: vi.fn(() => ({})),
				update: vi.fn(() => ({})),
				delete: vi.fn(() => ({}))
			}))
		} as MockSupabaseClient);
	});

	describe('signUp', () => {
		it('should call signUp with correct parameters', async () => {
			mockSignUp.mockResolvedValue({ data: {}, error: null });
			await signUp('test@example.com', 'password', 'Test User');

			expect(mockSignUp).toHaveBeenCalledWith({
				email: 'test@example.com',
				password: 'password',
				options: {
					emailRedirectTo: 'http://localhost:5173/auth/callback',
					data: {
						display_name: 'Test User',
						full_name: 'Test User'
					}
				}
			});
		});

		it('should throw an error if signUp fails', async () => {
			mockSignUp.mockResolvedValue({ data: null, error: new Error('Sign up failed') });

			await expect(signUp('test@example.com', 'password', 'Test User')).rejects.toThrow('Sign up failed');
		});
	});

	describe('signIn', () => {
		it('should call signInWithPassword with correct parameters', async () => {
			mockSignIn.mockResolvedValue({ data: {}, error: null });
			await signIn('test@example.com', 'password');

			expect(mockSignIn).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
		});

		it('should throw an error if signIn fails', async () => {
			mockSignIn.mockResolvedValue({ data: null, error: new Error('Sign in failed') });

			await expect(signIn('test@example.com', 'password')).rejects.toThrow('Sign in failed');
		});
	});

	describe('signOut', () => {
		it('should call signOut', async () => {
			mockSignOut.mockResolvedValue({ error: null });
			await signOut();

			expect(mockSignOut).toHaveBeenCalled();
		});

		it('should throw an error if signOut fails', async () => {
			mockSignOut.mockResolvedValue({ error: new Error('Sign out failed') });

			await expect(signOut()).rejects.toThrow('Sign out failed');
		});
	});
});
