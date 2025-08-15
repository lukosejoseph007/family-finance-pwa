<script lang="ts">
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import { Button, Input, Card } from '$lib/components';
	import { joinFamily, decodeInviteCode, getFamily } from '$lib/services/familyService';

	let { data } = $props();
	let inviteCode = $state('');
	let displayName = $state('');
	let loading = $state(false);
	let error = $state('');
	let familyPreview = $state('');

	// Pre-fill display name from user data
	$effect(() => {
		if (data.session?.user) {
			displayName = data.session.user.user_metadata?.display_name || 
			             data.session.user.email?.split('@')[0] || '';
		}
	});

	// Validate invite code when it's entered
	$effect(() => {
		if (inviteCode && inviteCode.length >= 6) {
			validateInviteCode();
		} else {
			familyPreview = '';
		}
	});

	async function validateInviteCode() {
		console.log('🔍 Validating invite code:', inviteCode);
		const familyId = decodeInviteCode(inviteCode);
		if (familyId) {
			try {
				const family = await getFamily(familyId);
				if (family) {
					familyPreview = `You'll join "${family.name}" family`;
					console.log('✅ Valid invite code for family:', family.name);
				} else {
					familyPreview = 'Invalid invite code';
					console.log('❌ Invalid invite code - family not found');
				}
			} catch (err) {
				familyPreview = 'Error validating invite code';
				console.error('❌ Error validating invite code:', err);
			}
		} else {
			familyPreview = 'Invalid invite code format';
		}
	}

	async function handleJoinFamily() {
		if (!inviteCode.trim() || !displayName.trim()) {
			error = 'Please enter both invite code and display name';
			return;
		}

		if (!familyPreview.includes("You'll join")) {
			error = 'Please enter a valid invite code';
			return;
		}

		loading = true;
		error = '';

		try {
			console.log('👥 Joining family with code:', inviteCode);
			const result = await joinFamily({
				inviteCode: inviteCode.trim(),
				displayName: displayName.trim()
			});
			
			console.log('✅ Successfully joined family:', result.family.name);
			
			// Invalidate all cached data and redirect
			await invalidateAll();
			
			setTimeout(() => {
				goto('/dashboard', { replaceState: true, invalidateAll: true });
			}, 1000);
			
		} catch (err: any) {
			console.error('❌ Error joining family:', err);
			error = err.message || 'Failed to join family';
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Join Family - Family Finance</title>
</svelte:head>

<div class="max-w-lg mx-auto">
	<Card class="p-8">
		<div class="text-center mb-8">
			<div class="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
				<span class="text-3xl">👥</span>
			</div>
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Join a Family</h1>
			<p class="text-gray-600">
				Enter the invite code you received to join an existing family's budget.
			</p>
		</div>

		{#if error}
			<div class="rounded-md bg-red-50 p-4 mb-6">
				<div class="text-sm text-red-700">{error}</div>
			</div>
		{/if}

		<div class="space-y-6">
			<Input
				label="Family Invite Code"
				bind:value={inviteCode}
				placeholder="Enter the invite code"
				required
				class="text-lg font-mono"
			/>

			{#if familyPreview}
				<div class="p-3 rounded-lg {familyPreview.includes('Invalid') || familyPreview.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}">
					<p class="text-sm font-medium">{familyPreview}</p>
				</div>
			{/if}

			<Input
				label="Your Display Name"
				bind:value={displayName}
				placeholder="How should family members see your name?"
				required
				class="text-lg"
			/>

			<div class="bg-blue-50 p-4 rounded-lg">
				<h3 class="font-medium text-blue-900 mb-2">What happens next:</h3>
				<div class="text-sm text-blue-800 space-y-1">
					<p>• You'll join the existing family as a member</p>
					<p>• You can view and add transactions</p>
					<p>• Budget editing depends on your assigned role</p>
					<p>• Family admin can change your permissions later</p>
				</div>
			</div>

			<Button 
				fullWidth
				size="lg"
				{loading}
				disabled={loading || !inviteCode.trim() || !displayName.trim() || !familyPreview.includes("You'll join")}
				on:click={handleJoinFamily}
			>
				{loading ? 'Joining Family...' : 'Join Family'}
			</Button>

			<div class="text-center">
				<button 
					type="button"
					class="text-sm text-gray-600 hover:text-gray-500 underline"
					on:click={() => goto('/settings')}
				>
					Go back to settings
				</button>
			</div>
		</div>
	</Card>
</div>