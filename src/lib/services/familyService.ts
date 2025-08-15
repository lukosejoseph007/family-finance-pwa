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
	console.log('🔗 Generating invite code for family:', familyId);
	// In a real implementation, this would be more secure
	const code = btoa(familyId).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
	console.log('🔗 Generated invite code:', code);
	return code;
}

// Decode invite code
export function decodeInviteCode(inviteCode: string): string | null {
	console.log('🔍 Decoding invite code:', inviteCode);
	try {
		// Simple decode - in production would use proper invite system
		const familyId = atob(inviteCode + '=='.substring(0, (4 - inviteCode.length % 4) % 4));
		console.log('🔍 Decoded family ID:', familyId);
		return familyId;
	} catch (error) {
		console.error('❌ Failed to decode invite code:', error);
		return null;
	}
}

// Join family using invite code
export async function joinFamily(data: JoinFamilyData): Promise<{ family: Family; user: User }> {
	console.log('👥 Attempting to join family with data:', data);
	const { data: authUser, error: authError } = await supabase.auth.getUser();
	
	if (authError || !authUser.user) {
		console.error('❌ User not authenticated:', authError);
		throw new Error('User not authenticated');
	}

	// Decode the invite code to get family ID
	const familyId = decodeInviteCode(data.inviteCode);
	if (!familyId) {
		console.error('❌ Invalid invite code:', data.inviteCode);
		throw new Error('Invalid invite code');
	}

	// Check if family exists
	const family = await getFamily(familyId);
	if (!family) {
		console.error('❌ Family not found for ID:', familyId);
		throw new Error('Family not found or invite code is invalid');
	}

	console.log('✅ Found family:', family.name);

	// Check if user is already a member
	const { data: existingUser } = await supabase
		.from('users')
		.select('*')
		.eq('id', authUser.user.id)
		.eq('family_id', familyId)
		.single();

	if (existingUser) {
		console.log('⚠️ User already member of family');
		throw new Error('You are already a member of this family');
	}

	// Add user to family
	const { data: newUser, error: insertError } = await supabase
		.from('users')
		.insert({
			id: authUser.user.id,
			family_id: familyId,
			email: authUser.user.email!,
			role: 'member',
			display_name: data.displayName || authUser.user.user_metadata?.display_name || authUser.user.email?.split('@')[0]
		})
		.select()
		.single();

	if (insertError) {
		console.error('❌ Error adding user to family:', insertError);
		throw new Error('Failed to join family');
	}

	console.log('✅ Successfully joined family:', family.name);
	return { family, user: newUser };
}

// Search for existing user by email for invitation
export async function searchUserByEmail(email: string): Promise<{ exists: boolean; displayName?: string }> {
	console.log('🔍 Searching for user by email:', email);
	
	// Note: In Supabase, we can't directly query auth.users, so we'll search in our users table
	const { data: user, error } = await supabase
		.from('users')
		.select('display_name, email')
		.eq('email', email)
		.single();

	if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
		console.error('❌ Error searching for user:', error);
		throw new Error('Failed to search for user');
	}

	const exists = !!user;
	console.log('🔍 User exists:', exists, user?.display_name);
	
	return {
		exists,
		displayName: user?.display_name
	};
}

// Send email invitation (placeholder - would integrate with email service)
export async function sendEmailInvitation(familyName: string, inviteCode: string, recipientEmail: string, senderName: string): Promise<void> {
	console.log('📧 Sending email invitation:', { familyName, inviteCode, recipientEmail, senderName });
	
	// This is a placeholder - in production you would integrate with:
	// - SendGrid, Resend, or another email service
	// - Store invitation records in database
	// - Handle invitation expiry and tracking
	
	// For now, we'll just log the email content
	const emailContent = `
		Subject: Join "${familyName}" on Family Finance
		
		Hi!
		
		${senderName} has invited you to join their family "${familyName}" on Family Finance.
		
		To join:
		1. Sign up or log in at [Your App URL]
		2. Enter this invite code: ${inviteCode}
		
		Best regards,
		Family Finance Team
	`;
	
	console.log('📧 Email content (would be sent):', emailContent);
	
	// Simulate email sending delay
	await new Promise(resolve => setTimeout(resolve, 1000));
	
	console.log('✅ Email invitation sent successfully');
}