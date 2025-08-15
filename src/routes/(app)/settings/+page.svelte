<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, Card, Modal } from '$lib/components';
	import {
		getUserFamily,
		getFamilyMembers,
		updateFamilySettings,
		updateUserRole,
		removeUserFromFamily,
		generateInviteCode,
		searchUserByEmail,
		sendEmailInvitation
	} from '$lib/services/familyService';
	import NotificationSettings from '$lib/components/notifications/NotificationSettings.svelte';
	import type { Family, FamilyMember } from '$lib/types';

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

	onMount(async () => {
		await loadFamilyData();
	});

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
			
			await updateFamilySettings(family.id, { ...family.settings });
			family.name = familyName.trim();
			
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
		if (!inviteEmail.trim() || !family) return;

		emailInviteLoading = true;
		error = '';

		try {
			console.log('📧 Sending email invitation to:', inviteEmail);
			
			// Check if user exists
			const userSearch = await searchUserByEmail(inviteEmail.trim());
			
			if (!userSearch.exists) {
				error = 'No user found with that email address. They need to create an account first.';
				emailInviteLoading = false;
				return;
			}

			// Generate invite code
			const code = generateInviteCode(family.id);
			
			// Send email invitation
			const currentUser = members.find(m => m.is_current_user);
			await sendEmailInvitation(
				family.name,
				code,
				inviteEmail.trim(),
				currentUser?.display_name || 'Family Admin'
			);

			emailInviteModalOpen = false;
			success = `Invitation sent to ${inviteEmail}!`;
			setTimeout(() => success = '', 3000);
			
		} catch (err: any) {
			console.error('❌ Error sending email invitation:', err);
			error = err.message || 'Failed to send invitation';
		} finally {
			emailInviteLoading = false;
		}
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

<div class="space-y-8">
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Family Settings</h1>
		<p class="mt-2 text-gray-600">Manage your family information and members</p>
	</div>

	{#if loading}
		<div class="text-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
			<p class="mt-2 text-gray-600">Loading family settings...</p>
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
								<div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
									<span class="text-sm font-medium text-blue-700">
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
	{/if}
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