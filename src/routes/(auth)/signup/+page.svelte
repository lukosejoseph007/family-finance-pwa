<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Input } from '$lib/components';
	import { signUp, signInWithGoogle } from '$lib/supabaseClient';
	import { joinFamily, findFamilyByInviteCode } from '$lib/services/familyService';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let displayName = $state('');
	let inviteCode = $state('');
	let loading = $state(false);
	let googleLoading = $state(false);
	let error = $state('');
	let success = $state(false);
	let familyPreview = $state('');

	// Validate invite code when it's entered (using new system)
	$effect(() => {
		if (inviteCode && inviteCode.length >= 6) {
			console.log('🔍 Validating invite code:', inviteCode);
			validateInviteCode();
		} else {
			familyPreview = '';
		}
	});

	async function validateInviteCode() {
		try {
			const family = await findFamilyByInviteCode(inviteCode);
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

	async function handleSignup(event: SubmitEvent) {
		event.preventDefault();
		
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
			// Create a mock submit event for the handler
			const submitEvent = new Event('submit') as SubmitEvent;
			handleSignup(submitEvent);
		}
	}

	async function handleGoogleSignUp() {
		try {
			googleLoading = true;
			error = '';
			
			// Store invite code for post-OAuth processing if provided
			if (inviteCode) {
				sessionStorage.setItem('pendingInviteCode', inviteCode);
				sessionStorage.setItem('pendingDisplayName', displayName || '');
			}
			
			const result = await signInWithGoogle();
			
			// For popup flow, result contains user/session data
			// For redirect flow, the OAuth redirect will handle navigation
			if (result && typeof result === 'object' && (result as any).user) {
				console.log('✅ Google OAuth completed successfully');
				// Refresh the page to trigger auth state change
				window.location.reload();
			}
		} catch (err: any) {
			error = err.message || 'Failed to sign up with Google';
			googleLoading = false;
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

		<form onsubmit={handleSignup} class="space-y-6">
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
					<div class="w-full border-t border-gray-300"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="px-2 bg-white text-gray-500">Or continue with</span>
				</div>
			</div>

			<div class="mt-6">
				<Button
					variant="outline"
					fullWidth
					loading={googleLoading}
					disabled={googleLoading || loading}
					on:click={handleGoogleSignUp}
				>
					<div class="flex items-center justify-center">
						<svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						{googleLoading ? 'Signing up...' : 'Continue with Google'}
					</div>
				</Button>
			</div>
		</div>

		<div class="mt-6">
			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-300"></div>
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