<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import { Button, Input, Card } from '$lib/components';
	import { createFamily, joinFamily } from '$lib/services/familyService';
	import type { FamilyFormData } from '$lib/types';

	let { data } = $props();
	let currentStep = $state(1);
	let loading = $state(false);
	let error = $state('');
	let joinMode = $state(false); // Toggle between create/join family

	// Form data
	let familyData: FamilyFormData = $state({
		name: '',
		settings: {
			currency: 'INR',
			date_format: 'DD/MM/YYYY',
			start_of_week: 1,
			timezone: 'Asia/Kolkata'
		}
	});

	// Join family data
	let inviteCode = $state('');
	let displayName = $state('');

	// Check for pending invite code from signup
	onMount(() => {
		const pendingInviteCode = sessionStorage.getItem('pendingInviteCode');
		const pendingDisplayName = sessionStorage.getItem('pendingDisplayName');
		
		if (pendingInviteCode) {
			console.log('🔗 Found pending invite code from signup:', pendingInviteCode);
			inviteCode = pendingInviteCode;
			displayName = pendingDisplayName || '';
			joinMode = true;
			currentStep = 2; // Skip to step 2 for joining
			
			// Clear from session storage
			sessionStorage.removeItem('pendingInviteCode');
			sessionStorage.removeItem('pendingDisplayName');
		}
	});

	async function createNewFamily() {
		if (!familyData.name.trim()) {
			error = 'Please enter a family name';
			return;
		}

		loading = true;
		error = '';

		try {
			// Create the family (this now also adds the user as admin)
			const family = await createFamily(familyData);
			console.log('Family created successfully:', family);
			
			// Invalidate all cached data and redirect with delay
			console.log('Invalidating cache and redirecting...');
			await invalidateAll();
			
			// Add delay to ensure database consistency
			setTimeout(() => {
				console.log('Redirecting to dashboard...');
				goto('/dashboard', { replaceState: true, invalidateAll: true });
			}, 1000);
			
		} catch (err: any) {
			console.error('Error creating family:', err);
			error = err.message || 'Failed to create family';
			loading = false;
		}
	}

	async function joinExistingFamily() {
		if (!inviteCode.trim() || !displayName.trim()) {
			error = 'Please enter both invite code and display name';
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

	function nextStep() {
		if (currentStep < 3) {
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}

	function toggleMode() {
		console.log('🔗 Switching to join family mode');
		joinMode = !joinMode;
		error = '';
		
		// If switching to join mode, advance to step 2 to show the join form
		if (joinMode) {
			currentStep = 2;
			console.log('📝 Advanced to step 2 for joining family');
		} else {
			currentStep = 1;
			console.log('📝 Back to step 1 for creating family');
		}
	}
</script>

<svelte:head>
	<title>Family Setup - Family Finance</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<!-- Progress Indicator -->
	<div class="mb-8">
		<div class="flex items-center justify-between">
			{#each [1, 2, 3] as step}
				<div class="flex items-center">
					<div
						class="flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
							{currentStep >= step 
								? 'bg-blue-600 border-blue-600 text-white' 
								: 'border-gray-300 text-gray-500'}"
					>
						{step}
					</div>
					{#if step < 3}
						<div
							class="w-16 h-0.5 ml-2 transition-colors
								{currentStep > step ? 'bg-blue-600' : 'bg-gray-300'}"
						></div>
					{/if}
				</div>
			{/each}
		</div>
		<div class="flex justify-between mt-2 text-sm text-gray-600">
			<span>Welcome</span>
			<span>Family Setup</span>
			<span>Get Started</span>
		</div>
	</div>

	<!-- Step Content -->
	{#if currentStep === 1}
		<Card class="text-center p-8">
			<div class="mb-6">
				<div class="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
					<span class="text-3xl">👨‍👩‍👧‍👦</span>
				</div>
				<h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome to Family Finance!</h1>
				<p class="text-lg text-gray-600">
					Let's set up your family's financial management system using the proven YNAB methodology.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
				<div class="text-left p-4 border border-gray-200 rounded-lg">
					<h3 class="font-semibold text-gray-900 mb-2">🎯 Give Every Rupee a Job</h3>
					<p class="text-sm text-gray-600">Allocate every rupee to a specific category before you spend it.</p>
				</div>
				<div class="text-left p-4 border border-gray-200 rounded-lg">
					<h3 class="font-semibold text-gray-900 mb-2">💪 Embrace True Expenses</h3>
					<p class="text-sm text-gray-600">Save for irregular expenses like car maintenance and annual fees.</p>
				</div>
				<div class="text-left p-4 border border-gray-200 rounded-lg">
					<h3 class="font-semibold text-gray-900 mb-2">🔄 Roll with the Punches</h3>
					<p class="text-sm text-gray-600">When you overspend, move money from another category.</p>
				</div>
				<div class="text-left p-4 border border-gray-200 rounded-lg">
					<h3 class="font-semibold text-gray-900 mb-2">📈 Age Your Money</h3>
					<p class="text-sm text-gray-600">Increase the time between earning and spending money.</p>
				</div>
			</div>

			<div class="space-y-4">
				<Button size="lg" on:click={nextStep}>Let's Get Started</Button>
				
				<div class="text-center">
					<button
						type="button"
						class="text-sm text-blue-600 hover:text-blue-500 underline"
						onclick={toggleMode}
					>
						Have an invite code? Join an existing family instead
					</button>
				</div>
			</div>
		</Card>

	{:else if currentStep === 2}
		{#if joinMode}
			<!-- Join Family Flow -->
			<Card title="Join Existing Family" class="p-8">
				<div class="space-y-6">
					<div class="text-center mb-6">
						<h2 class="text-2xl font-bold text-gray-900 mb-2">Join a Family</h2>
						<p class="text-gray-600">
							Enter the invite code you received to join an existing family's budget.
						</p>
					</div>

					{#if error}
						<div class="rounded-md bg-red-50 p-4">
							<div class="text-sm text-red-700">{error}</div>
						</div>
					{/if}

					<Input
						label="Family Invite Code"
						bind:value={inviteCode}
						placeholder="Enter the invite code"
						required
						class="text-lg font-mono"
					/>

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

					<div class="flex justify-between pt-4">
						<Button variant="outline" on:click={() => { joinMode = false; currentStep = 1; }}>
							Back to Create Family
						</Button>
						<Button 
							{loading}
							disabled={loading || !inviteCode.trim() || !displayName.trim()}
							on:click={joinExistingFamily}
						>
							{loading ? 'Joining Family...' : 'Join Family'}
						</Button>
					</div>
				</div>
			</Card>
		{:else}
			<!-- Create Family Flow -->
			<Card title="Set Up Your Family" class="p-8">
				<div class="space-y-6">
					<div class="text-center mb-6">
						<h2 class="text-2xl font-bold text-gray-900 mb-2">Create Your Family</h2>
						<p class="text-gray-600">
							Enter your family or household name. This will help organize your financial data and 
							allow you to invite other family members later.
						</p>
					</div>

					{#if error}
						<div class="rounded-md bg-red-50 p-4">
							<div class="text-sm text-red-700">{error}</div>
						</div>
					{/if}

					<Input
						label="Family Name"
						bind:value={familyData.name}
						placeholder="e.g., The Sharma Family, Kumar Household"
						required
						class="text-lg"
					/>

					<div class="bg-blue-50 p-4 rounded-lg">
						<h3 class="font-medium text-blue-900 mb-2">Default Settings</h3>
						<div class="text-sm text-blue-800 space-y-1">
							<p>• Currency: Indian Rupee (₹)</p>
							<p>• Date Format: DD/MM/YYYY</p>
							<p>• Week Start: Monday</p>
							<p>• Timezone: Asia/Kolkata</p>
						</div>
						<p class="text-xs text-blue-700 mt-2">You can change these settings later.</p>
					</div>

					<div class="flex justify-between pt-4">
						<Button variant="outline" on:click={prevStep}>Back</Button>
						<Button on:click={nextStep} disabled={!familyData.name.trim()}>Continue</Button>
					</div>
				</div>
			</Card>
		{/if}

	{:else if currentStep === 3}
		<Card title="Ready to Start!" class="p-8">
			<div class="text-center space-y-6">
				<div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
					<span class="text-3xl">🎉</span>
				</div>

				<div>
					<h2 class="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h2>
					<p class="text-gray-600">
						Your family "<strong>{familyData.name}</strong>" is ready to be created.
						You'll be set as the family administrator and can invite other members later.
					</p>
				</div>

				<div class="bg-gray-50 p-4 rounded-lg text-left">
					<h3 class="font-medium text-gray-900 mb-2">What happens next:</h3>
					<ul class="text-sm text-gray-600 space-y-1">
						<li>• Your family will be created with Indian market settings</li>
						<li>• You'll be taken to your dashboard to start budgeting</li>
						<li>• You can add bank accounts and start tracking expenses</li>
						<li>• Invite family members to collaborate on your budget</li>
					</ul>
				</div>

				<div class="flex justify-between pt-4">
					<Button variant="outline" on:click={prevStep}>Back</Button>
					<Button
						size="lg"
						{loading}
						disabled={loading}
						on:click={createNewFamily}
					>
						{loading ? 'Creating Family...' : 'Create My Family'}
					</Button>
				</div>
			</div>
		</Card>
	{/if}
</div>