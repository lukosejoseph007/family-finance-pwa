import { supabase } from '$lib/supabaseClient';
import type { Family, User } from '../types';

export interface CreateFamilyData {
	name: string;
	settings?: {
		currency?: string;
		date_format?: string;
		start_of_week?: number;
		timezone?: string;
	};
}

export interface JoinFamilyData {
	inviteCode: string;
	displayName: string;
}

// Create a new family and add the current user as admin
export async function createFamily(data: CreateFamilyData): Promise<Family> {
	const { data: authUser, error: authError } = await supabase.auth.getUser();
	
	if (authError || !authUser.user) {
		throw new Error('User not authenticated');
	}

	// Use the stored procedure to create family and user atomically
	// Allow replacing existing family membership for development/testing
	const { data: result, error } = await supabase.rpc('create_family_with_admin', {
		family_name: data.name,
		user_id: authUser.user.id,
		user_email: authUser.user.email!,
		user_display_name: authUser.user.user_metadata?.display_name || authUser.user.email?.split('@')[0],
		allow_replace: true // Allow replacing existing family membership
	});

	if (error) {
		console.error('Error creating family:', error);
		throw new Error(`Failed to create family: ${error.message}`);
	}

	return result as Family;
}

// Add user to family
export async function addUserToFamily(familyId: string, userId: string, role: 'admin' | 'member' | 'viewer' = 'member'): Promise<User> {
	const { data: user, error } = await supabase.auth.getUser();
	
	if (error || !user.user) {
		throw new Error('User not authenticated');
	}

	const { data: familyUser, error: insertError } = await supabase
		.from('users')
		.insert({
			id: userId,
			family_id: familyId,
			email: user.user.email!,
			role: role,
			display_name: user.user.user_metadata?.display_name || user.user.email?.split('@')[0]
		})
		.select()
		.single();

	if (insertError) {
		console.error('Error adding user to family:', insertError);
		throw new Error('Failed to add user to family');
	}

	return familyUser;
}

// Get family by ID
export async function getFamily(familyId: string): Promise<Family | null> {
	const { data: family, error } = await supabase
		.from('families')
		.select('*')
		.eq('id', familyId)
		.single();

	if (error) {
		console.error('Error fetching family:', error);
		return null;
	}

	return family;
}

// Get user's family information
export async function getUserFamily(): Promise<{ family: Family; user: User } | null> {
	const { data: authUser, error: authError } = await supabase.auth.getUser();
	
	if (authError || !authUser.user) {
		return null;
	}

	const { data: user, error: userError } = await supabase
		.from('users')
		.select(`
			*,
			families (*)
		`)
		.eq('id', authUser.user.id)
		.single();

	if (userError || !user) {
		return null;
	}

	return {
		family: user.families,
		user: user
	};
}

// Get family members
export async function getFamilyMembers(familyId: string): Promise<User[]> {
	const { data: members, error } = await supabase
		.from('users')
		.select('*')
		.eq('family_id', familyId)
		.order('role', { ascending: true })
		.order('created_at', { ascending: true });

	if (error) {
		console.error('Error fetching family members:', error);
		throw new Error('Failed to fetch family members');
	}

	return members || [];
}

// Update family settings
export async function updateFamilySettings(familyId: string, settings: Partial<Family['settings']>): Promise<Family> {
	const { data: family, error } = await supabase
		.from('families')
		.update({ settings })
		.eq('id', familyId)
		.select()
		.single();

	if (error) {
		console.error('Error updating family settings:', error);
		throw new Error('Failed to update family settings');
	}

	return family;
}

// Update user role in family
export async function updateUserRole(userId: string, role: 'admin' | 'member' | 'viewer'): Promise<User> {
	const { data: user, error } = await supabase
		.from('users')
		.update({ role })
		.eq('id', userId)
		.select()
		.single();

	if (error) {
		console.error('Error updating user role:', error);
		throw new Error('Failed to update user role');
	}

	return user;
}

// Remove user from family
export async function removeUserFromFamily(userId: string): Promise<void> {
	const { error } = await supabase
		.from('users')
		.delete()
		.eq('id', userId);

	if (error) {
		console.error('Error removing user from family:', error);
		throw new Error('Failed to remove user from family');
	}
}

// Generate family invite code (simple implementation)
export function generateInviteCode(familyId: string): string {
	// In a real implementation, this would be more secure
	return btoa(familyId).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
}

// Decode invite code
export function decodeInviteCode(inviteCode: string): string | null {
	try {
		// Simple decode - in production would use proper invite system
		return atob(inviteCode + '=='.substring(0, (4 - inviteCode.length % 4) % 4));
	} catch {
		return null;
	}
}