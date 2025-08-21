// Fixed familyService.ts - Complete version with corrected invite code system
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

// Create a new family using the stored function (RECOMMENDED)
export async function createFamily(data: CreateFamilyData): Promise<Family> {
  const { data: authUser, error: authError } = await supabase.auth.getUser();
  
  if (authError || !authUser.user) {
    throw new Error('User not authenticated');
  }

  console.log('🏗️ Creating family using stored function:', data.name);
  console.log('🆔 User ID:', authUser.user.id);
  console.log('📧 User email:', authUser.user.email);
  
  try {
    // Use the stored function instead of direct insert
    const { data: result, error } = await supabase.rpc('create_family_with_admin', {
      family_name: data.name,
      user_id: authUser.user.id,
      user_email: authUser.user.email!,
      user_display_name: authUser.user.user_metadata?.display_name || authUser.user.email?.split('@')[0]
    });
    
    if (error) {
      console.log('❌ Error creating family:', error);
      throw new Error(`Failed to create family: ${error.message}`);
    }
    
    console.log('✅ Family created successfully:', result);
    return result;
    
  } catch (error: any) {
    console.log('❌ Family creation failed:', error);
    throw error;
  }
}

// Fixed: Generate deterministic invite code from family ID
export function generateInviteCode(familyId: string): string {
  console.log('🔗 Generating invite code for family:', familyId);
  
  // Remove hyphens and convert to uppercase
  const cleanId = familyId.replace(/-/g, '').toUpperCase();
  
  // Take first 8 characters and ensure we have enough characters
  if (cleanId.length < 8) {
    throw new Error('Invalid family ID format');
  }
  
  // Create a more reliable 8-character code
  const code = cleanId.substring(0, 8);
  
  console.log('🔗 Generated invite code:', code, 'for family:', familyId);
  return code;
}

// Fixed: Decode invite code back to family ID (reverse engineering)
export function decodeInviteCode(inviteCode: string): string | null {
  console.log('🔍 Attempting to decode invite code:', inviteCode);
  
  if (!inviteCode || inviteCode.length !== 8) {
    console.log('❌ Invalid invite code format - must be 8 characters');
    return null;
  }
  
  // Since we can't reliably reverse engineer the full UUID from just 8 characters,
  // we'll need to search through families. This function returns the cleaned code
  // for use in findFamilyByInviteCode
  return inviteCode.toUpperCase();
}

// Improved: Find family by invite code with better error handling
export async function findFamilyByInviteCode(inviteCode: string): Promise<Family | null> {
  console.log('🔍 Finding family by invite code:', inviteCode);
  
  if (!inviteCode || inviteCode.length !== 8) {
    console.log('❌ Invalid invite code format');
    return null;
  }
  
  try {
    // Get all families and generate their codes to find match
    const { data: families, error } = await supabase
      .from('families')
      .select('*')
      .order('created_at', { ascending: false }); // Get most recent first
    
    if (error) {
      console.error('❌ Error fetching families:', error);
      throw new Error('Failed to validate invite code');
    }
    
    if (!families || families.length === 0) {
      console.log('❌ No families found in database');
      return null;
    }
    
    console.log(`🔍 Checking ${families.length} families for matching invite code`);
    
    // Check each family to see if invite code matches
    for (const family of families) {
      try {
        const familyCode = generateInviteCode(family.id);
        console.log(`Checking family "${family.name}" (${family.id}) - code: ${familyCode}`);
        
        if (familyCode === inviteCode.toUpperCase()) {
          console.log('✅ Found matching family:', family.name);
          return family;
        }
      } catch (error) {
        console.warn('⚠️ Error generating code for family:', family.id, error);
        continue; // Skip this family and continue checking others
      }
    }
    
    console.log('❌ No family found for invite code:', inviteCode);
    return null;
    
  } catch (error) {
    console.error('❌ Error in findFamilyByInviteCode:', error);
    throw error;
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

  // Find family by invite code using improved method
  const family = await findFamilyByInviteCode(data.inviteCode);
  if (!family) {
    console.error('❌ Invalid invite code:', data.inviteCode);
    throw new Error('Invalid invite code - family not found');
  }

  console.log('✅ Found family:', family.name);

  // Check if user is already a member
  const { data: existingUser, error: existingError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.user.id)
    .eq('family_id', family.id)
    .maybeSingle();

  if (existingError) {
    console.error('❌ Error checking existing user:', existingError);
    throw new Error('Failed to check existing membership');
  }

  if (existingUser) {
    console.log('⚠️ User already member of family');
    throw new Error('You are already a member of this family');
  }

  try {
    // Add user to family using direct insert
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        family_id: family.id,
        email: authUser.user.email!,
        role: 'member',
        display_name: data.displayName || authUser.user.user_metadata?.display_name || authUser.user.email?.split('@')[0]
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error adding user to family:', insertError);
      
      // Provide more specific error messages
      if (insertError.code === '23505') {
        throw new Error('You are already a member of this family');
      } else if (insertError.code === '23503') {
        throw new Error('Invalid family or user data');
      } else {
        throw new Error('Failed to join family: ' + (insertError.message || 'Unknown error'));
      }
    }

    console.log('✅ Successfully joined family:', family.name);
    return { family, user: newUser };
    
  } catch (error: any) {
    console.error('❌ Error in joinFamily:', error);
    throw error;
  }
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

  if (userError || !user || !user.families) {
    return null;
  }

  return {
    family: user.families,
    user: user
  };
}

// Get family by ID
export async function getFamily(familyId: string): Promise<Family | null> {
  try {
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
  } catch (error) {
    console.error('Error in getFamily:', error);
    return null;
  }
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

// Update family settings
export async function updateFamilySettings(familyId: string, updates: { name?: string; settings?: Partial<Family['settings']> }): Promise<Family> {
  console.log('📝 Updating family:', familyId, updates);
  
  const updateData: { name?: string; settings?: Partial<Family['settings']> } = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.settings !== undefined) updateData.settings = updates.settings;

  const { data: family, error } = await supabase
    .from('families')
    .update(updateData)
    .eq('id', familyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating family:', error);
    throw new Error('Failed to update family settings');
  }

  console.log('✅ Family updated successfully:', family);
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

// Leave family (for current user with admin validation)
export async function leaveFamily(): Promise<void> {
  console.log('👋 User attempting to leave family');
  
  const { data: authUser, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser.user) {
    throw new Error('User not authenticated');
  }

  // Get current user's info
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('*, families!inner(*)')
    .eq('id', authUser.user.id)
    .single();

  if (userError || !currentUser) {
    throw new Error('User not found in any family');
  }

  // Check total family members
  const { data: allMembers, error: membersError } = await supabase
    .from('users')
    .select('id, role')
    .eq('family_id', currentUser.family_id);

  if (membersError) {
    console.error('Error checking family members:', membersError);
    throw new Error('Failed to verify family membership');
  }

  const totalMembers = allMembers?.length || 0;
  const isLastMember = totalMembers === 1;

  // If user is admin and NOT the last member, check for other admins
  if (currentUser.role === 'admin' && !isLastMember) {
    console.log('🔍 Admin attempting to leave - checking for other admins');
    
    const { data: otherAdmins, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('family_id', currentUser.family_id)
      .eq('role', 'admin')
      .neq('id', authUser.user.id);

    if (adminError) {
      console.error('Error checking for other admins:', adminError);
      throw new Error('Failed to verify admin status');
    }

    if (!otherAdmins || otherAdmins.length === 0) {
      throw new Error('You cannot leave the family as the only admin. Please promote another member to admin first.');
    }

    console.log('✅ Other admins found, allowing admin to leave');
  } else if (isLastMember) {
    console.log('⚠️ Last member leaving - family will become empty');
    // Allow the last member (including sole admin) to leave
    // The family will effectively become inactive/empty
  }

  // Update user record to set family_id to null instead of deleting
  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      family_id: null,
      role: 'member' // Reset role to member when leaving family
    })
    .eq('id', authUser.user.id);

  if (updateError) {
    console.error('Error leaving family:', updateError);
    throw new Error('Failed to leave family');
  }

  console.log('👋 Successfully left family - family_id set to null');
}

// Search for users by email (client-safe version)
export async function searchUserByEmail(email: string): Promise<User | null> {
  console.log('🔍 Searching for user by email:', email);
  
  try {
    // Check if user exists in our users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no user found

    if (userError) {
      console.error('❌ Error searching for user:', userError);
      return null;
    }
    
    if (!user) {
      console.log('ℹ️ User not found:', email);
      return null;
    }
    
    console.log('✅ Found user:', user);
    return user;
    
  } catch (error) {
    console.error('❌ Error searching for user:', error);
    return null;
  }
}

// Enhanced send email invitation using real API
export async function sendEmailInvitation(familyName: string, inviteCode: string, recipientEmail: string, senderName: string): Promise<void> {
  console.log('📧 Sending email invitation via API:', { familyName, inviteCode, recipientEmail, senderName });
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    throw new Error('Invalid email address format');
  }
  
  try {
    const response = await fetch('/api/send-invitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        familyName,
        inviteCode,
        recipientEmail,
        senderName,
        appUrl: window.location.origin
      })
    });

    const result = await response.json();

    if (!response.ok) {
      // Handle different HTTP status codes with user-friendly messages
      if (response.status === 400) {
        throw new Error('Invalid email address or invitation details');
      } else if (response.status === 429) {
        throw new Error('Too many invitations sent. Please wait a moment and try again');
      } else if (response.status >= 500) {
        throw new Error('Email service is temporarily unavailable. Please try again later');
      } else {
        throw new Error(result.error || 'Failed to send invitation email');
      }
    }

    if (result.success) {
      console.log('✅ Email invitation sent successfully:', result);
      console.log('📧 Message ID:', result.messageId);
      
      // Check if this is development mode
      if (result.messageId === 'dev-mode-placeholder') {
        console.log('⚠️ Running in development mode - email details logged to server console');
      }
    } else {
      throw new Error(result.error || 'Failed to send invitation email');
    }

	} catch (error: unknown) {
	console.error('❌ Failed to send email invitation:', error);
	
	// Provide more specific error messages for common issues
	if (error instanceof TypeError && error.message.includes('fetch')) {
		throw new Error('Network error. Please check your connection and try again');
	} else if (error instanceof Error && error.message?.includes('JSON')) {
		throw new Error('Server communication error. Please try again');
	} else {
		// Re-throw with existing message if it's already user-friendly
		throw error;
	}
	}
}