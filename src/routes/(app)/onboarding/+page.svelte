<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import { Button, Input, Card } from '$lib/components';
	import { createFamily, joinFamily } from '$lib/services/familyService';
	import { supabase } from '$lib/supabaseClient';
	import { isPWA, debugPWAState, clearOnboardingState } from '$lib/pwa.js';
	import type { FamilyFormData } from '$lib/types';

	let { data } = $props();
	let currentStep = $state(1);
	let loading = $state(false);
	let error = $state('');
	let joinMode = $state(false); // Toggle between create/join family

	// PWA-specific state management
	let pwaMode = $state(false);
	let refreshCount = $state(0);
	let containerRef: HTMLElement;
	const MAX_REFRESH_COUNT = 3;

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

	const storageKey = 'onboarding_step';

	// Enhanced mount with PWA fixes
	onMount(() => {
		pwaMode = isPWA();
		
		if (pwaMode) {
			console.log('📱 PWA Mode detected in onboarding');
			debugPWAState();
			
			// Apply PWA-specific fixes
			document.body.setAttribute('data-route', 'onboarding');
			
			// Clear any problematic state that might cause refresh loops
			// Only clear onboarding state if we're not already in the middle of onboarding
			const url = new URL(window.location.href);
			if (!url.searchParams.has('step')) {
				clearOnboardingState();
			}
			
			// Prevent excessive refreshing in PWA mode
			// Commented out to prevent continuous refresh issues
			// const preventRefresh = (e: BeforeUnloadEvent) => {
			// 	refreshCount++;
			// 	if (refreshCount > MAX_REFRESH_COUNT) {
			// 		console.warn('🚨 Preventing excessive refresh in onboarding');
			// 		e.preventDefault();
			// 		e.returnValue = 'Are you sure you want to leave?';
			// 		return 'Are you sure you want to leave?';
			// 	}
			// };
			
			// window.addEventListener('beforeunload', preventRefresh);
			
			// Handle PWA scroll container setup
			if (containerRef) {
				containerRef.style.overscrollBehavior = 'contain';
				(containerRef.style as any).webkitOverflowScrolling = 'touch';
			}
		}

		// Check for pending invite code from signup
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
		} else {
			const savedStep = sessionStorage.getItem(storageKey);
			if (savedStep) {
				const parsedStep = parseInt(savedStep, 10);
				// Validate step to prevent invalid states
				if (parsedStep >= 1 && parsedStep <= 3) {
					currentStep = parsedStep;
				}
			}
		}
	});

	// Enhanced scroll event debugging with PWA considerations
	onMount(() => {
		const handleScroll = (e: Event) => {
			if (pwaMode) {
				// In PWA mode, be more careful about scroll handling
				const target = e.target as HTMLElement;
				const isAtTop = target.scrollTop <= 0;
				const isAtBottom = target.scrollTop >= (target.scrollHeight - target.clientHeight);
				
				console.log('🔄 PWA Scroll event', {
					target: target?.nodeName,
					currentStep,
					scrollTop: target?.scrollTop,
					scrollHeight: target?.scrollHeight,
					clientHeight: target?.clientHeight,
					isAtTop,
					isAtBottom
				});
				
				// Prevent problematic scroll behaviors
				if (isAtTop || isAtBottom) {
					target.style.overscrollBehavior = 'contain';
				}
			} else {
				console.log('🔄 Scroll event detected', {
					target: (e.target as HTMLElement)?.nodeName,
					currentStep,
					scrollTop: (e.target as HTMLElement)?.scrollTop,
					scrollHeight: (e.target as HTMLElement)?.scrollHeight,
					clientHeight: (e.target as HTMLElement)?.clientHeight
				});
			}
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		
		// Also listen on the container if in PWA mode
		if (pwaMode && containerRef) {
			containerRef.addEventListener('scroll', handleScroll, { passive: true });
		}
		
		return () => {
			window.removeEventListener('scroll', handleScroll);
			if (containerRef) {
				containerRef.removeEventListener('scroll', handleScroll);
			}
		};
	});

	onDestroy(() => {
		document.body.removeAttribute('data-route');
	});

	// Enhanced effect with PWA state management
	$effect(() => {
		console.log('📈 Current step changed to:', currentStep);
		
		// Only save to sessionStorage if not in a problematic state
		if (currentStep >= 1 && currentStep <= 3) {
			try {
				sessionStorage.setItem(storageKey, currentStep.toString());
			} catch (e) {
				console.warn('Could not save step to sessionStorage:', e);
			}
		}
		
		// In PWA mode, update URL without causing refresh
		// Only update if the step parameter is different from the current step
		if (pwaMode && typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			const currentStepParam = url.searchParams.get('step');
			if (currentStepParam !== currentStep.toString()) {
				url.searchParams.set('step', currentStep.toString());
				
				// Use replaceState to avoid adding to history
				try {
					window.history.replaceState({ step: currentStep }, '', url.toString());
				} catch (e) {
					console.warn('Could not update URL state:', e);
				}
			}
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
			console.log('✅ Family created successfully:', family);

			// Invalidate all cached data
			console.log('♻️ Invalidating cache...');
			await invalidateAll();

			// Clear onboarding state before navigation
			if (pwaMode) {
				clearOnboardingState();
				// Clear the step from sessionStorage
				sessionStorage.removeItem(storageKey);
			}

			// Simple verification - check if user exists in users table with family_id
			console.log('🔍 Verifying user family membership...');
			const { data: authUser } = await supabase.auth.getUser();
			if (authUser?.user) {
				console.log('🔍 Auth user found:', authUser.user.id);

				const { data: user, error: userError } = await supabase
					.from('users')
					.select('family_id')
					.eq('id', authUser.user.id)
					.single();

				console.log('🔍 User query result:', { user, userError });

				if (userError || !user?.family_id) {
					console.error('❌ User verification failed:', userError);
					console.log('🔍 User data received:', user);

					// Since family was created successfully, try direct redirect without verification
					console.log(
						'⚠️ Verification failed but family was created. Attempting direct redirect...'
					);
					
					if (pwaMode) {
						// In PWA mode, use replaceState navigation
						window.location.href = '/dashboard';
					} else {
						goto('/dashboard', { replaceState: true });
					}
					return;
				}

				console.log('✅ User verified as family member, redirecting to dashboard...');
				
				if (pwaMode) {
					// Force a full page reload to bypass any server-side redirects in PWA
					window.location.href = '/dashboard';
				} else {
					// Use SvelteKit navigation in browser mode
					goto('/dashboard', { replaceState: true });
				}
			} else {
				console.error('❌ User not authenticated');
				error = 'Authentication error. Please try logging out and back in.';
				loading = false;
			}
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

			// Invalidate all cached data
			await invalidateAll();

			// Clear onboarding state before navigation
			if (pwaMode) {
				clearOnboardingState();
				sessionStorage.removeItem(storageKey);
			}

			// Simple verification - check if user exists in users table with family_id
			console.log('🔍 Verifying user family membership...');
			const { data: authUser } = await supabase.auth.getUser();
			if (authUser?.user) {
				const { data: user, error: userError } = await supabase
					.from('users')
					.select('family_id')
					.eq('id', authUser.user.id)
					.single();

				if (userError || !user?.family_id) {
					console.error('❌ User verification failed:', userError);
					error = 'Family joined but verification failed. Please refresh the page and try again.';
					loading = false;
					return;
				}

				console.log('✅ User verified as family member, redirecting to dashboard...');
				
				if (pwaMode) {
					// Force a full page reload to bypass any server-side redirects in PWA
					window.location.href = '/dashboard';
				} else {
					// Use SvelteKit navigation in browser mode
					goto('/dashboard', { replaceState: true });
				}
			} else {
				console.error('❌ User not authenticated');
				error = 'Authentication error. Please try logging out and back in.';
				loading = false;
			}
		} catch (err: any) {
			console.error('❌ Error joining family:', err);
			error = err.message || 'Failed to join family';
			loading = false;
		}
	}

	function nextStep() {
		if (currentStep < 3 && !loading) {
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 1 && !loading) {
			currentStep--;
		}
	}

	function toggleMode() {
		if (loading) return; // Prevent mode changes during loading
		
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

	// PWA-specific scroll handler
	function handleContainerScroll(event: Event) {
		if (pwaMode) {
			// Prevent scroll events from bubbling up in PWA mode
			event.stopPropagation();
			
			const target = event.target as HTMLElement;
			// Ensure proper scroll behavior
			if (target.scrollTop <= 0) {
				target.style.overscrollBehaviorY = 'contain';
			}
		}
	}
</script>

<svelte:head>
	<title>Family Setup - Family Finance</title>
	{#if pwaMode}
		<!-- PWA-specific meta tags -->
		<meta name="mobile-web-app-capable" content="yes">
		<meta name="apple-mobile-web-app-status-bar-style" content="default">
	{/if}
</svelte:head>

<div 
	class="mx-auto max-w-2xl onboarding-wrapper" 
	class:pwa-mode={pwaMode}
	bind:this={containerRef}
	onscroll={handleContainerScroll}
>
	<!-- Progress Indicator -->
	<div class="mx-4 my-8">
		<div class="flex w-full items-center justify-between">
			{#each [1, 2, 3] as step}
				<div class="flex flex-1 flex-col items-center">
					<!-- Step Circle -->
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors
				{currentStep >= step ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-500'}"
					>
						{step}
					</div>

					<!-- Label -->
					<span class="mt-2 text-center text-sm text-gray-600">
						{step === 1 ? 'Welcome Aboard' : step === 2 ? 'Family Setup' : 'Get Started'}
					</span>
				</div>

				<!-- Connector Line -->
				{#if step < 3}
					<div
						class="mx-2 h-0.5 flex-1 transition-colors
				{currentStep > step ? 'bg-blue-600' : 'bg-gray-300'}"
					></div>
				{/if}
			{/each}
		</div>
	</div>

	<!-- Step Content -->
	<div class="step-content" class:loading>
		{#if currentStep === 1}
			<Card class="p-8 text-center">
				<div class="mb-6">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100"
					>
						<span class="text-3xl">👨‍👩‍👧‍👦</span>
					</div>
					<h1 class="mb-2 text-3xl font-bold text-gray-900">Welcome to Family Finance!</h1>
					<p class="text-lg text-gray-600">
						Let's set up your family's financial management system using the proven budgeting
						methodology.
					</p>
				</div>

				<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
					<div class="rounded-lg border border-gray-200 p-4 text-left">
						<h3 class="mb-2 font-semibold text-gray-900">🎯 Give Every Rupee a Job</h3>
						<p class="text-sm text-gray-600">
							Allocate every rupee to a specific category before you spend it.
						</p>
					</div>
					<div class="rounded-lg border border-gray-200 p-4 text-left">
						<h3 class="mb-2 font-semibold text-gray-900">💪 Embrace True Expenses</h3>
						<p class="text-sm text-gray-600">
							Save for irregular expenses like car maintenance and annual fees.
						</p>
					</div>
					<div class="rounded-lg border border-gray-200 p-4 text-left">
						<h3 class="mb-2 font-semibold text-gray-900">🔄 Roll with the Punches</h3>
						<p class="text-sm text-gray-600">When you overspend, move money from another category.</p>
					</div>
					<div class="rounded-lg border border-gray-200 p-4 text-left">
						<h3 class="mb-2 font-semibold text-gray-900">📈 Age Your Money</h3>
						<p class="text-sm text-gray-600">Increase the time between earning and spending money.</p>
					</div>
				</div>

				<div class="space-y-4">
					<Button size="lg" on:click={nextStep} disabled={loading}>Let's Get Started</Button>

					<div class="text-center">
						<button
							type="button"
							class="text-sm text-blue-600 underline hover:text-blue-500"
							onclick={toggleMode}
							disabled={loading}
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
						<div class="mb-6 text-center">
							<h2 class="mb-2 text-2xl font-bold text-gray-900">Join a Family</h2>
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
							class="font-mono text-lg"
							disabled={loading}
						/>

						<Input
							label="Your Display Name"
							bind:value={displayName}
							placeholder="How should family members see your name?"
							required
							class="text-lg"
							disabled={loading}
						/>

						<div class="rounded-lg bg-blue-50 p-4">
							<h3 class="mb-2 font-medium text-blue-900">What happens next:</h3>
							<div class="space-y-1 text-sm text-blue-800">
								<p>• You'll join the existing family as a member</p>
								<p>• You can view and add transactions</p>
								<p>• Budget editing depends on your assigned role</p>
								<p>• Family admin can change your permissions later</p>
							</div>
						</div>

						<div class="flex justify-between pt-4">
							<Button
								variant="outline"
								disabled={loading}
								on:click={() => {
									joinMode = false;
									currentStep = 1;
								}}
							>
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
						<div class="mb-6 text-center">
							<h2 class="mb-2 text-2xl font-bold text-gray-900">Create Your Family</h2>
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
							disabled={loading}
						/>

						<div class="rounded-lg bg-blue-50 p-4">
							<h3 class="mb-2 font-medium text-blue-900">Default Settings</h3>
							<div class="space-y-1 text-sm text-blue-800">
								<p>• Currency: Indian Rupee (₹)</p>
								<p>• Date Format: DD/MM/YYYY</p>
								<p>• Week Start: Monday</p>
								<p>• Timezone: Asia/Kolkata</p>
							</div>
							<p class="mt-2 text-xs text-blue-700">You can change these settings later.</p>
						</div>

						<div class="flex justify-between pt-4">
							<Button variant="outline" disabled={loading} on:click={prevStep}>Back</Button>
							<Button disabled={loading || !familyData.name.trim()} on:click={nextStep}>Continue</Button>
						</div>
					</div>
				</Card>
			{/if}
		{:else if currentStep === 3}
			<Card title="Ready to Start!" class="p-8">
				<div class="space-y-6 text-center">
					<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
						<span class="text-3xl">🎉</span>
					</div>

					<div>
						<h2 class="mb-2 text-2xl font-bold text-gray-900">You're All Set!</h2>
						<p class="text-gray-600">
							Your family "<strong>{familyData.name}</strong>" is ready to be created. You'll be set
							as the family administrator and can invite other members later.
						</p>
					</div>

					<div class="rounded-lg bg-gray-50 p-4 text-left">
						<h3 class="mb-2 font-medium text-gray-900">What happens next:</h3>
						<ul class="space-y-1 text-sm text-gray-600">
							<li>• Your family will be created with suitable settings</li>
							<li>• You'll be taken to your dashboard to start budgeting</li>
							<li>• You can add bank accounts and start tracking expenses</li>
							<li>• Invite family members to collaborate on your budget</li>
						</ul>
					</div>

					<div class="flex justify-between pt-4">
						<Button variant="outline" disabled={loading} on:click={prevStep}>Back</Button>
						<Button size="lg" {loading} disabled={loading} on:click={createNewFamily}>
							{loading ? 'Creating Family...' : 'Create My Family'}
						</Button>
					</div>
				</div>
			</Card>
		{/if}
	</div>
</div>

<style>
	.onboarding-wrapper {
		/* Enhanced scroll behavior for PWA */
		overscroll-behavior: contain;
		-webkit-overflow-scrolling: touch;
	}
	
	.onboarding-wrapper.pwa-mode {
		/* PWA-specific styling */
		min-height: 100vh;
		overflow-y: auto;
		/* Prevent pull-to-refresh */
		overscroll-behavior-y: contain;
		-webkit-overflow-scrolling: touch;
	}
	
	.step-content {
		/* Ensure smooth transitions */
		transition: opacity 0.2s ease;
	}
	
	.step-content.loading {
		opacity: 0.6;
		pointer-events: none;
	}
	
	/* PWA-specific fixes */
	@media all and (display-mode: standalone) {
		.onboarding-wrapper {
			/* Proper viewport usage */
			padding-top: env(safe-area-inset-top, 0);
			padding-bottom: env(safe-area-inset-bottom, 0);
			padding-left: env(safe-area-inset-left, 0);
			padding-right: env(safe-area-inset-right, 0);
			/* Prevent bounce scrolling issues */
			overscroll-behavior: contain;
		}
		
		/* Fix input zoom issues in PWA */
		/* Targets form elements with any class (from Svelte components) */
		:global(input[class]),
		:global(select[class]),
		:global(textarea[class]) {
			font-size: 16px !important; /* Prevents zoom on iOS */
			touch-action: manipulation; /* Prevents double-tap zoom */
		}
		
		/* Prevent zoom on button taps */
		button {
			touch-action: manipulation;
		}
	}
	
	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.onboarding-wrapper.pwa-mode {
			padding: 1rem;
		}
	}
</style>