import { describe, it, expect, vi } from 'vitest';
import { signUp, signIn, signOut } from './supabaseClient';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js', () => ({
	createClient: vi.fn(() => ({
		auth: {
			signUp: vi.fn(),
			signInWithPassword: vi.fn(),
			signOut: vi.fn()
		},
		from: vi.fn(() => ({
			select: vi.fn(() => ({})),
			insert: vi.fn(() => ({})),
			update: vi.fn(() => ({})),
			delete: vi.fn(() => ({}))
		}))
	}))
}));

describe('supabaseClient', () => {
	describe('signUp', () => {
		it('should call signUp with correct parameters', async () => {
			const mockSignUp = vi.fn().mockResolvedValue({ data: {}, error: null });
			vi.mocked(createClient).mockReturnValue({
				auth: {
					signUp: mockSignUp
				}
			} as any);

			await signUp('test@example.com', 'password');

			expect(mockSignUp).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
		});

		it('should throw an error if signUp fails', async () => {
			const mockSignUp = vi
				.fn()
				.mockResolvedValue({ data: null, error: new Error('Sign up failed') });
			vi.mocked(createClient).mockReturnValue({
				auth: {
					signUp: mockSignUp
				}
			} as any);

			await expect(signUp('test@example.com', 'password')).rejects.toThrow('Sign up failed');
		});
	});

	describe('signIn', () => {
		it('should call signInWithPassword with correct parameters', async () => {
			const mockSignIn = vi.fn().mockResolvedValue({ data: {}, error: null });
			vi.mocked(createClient).mockReturnValue({
				auth: {
					signInWithPassword: mockSignIn
				}
			} as any);

			await signIn('test@example.com', 'password');

			expect(mockSignIn).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password' });
		});

		it('should throw an error if signIn fails', async () => {
			const mockSignIn = vi
				.fn()
				.mockResolvedValue({ data: null, error: new Error('Sign in failed') });
			vi.mocked(createClient).mockReturnValue({
				auth: {
					signInWithPassword: mockSignIn
				}
			} as any);

			await expect(signIn('test@example.com', 'password')).rejects.toThrow('Sign in failed');
		});
	});

	describe('signOut', () => {
		it('should call signOut', async () => {
			const mockSignOut = vi.fn().mockResolvedValue({ error: null });
			vi.mocked(createClient).mockReturnValue({
				auth: {
					signOut: mockSignOut
				}
			} as any);

			await signOut();

			expect(mockSignOut).toHaveBeenCalled();
		});

		it('should throw an error if signOut fails', async () => {
			const mockSignOut = vi.fn().mockResolvedValue({ error: new Error('Sign out failed') });
			vi.mocked(createClient).mockReturnValue({
				auth: {
					signOut: mockSignOut
				}
			} as any);

			await expect(signOut()).rejects.toThrow('Sign out failed');
		});
	});
});
