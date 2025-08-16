<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Input } from '$lib/components';
	import { signUp } from '$lib/supabaseClient';
	import { joinFamily, decodeInviteCode, getFamily } from '$lib/services/familyService';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let displayName = $state('');
	let inviteCode = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);
	let familyPreview = $state('');

	// Validate invite code when it's entered
	$effect(() => {
		if (inviteCode && inviteCode.length >= 6) {
			console.log('🔍 Validating invite code:', inviteCode);
			const familyId = decodeInviteCode(inviteCode);
			if (familyId) {
				// Use async validation in a separate function
				validateInviteCode(familyId);
			} else {
				familyPreview = 'Invalid invite code format';
			}
		} else {
			familyPreview = '';
		}
	});

	async function validateInviteCode(familyId: string) {
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
	}

	async function handleSignup() {
		if (!email || !password || !confirmPassword || !displayName) {
			error = 'Please fill in all fields';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		// Validate invite code if provided
		if (inviteCode && !familyPreview.includes("You'll join")) {
			error = 'Please enter a valid invite code or leave it blank';
			return;
		}

		loading = true;
		error = '';

		try {
			console.log('📝 Creating account with invite code:', inviteCode || 'none');
			console.log('Email:', email);
			console.log('Password:', password);
			console.log('Confirm Password:', confirmPassword);
			console.log('Display Name:', displayName);
			console.log('Invite Code:', inviteCode);
			console.log('Family Preview:', familyPreview);
			console.log('Button disabled:', loading || !email || !password || !confirmPassword || !displayName || (inviteCode && !familyPreview.includes("You'll join")));
			await signUp(email, password);
			
			// Store invite code for post-signup processing
			if (inviteCode) {
				sessionStorage.setItem('pendingInviteCode', inviteCode);
				sessionStorage.setItem('pendingDisplayName', displayName);
			}
			
			success = true;
		} catch (err: any) {
			error = err.message || 'Failed to create account';
		} finally {
			loading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSignup();
		}
	}
</script>

<div class="space-y-6">
	{#if success}
		<div class="rounded-md bg-green-50 p-4">
			<div class="flex">
				<div class="flex-shrink-0">
					<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-green-800">Account created successfully!</h3>
					<div class="mt-2 text-sm text-green-700">
						<p>
							Please check your email for a verification link. Once verified, you can
							<a href="/login" class="font-medium underline">sign in to your account</a>.
						</p>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div>
			<h2 class="text-2xl font-bold text-gray-900">Create your account</h2>
			<p class="mt-2 text-sm text-gray-600">
				Already have an account?
				<a href="/login" class="font-medium text-blue-600 hover:text-blue-500">
					Sign in here
				</a>
			</p>
		</div>

		<form on:submit|preventDefault={handleSignup} class="space-y-6">
			{#if error}
				<div class="rounded-md bg-red-50 p-4">
					<div class="text-sm text-red-700">{error}</div>
				</div>
			{/if}

			<Input
			  label="Full Name"
			  type="text"
			  bind:value={displayName}
			  placeholder="Enter your full name"
			  required
			  autocomplete="name"
			  on:keydown={handleKeydown}
			  id="fullName"
			/>

			<Input
			  label="Email address"
			  type="email"
			  bind:value={email}
			  placeholder="Enter your email"
			  required
			  autocomplete="email"
			  on:keydown={handleKeydown}
			  id="emailAddress"
			/>

			<Input
			  label="Password"
			  type="password"
			  bind:value={password}
			  placeholder="Create a password (min. 6 characters)"
			  required
			  autocomplete="new-password"
			  on:keydown={handleKeydown}
			  id="newPassword"
			/>

			<Input
			  label="Confirm Password"
			  type="password"
			  bind:value={confirmPassword}
			  placeholder="Confirm your password"
			  required
			  autocomplete="new-password"
			  on:keydown={handleKeydown}
			  id="confirmPassword"
			/>

			<div class="space-y-2">
				<Input
				  label="Family Invite Code (Optional)"
				  type="text"
				  bind:value={inviteCode}
				  placeholder="Enter invite code to join a family"
				  autocomplete="off"
				  on:keydown={handleKeydown}
				  id="inviteCode"
				/>
				{#if familyPreview}
					<p class="text-xs {familyPreview.includes('Invalid') || familyPreview.includes('Error') ? 'text-red-600' : 'text-green-600'}">
						{familyPreview}
					</p>
				{:else}
					<p class="text-xs text-gray-500">
						Have a family invite code? Enter it here to join an existing family, or leave blank to create your own.
					</p>
				{/if}
			</div>

			<div class="text-xs text-gray-500">
				By creating an account, you agree to our
				<a href="/terms" class="text-blue-600 hover:text-blue-500">Terms of Service</a>
				and
				<a href="/privacy" class="text-blue-600 hover:text-blue-500">Privacy Policy</a>.
			</div>

			<Button
				type="submit"
				fullWidth
				{loading}
				disabled={loading || !email || !password || !confirmPassword || !displayName}
				on:click={() => {
					console.log('Email:', email);
					console.log('Password:', password);
					console.log('Confirm Password:', confirmPassword);
					console.log('Display Name:', displayName);
					console.log('Loading:', loading);
				}}
			>
				{loading ? 'Creating account...' : 'Create account'}
			</Button>
		</form>

		<div class="mt-6">
			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-300" />
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="px-2 bg-white text-gray-500">Already have an account?</span>
				</div>
			</div>

			<div class="mt-6">
				<Button variant="outline" fullWidth>
					<a href="/login" class="w-full">Sign in to your account</a>
				</Button>
			</div>
		</div>
	{/if}
</div>