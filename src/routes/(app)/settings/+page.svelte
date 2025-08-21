<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Button, Input, Card, Modal } from '$lib/components';
	import {
		getUserFamily,
		getFamilyMembers,
		updateFamilySettings,
		updateUserRole,
		removeUserFromFamily,
		generateInviteCode,
		searchUserByEmail,
		sendEmailInvitation,
		leaveFamily
	} from '$lib/services/familyService';
	import { supabase } from '$lib/supabaseClient';
	import NotificationSettings from '$lib/components/notifications/NotificationSettings.svelte';
	import type { Family, FamilyMember } from '$lib/types';
	import type { RealtimeChannel } from '@supabase/supabase-js';

	let { data } = $props();
	let family: Family | null = $state(null);
	let members: FamilyMember[] = $state([]);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');
	let success = $state('');

	// Form states
	let familyName = $state('');
	let inviteModalOpen = $state(false);
	let inviteCode = $state('');
	let emailInviteModalOpen = $state(false);
	let inviteEmail = $state('');
	let emailInviteLoading = $state(false);
	let removeModalOpen = $state(false);
	let memberToRemove: FamilyMember | null = $state(null);
	let leaveFamilyModalOpen = $state(false);
	let leaveFamilyLoading = $state(false);

	// Real-time subscription
	let familySubscription: RealtimeChannel | null = null;
	let membersSubscription: RealtimeChannel | null = null;

	// Get current user from session
	const user = $derived(data.session?.user);

	onMount(async () => {
		await loadFamilyData();
		setupRealtimeSubscriptions();
	});

	onDestroy(() => {
		// Clean up subscriptions
		if (familySubscription) {
			supabase.removeChannel(familySubscription);
		}
		if (membersSubscription) {
			supabase.removeChannel(membersSubscription);
		}
	});

	function setupRealtimeSubscriptions() {
		if (!family) return;

		console.log('🔔 Setting up real-time subscriptions for family:', family.id);

		// Subscribe to family changes
		familySubscription = supabase
			.channel(`family_${family.id}`)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'families',
					filter: `id=eq.${family.id}`
				},
				(payload) => {
					console.log('📡 Family data updated:', payload.new);
					// Update family data reactively
					if (payload.new && family) {
						family.name = payload.new.name;
						family.settings = payload.new.settings;
						familyName = payload.new.name;
						console.log('✅ Family data synced in real-time');
					}
				}
			)
			.subscribe();

		// Subscribe to family members changes
		membersSubscription = supabase
			.channel(`family_members_${family.id}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'users',
					filter: `family_id=eq.${family.id}`
				},
				(payload) => {
					console.log('📡 Family members updated:', payload);
					// Reload family data to get updated members list
					loadFamilyData();
				}
			)
			.subscribe();
	}

	async function loadFamilyData() {
		try {
			loading = true;
			const familyData = await getUserFamily();
			
			if (familyData) {
				family = familyData.family;
				familyName = family.name;
				
				const familyMembers = await getFamilyMembers(family.id);
				members = familyMembers.map(member => ({
					...member,
					is_current_user: member.id === data.session.user.id,
					permissions: {
						can_edit_budget: member.role === 'admin' || member.role === 'member',
						can_create_transactions: member.role === 'admin' || member.role === 'member',
						can_manage_accounts: member.role === 'admin',
						can_invite_members: member.role === 'admin'
					}
				}));
			}
		} catch (err: any) {
			error = err.message || 'Failed to load family data';
		} finally {
			loading = false;
		}
	}

	async function saveFamilySettings() {
		if (!family || !familyName.trim()) return;

		try {
			saving = true;
			error = '';
			
			// Update both name and settings
			const updatedFamily = await updateFamilySettings(family.id, {
				name: familyName.trim(),
				settings: family.settings
			});
			
			// Update local state (real-time subscription will also update this)
			family.name = updatedFamily.name;
			family.settings = updatedFamily.settings;
			
			success = 'Family settings updated successfully';
			setTimeout(() => success = '', 3000);
		} catch (err: any) {
			error = err.message || 'Failed to update family settings';
		} finally {
			saving = false;
		}
	}

	async function changeUserRole(userId: string, newRole: 'admin' | 'member' | 'viewer') {
		try {
			await updateUserRole(userId, newRole);
			await loadFamilyData();
			success = 'Member role updated successfully';
			setTimeout(() => success = '', 3000);
		} catch (err: any) {
			error = err.message || 'Failed to update member role';
		}
	}

	function openInviteModal() {
		if (family) {
			inviteCode = generateInviteCode(family.id);
			inviteModalOpen = true;
		}
	}

	function openEmailInviteModal() {
		emailInviteModalOpen = true;
		inviteEmail = '';
	}

	async function sendEmailInvite() {
		if (!inviteEmail || !family || !user) {
			showErrorMessage('Please enter an email address');
			return;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(inviteEmail)) {
			showErrorMessage('Please enter a valid email address');
			return;
		}

		try {
			console.log('📧 Sending email invitation to:', inviteEmail);
			emailInviteLoading = true;
			
			// Search for existing user
			const existingUser = await searchUserByEmail(inviteEmail);
			
			// Check if user already exists and is in a family
			if (existingUser && existingUser.family_id) {
				showErrorMessage(`${inviteEmail} is already a member of another family`);
				return;
			}
			
			// Generate invite code
			const code = generateInviteCode(family.id);
			
			// Send email invitation
			await sendEmailInvitation(
				family.name,
				code,
				inviteEmail,
				user.user_metadata?.display_name || user.email?.split('@')[0] || 'Family Member'
			);
			
			// Success message with clear next steps
			if (existingUser) {
				showSuccessMessage(`Invitation sent to ${inviteEmail}! They can log in and use the invite code to join your family.`);
			} else {
				showSuccessMessage(`Invitation sent to ${inviteEmail}! They'll receive an email with instructions to create an account and join your family.`);
			}
			
			inviteEmail = ''; // Clear the input
			emailInviteModalOpen = false;
			
		} catch (err: unknown) {
			console.error('❌ Error sending email invitation:', err);
			
			// Provide user-friendly error messages
			let userMessage = 'Failed to send invitation. ';
			
			const errorMessage = err instanceof Error ? err.message : String(err);
			
			if (errorMessage.includes('not authenticated')) {
				userMessage += 'Please log in and try again.';
			} else if (errorMessage.includes('not part of a family')) {
				userMessage += 'You need to be part of a family to send invitations.';
			} else if (errorMessage.includes('Failed to send email')) {
				userMessage += 'There was a problem sending the email. Please check the email address and try again.';
			} else if (errorMessage.includes('Invalid email')) {
				userMessage += 'Please enter a valid email address.';
			} else {
				userMessage += 'Please try again or contact support if the problem persists.';
			}
			
			showErrorMessage(userMessage);
		} finally {
			emailInviteLoading = false;
		}
	}

	function showErrorMessage(message: string) {
		error = message;
		setTimeout(() => error = '', 5000);
	}

	function showSuccessMessage(message: string) {
		success = message;
		setTimeout(() => success = '', 5000);
	}

	function openRemoveModal(member: FamilyMember) {
		memberToRemove = member;
		removeModalOpen = true;
	}

	async function removeMember() {
		if (!memberToRemove) return;

		try {
			await removeUserFromFamily(memberToRemove.id);
			await loadFamilyData();
			removeModalOpen = false;
			memberToRemove = null;
			success = 'Member removed successfully';
			setTimeout(() => success = '', 3000);
		} catch (err: any) {
			error = err.message || 'Failed to remove member';
		}
	}

	function openLeaveFamilyModal() {
		leaveFamilyModalOpen = true;
		error = '';
	}

	async function handleLeaveFamily() {
		try {
			leaveFamilyLoading = true;
			error = '';
			
			await leaveFamily();
			
			// Redirect to onboarding after leaving
			window.location.href = '/onboarding';
		} catch (err: any) {
			error = err.message || 'Failed to leave family';
			leaveFamilyLoading = false;
		}
	}

	function copyInviteCode() {
		navigator.clipboard.writeText(inviteCode);
		success = 'Invite code copied to clipboard!';
		setTimeout(() => success = '', 3000);
	}

	const currentUser = $derived(members.find(m => m.is_current_user));
	const isAdmin = $derived(currentUser?.role === 'admin');
</script>

<svelte:head>
	<title>Family Settings - Family Finance</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
	<!-- Professional Header Section -->
	<div class="relative overflow-hidden">
		<!-- Background Pattern -->
		<div class="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600"></div>
		<div class="absolute inset-0 bg-black/10"></div>
		<div class="absolute inset-0" style="background-image: radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)"></div>
		
		<div class="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
				<div class="flex-1">
					<div class="flex items-center space-x-3 mb-4">
						<div class="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
							<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
						</div>
						<div>
							<h1 class="text-3xl sm:text-4xl font-bold text-white">Family Settings</h1>
							<p class="text-purple-100 text-base sm:text-lg opacity-90 mt-1">
								Manage your family information and members
							</p>
						</div>
					</div>
				</div>
				
				{#if family && !loading}
					<div class="flex-shrink-0">
						<div class="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
							<div class="text-white/90 text-sm font-medium mb-1">My Family</div>
							<div class="text-white text-lg font-semibold">{family.name}</div>
							<div class="text-purple-100 text-sm opacity-75 mt-1">
								{members.length} member{members.length !== 1 ? 's' : ''}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Content Section -->
	<div class="relative">
		<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12 space-y-6">

	{#if loading}
		<div class="flex items-center justify-center h-64">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
			<span class="ml-2 text-gray-600">Loading family settings...</span>
		</div>
	{:else if error}
		<div class="rounded-md bg-red-50 p-4">
			<div class="text-sm text-red-700">{error}</div>
		</div>
	{:else if family}
		<!-- Success Message -->
		{#if success}
			<div class="rounded-md bg-green-50 p-4">
				<div class="text-sm text-green-700">{success}</div>
			</div>
		{/if}

		<!-- Family Information -->
		<Card title="Family Information">
			<div class="space-y-6">
				<Input
					label="Family Name"
					bind:value={familyName}
					placeholder="Enter family name"
					disabled={!isAdmin}
				/>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div>
						<div class="block text-sm font-medium text-gray-700 mb-1">Currency</div>
						<div class="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
							{family.settings.currency}
						</div>
					</div>
					<div>
						<div class="block text-sm font-medium text-gray-700 mb-1">Date Format</div>
						<div class="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
							{family.settings.date_format}
						</div>
					</div>
					<div>
						<div class="block text-sm font-medium text-gray-700 mb-1">Week Start</div>
						<div class="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
							{family.settings.start_of_week === 1 ? 'Monday' : 'Sunday'}
						</div>
					</div>
					<div>
						<div class="block text-sm font-medium text-gray-700 mb-1">Timezone</div>
						<div class="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
							{family.settings.timezone}
						</div>
					</div>
				</div>

				{#if isAdmin}
					<div class="pt-4 border-t border-gray-200">
						<Button
							on:click={saveFamilySettings}
							loading={saving}
							disabled={saving || familyName === family.name}
						>
							{saving ? 'Saving...' : 'Save Changes'}
						</Button>
					</div>
				{/if}
			</div>
		</Card>

		<!-- Family Members -->
		<Card title="Family Members">
			<div class="space-y-6">
				<div class="flex justify-between items-center">
					<p class="text-gray-600">
						{members.length} member{members.length !== 1 ? 's' : ''} in your family
					</p>
					{#if isAdmin}
						<div class="space-x-2">
							<Button variant="outline" size="sm" on:click={openInviteModal}>
								Invite Code
							</Button>
							<Button variant="outline" size="sm" on:click={openEmailInviteModal}>
								Email Invite
							</Button>
						</div>
					{/if}
				</div>

				<div class="space-y-4">
					{#each members as member (member.id)}
						<div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
							<div class="flex items-center space-x-4">
								<div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
									<span class="text-sm font-medium text-purple-700">
										{(member.display_name || member.email)[0].toUpperCase()}
									</span>
								</div>
								<div>
									<p class="font-medium text-gray-900">
										{member.display_name || member.email.split('@')[0]}
										{#if member.is_current_user}
											<span class="text-sm text-gray-500">(You)</span>
										{/if}
									</p>
									<p class="text-sm text-gray-600">{member.email}</p>
								</div>
							</div>

							<div class="flex items-center space-x-3">
								<!-- Role Badge -->
								<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
									{member.role === 'admin' 
										? 'bg-purple-100 text-purple-800' 
										: member.role === 'member' 
											? 'bg-blue-100 text-blue-800' 
											: 'bg-gray-100 text-gray-800'}"
								>
									{member.role}
								</span>

								<!-- Actions -->
								{#if isAdmin && !member.is_current_user}
									<select
										class="text-sm border border-gray-300 rounded px-2 py-1"
										value={member.role}
										onchange={(e) => changeUserRole(member.id, (e.target as HTMLSelectElement).value as 'admin' | 'member' | 'viewer')}
									>
										<option value="viewer">Viewer</option>
										<option value="member">Member</option>
										<option value="admin">Admin</option>
									</select>

									<Button 
										variant="danger" 
										size="sm" 
										on:click={() => openRemoveModal(member)}
									>
										Remove
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</Card>

		<!-- Push Notifications -->
		<Card title="Push Notifications">
			<NotificationSettings />
		</Card>

		<!-- Leave Family -->
		<Card title="Leave Family">
			<div class="space-y-4">
				<p class="text-gray-600">
					If you need to leave this family, you can do so below. This action will remove your access to all family financial data.
				</p>
				
				{#if currentUser?.role === 'admin'}
					<div class="bg-yellow-50 p-4 rounded-lg">
						<p class="text-sm text-yellow-800">
							<strong>Note:</strong>
							{#if members.length > 1}
								As an admin, you must promote another member to admin before leaving the family.
							{:else}
								As the only member, you can leave freely. The family will become inactive.
							{/if}
						</p>
					</div>
				{/if}

				<div class="pt-4 border-t border-gray-200">
					<Button
						variant="danger"
						on:click={openLeaveFamilyModal}
						disabled={!family}
					>
						Leave Family
					</Button>
				</div>
			</div>
		</Card>
	{/if}
		</div>
	</div>
</div>

<!-- Invite Modal -->
<Modal bind:open={inviteModalOpen} title="Invite Family Member">
	<div class="space-y-4">
		<p class="text-gray-600">
			Share this invite code with your family member. They can use it to join your family.
		</p>

		<div class="flex items-center space-x-2">
			<Input
				label="Invite Code"
				value={inviteCode}
				disabled
				class="font-mono"
			/>
			<Button variant="outline" on:click={copyInviteCode}>
				Copy
			</Button>
		</div>

		<div class="bg-blue-50 p-4 rounded-lg">
			<h4 class="font-medium text-blue-900 mb-2">How to share:</h4>
			<ol class="text-sm text-blue-800 space-y-1">
				<li>1. Copy the invite code above</li>
				<li>2. Send it to your family member</li>
				<li>3. They can enter it during signup or in their settings</li>
			</ol>
		</div>
	</div>

	<div slot="footer">
		<Button variant="outline" on:click={() => inviteModalOpen = false}>
			Close
		</Button>
	</div>
</Modal>

<!-- Email Invite Modal -->
<Modal bind:open={emailInviteModalOpen} title="Invite by Email">
	<div class="space-y-4">
		<p class="text-gray-600">
			Send an invitation to an existing user by their email address.
		</p>

		{#if error}
			<div class="rounded-md bg-red-50 p-4">
				<div class="text-sm text-red-700">{error}</div>
			</div>
		{/if}

		<Input
			label="Email Address"
			type="email"
			bind:value={inviteEmail}
			placeholder="Enter the user's email address"
			required
		/>

		<div class="bg-yellow-50 p-4 rounded-lg">
			<h4 class="font-medium text-yellow-900 mb-2">Important:</h4>
			<p class="text-sm text-yellow-800">
				The person must already have an account with this app. If they don't have an account yet,
				they can sign up first, then you can invite them.
			</p>
		</div>

		<div class="bg-blue-50 p-4 rounded-lg">
			<h4 class="font-medium text-blue-900 mb-2">How it works:</h4>
			<ol class="text-sm text-blue-800 space-y-1">
				<li>1. We'll check if the email belongs to an existing user</li>
				<li>2. Send them an email with the invite code</li>
				<li>3. They can enter the code to join your family</li>
			</ol>
		</div>
	</div>

	<div slot="footer">
		<Button variant="outline" on:click={() => emailInviteModalOpen = false}>
			Cancel
		</Button>
		<Button
			loading={emailInviteLoading}
			disabled={emailInviteLoading || !inviteEmail.trim()}
			on:click={sendEmailInvite}
		>
			{emailInviteLoading ? 'Sending...' : 'Send Invitation'}
		</Button>
	</div>
</Modal>

<!-- Leave Family Modal -->
<Modal bind:open={leaveFamilyModalOpen} title="Leave Family">
	<div class="space-y-4">
		<p class="text-gray-600">
			Are you sure you want to leave
			<strong>{family?.name}</strong>?
			This action cannot be undone.
		</p>

		<div class="bg-red-50 p-4 rounded-lg">
			<h4 class="font-medium text-red-900 mb-2">What happens when you leave:</h4>
			<ul class="text-sm text-red-800 space-y-1">
				<li>• You will lose access to all family financial data</li>
				<li>• Your transaction history will be preserved but inaccessible</li>
				<li>• You will need a new invitation to rejoin</li>
				{#if currentUser?.role === 'admin'}
					<li class="font-medium">• You must assign another admin before leaving</li>
				{/if}
			</ul>
		</div>

		{#if error}
			<div class="rounded-md bg-red-50 p-4">
				<div class="text-sm text-red-700">{error}</div>
			</div>
		{/if}
	</div>

	<div slot="footer">
		<Button variant="outline" on:click={() => leaveFamilyModalOpen = false} disabled={leaveFamilyLoading}>
			Cancel
		</Button>
		<Button
			variant="danger"
			loading={leaveFamilyLoading}
			disabled={leaveFamilyLoading}
			on:click={handleLeaveFamily}
		>
			{leaveFamilyLoading ? 'Leaving...' : 'Leave Family'}
		</Button>
	</div>
</Modal>

<!-- Remove Member Modal -->
<Modal bind:open={removeModalOpen} title="Remove Family Member">
	<div class="space-y-4">
		<p class="text-gray-600">
			Are you sure you want to remove 
			<strong>{memberToRemove?.display_name || memberToRemove?.email}</strong> 
			from your family? This action cannot be undone.
		</p>

		<div class="bg-red-50 p-4 rounded-lg">
			<p class="text-sm text-red-800">
				This will remove their access to all family financial data and they will need 
				a new invite to rejoin.
			</p>
		</div>
	</div>

	<div slot="footer">
		<Button variant="outline" on:click={() => removeModalOpen = false}>
			Cancel
		</Button>
		<Button variant="danger" on:click={removeMember}>
			Remove Member
		</Button>
	</div>
</Modal>