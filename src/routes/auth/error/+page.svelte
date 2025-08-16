<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '$lib/store';

	const message = $page.url.searchParams.get('message') || 'Authentication error occurred';
	
	let showError = $state(false);
	let isCheckingAuth = $state(true);

	// Check if this might be an OAuth callback in progress
	const hasOAuthParams = $page.url.searchParams.has('code') ||
	                      $page.url.searchParams.has('access_token') ||
	                      message.toLowerCase().includes('verification');

	// Check if user is actually authenticated despite the error
	onMount(() => {
		// If this looks like an OAuth callback, give it more time
		const delay = hasOAuthParams ? 2000 : 1000;
		
		setTimeout(() => {
			if ($user) {
				console.log('🔄 User is authenticated despite error screen, redirecting...');
				goto('/onboarding');
			} else {
				// Only show error if user is still not authenticated after delay
				isCheckingAuth = false;
				showError = true;
			}
		}, delay);
	});

	// Also check when user state changes
	$effect(() => {
		if ($user) {
			console.log('🔄 User authenticated, leaving error screen...');
			goto('/onboarding');
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
	{#if isCheckingAuth}
		<!-- Show loading while checking auth state -->
		<div class="max-w-md w-full space-y-8 p-8 text-center">
			<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
				<svg class="h-6 w-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
			</div>
			<h2 class="mt-6 text-xl font-bold text-gray-900">
				Completing authentication...
			</h2>
			<p class="mt-2 text-sm text-gray-600">
				Please wait while we verify your sign-in.
			</p>
		</div>
	{:else if showError}
		<!-- Show actual error only if auth check failed -->
	<div class="max-w-md w-full space-y-8 p-8">
		<div class="text-center">
			<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
				<svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
			</div>
			<h2 class="mt-6 text-3xl font-extrabold text-gray-900">
				Authentication Error
			</h2>
			<p class="mt-2 text-sm text-gray-600">
				{message}
			</p>
		</div>

		<div class="space-y-4">
			<a href="/signup" class="w-full">
				<Button fullWidth>
					Try Signing Up Again
				</Button>
			</a>
			<a href="/login" class="w-full">
				<Button variant="outline" fullWidth>
					Back to Login
				</Button>
			</a>
		</div>
	</div>
	{/if}
</div>